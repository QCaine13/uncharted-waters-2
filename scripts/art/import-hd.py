#!/usr/bin/env python3
"""Import HD Lisbon art into src/game/images/hd and regenerate hdManifest.ts.

Idempotent: generated output dirs are wiped and rebuilt from whatever art
currently exists. Missing inputs are simply absent from the manifest.

Usage: import-hd.py [--art DIR] [--repo DIR]
"""
import argparse
import json
import re
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageFilter

HD_TILE = 64           # px per tile in imported building overlays
GROUND_SIZE = 512
CHAR_FRAME = 256       # character strip frame size
EXPECTED_FRAMES = {8, 2}

GROUND_KEYS = ['grass', 'sand', 'cobble', 'water', 'water-shore']
PROP_IDS = [
    'tree-1', 'tree-2', 'cypress', 'bush-1', 'bush-2',
    'flowerpot', 'lantern-post', 'crate', 'barrel',
    # optional replacements for the legacy hull clusters when they appear
    'ship-anchored', 'ship-anchored-2', 'boat-beached-1', 'boat-beached-2',
]
# ids whose images tile horizontally across detected wall extents
TILED_IDS = {'city-wall-segment', 'palace-wall-segment'}
# ids that may appear at several positions (detected by matching tile data)
DETECT_IDS = {'palace-w', 'city-wall-segment', 'palace-wall-segment'}
# ids whose art is unusable as an overlay (kept on the legacy tiles)
EXCLUDE_IDS = set()


def load_terrain_classes(repo: Path):
    src = (repo / 'src/data/portTerrain.ts').read_text()
    body = src.split('PORT_TERRAIN_TILESET_0: PortTerrainClass[] = [', 1)[1].split('];', 1)[0]
    classes = re.findall(r"'(grass|sand|cobble|water|building|tree|shadow|ship)'", body)
    if len(classes) != 240:
        raise SystemExit(f'portTerrain.ts: expected 240 classes, got {len(classes)}')
    return classes


def find_placements(tilemap, columns, rows, rect):
    pat = bytes(
        tilemap[(rect['y'] + dy) * columns + rect['x'] + dx]
        for dy in range(rect['rows'])
        for dx in range(rect['columns'])
    )
    hits = []
    for y in range(rows - rect['rows'] + 1):
        base = y * columns
        for x in range(columns - rect['columns'] + 1):
            ok = True
            for dy in range(rect['rows']):
                off = base + dy * columns + x
                if tilemap[off:off + rect['columns']] != pat[dy * rect['columns']:(dy + 1) * rect['columns']]:
                    ok = False
                    break
            if ok:
                hits.append((x, y))
    return hits


def extend_walls(placements, classes, tilemap):
    """Grow tiled wall extents sideways while the band's middle row is still
    'building'-class, so the art reaches the edge of the opening (gate)."""
    def wall_at(x, y):
        return classes[tilemap[y * 96 + x]] == 'building'

    out = []
    for p in placements:
        y = p['y'] + p['rows'] // 2
        x0, x1 = p['x'], p['x'] + p['columns'] - 1
        # extend while wall columns continue; bridge a single non-wall
        # column when a wall column follows it (covers gate pillars)
        while x0 > 0:
            if wall_at(x0 - 1, y) or (x0 > 1 and wall_at(x0 - 2, y)
                                      and classes[tilemap[y * 96 + x0 - 1]] != 'cobble'):
                x0 -= 1
            else:
                break
        while x1 < 95:
            if wall_at(x1 + 1, y) or (x1 < 94 and wall_at(x1 + 2, y)
                                      and classes[tilemap[y * 96 + x1 + 1]] != 'cobble'):
                x1 += 1
            else:
                break
        out.append({'x': x0, 'y': p['y'], 'columns': x1 - x0 + 1, 'rows': p['rows']})
    return out


def merge_runs(hits, w, h):
    """Merge sliding-window hits at the same y into extents."""
    by_y = {}
    for x, y in hits:
        by_y.setdefault(y, []).append(x)
    rects = []
    for y, xs in sorted(by_y.items()):
        xs = sorted(xs)
        start = prev = xs[0]
        for x in xs[1:]:
            if x != prev + 1:
                rects.append({'x': start, 'y': y, 'columns': prev - start + w, 'rows': h})
                start = x
            prev = x
        rects.append({'x': start, 'y': y, 'columns': prev - start + w, 'rows': h})
    return rects


def load_entrances(repo: Path):
    """Entrance (door) tiles for Lisbon: each portData.buildings position."""
    src = (repo / 'src/data/portData.ts').read_text()
    block = src.split('buildings: {', 1)[1].split('}', 1)[0]
    return [(int(x), int(y)) for x, y in re.findall(r"'\d+':\s*\{\s*x:\s*(\d+),\s*y:\s*(\d+)", block + '}')]


def opaque_bbox(img: Image.Image, px_per_tile: float):
    """Bounding box of non-transparent pixels, in tile units."""
    alpha = img.getchannel('A')
    box = alpha.getbbox()
    if not box:
        return None
    return tuple(v / px_per_tile for v in box)


def building_footprint(classes, tilemap, rect):
    """Bounding box of 'building'-class tiles inside a tileRect (tile units)."""
    xs, ys = [], []
    for dy in range(rect['rows']):
        for dx in range(rect['columns']):
            idx = tilemap[(rect['y'] + dy) * 96 + rect['x'] + dx]
            if classes[idx] == 'building':
                xs.append(dx)
                ys.append(dy)
    if not xs:
        return None
    return (min(xs), min(ys), max(xs) + 1, max(ys) + 1)


def alignment(src_img, rect, classes, tilemap):
    """Center offset between the art's opaque bbox and the building footprint.

    Returns (dx, dy) in tile units the overlay should be translated by, or
    None when aligned within half a tile.
    """
    fp = building_footprint(classes, tilemap, rect)
    art = opaque_bbox(src_img, src_img.width / rect['columns'])
    if not fp or not art:
        return None
    dx = (fp[0] + fp[2]) / 2 - (art[0] + art[2]) / 2
    dy = (fp[1] + fp[3]) / 2 - (art[1] + art[3]) / 2
    if abs(dx) <= 0.5 and abs(dy) <= 0.5:
        return None
    return (round(dx, 2), round(dy, 2))


def bake_emissive(img: Image.Image):
    """Extract warm bright pixels (lanterns/windows) and blur them."""
    rgba = img.convert('RGBA')
    px = rgba.load()
    w, h = rgba.size
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    opx = out.load()
    found = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 128 and r > 170 and g > 110 and r > g * 1.1 and g > b * 1.4:
                opx[x, y] = (r, g, b, min(255, a))
                found += 1
    if found < 12:
        return None
    return out.filter(ImageFilter.GaussianBlur(6))


def bake_shadow(img: Image.Image, tiled: bool):
    """Silhouette drop shadow from the art's own alpha: blurred dark shape,
    so the contact shadow hugs the building's silhouette instead of its
    bounding rect. Tiled walls only cast along the bottom edge."""
    rgba = img.convert('RGBA')
    w, h = rgba.size
    alpha = rgba.split()[3].point(lambda a: 77 if a > 48 else 0)
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    out.putalpha(alpha)
    if tiled:
        # keep only the bottom ~0.6 tile of silhouette
        cut = int(h - HD_TILE * 0.6)
        strip = out.crop((0, cut, w, h))
        out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        out.paste(strip, (0, cut), strip)
    return out.filter(ImageFilter.GaussianBlur(HD_TILE * 0.25))


def js_id(name):
    return re.sub(r'[^a-zA-Z0-9]', '_', name)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--art', default='/Users/qsirhome/uncharted-waters-2/art/chatgpt/output')
    ap.add_argument('--repo', default=str(Path(__file__).resolve().parents[2]))
    args = ap.parse_args()

    art = Path(args.art)
    repo = Path(args.repo)
    out_dir = repo / 'src/game/images/hd'
    lisbon_dir = out_dir / 'lisbon' / 'buildings'
    char_dir = out_dir / 'characters'
    ground_dir = out_dir / 'ground'
    prop_dir = out_dir / 'props'

    layout_path = art.parent / 'layout' / 'manifest.json'
    layout = json.loads(layout_path.read_text()) if layout_path.exists() else {'buildings': []}
    classes = load_terrain_classes(repo)
    entrances = load_entrances(repo)
    tilemap = (repo / 'src/data/assets/portTilemaps.wasm').read_bytes()[: 96 * 96]

    for d in (lisbon_dir, char_dir, ground_dir, prop_dir):
        shutil.rmtree(d, ignore_errors=True)
        d.mkdir(parents=True)

    imports = []
    buildings_ts = []
    placed = {}
    found = {'buildings': [], 'characters': [], 'ground': [], 'props': []}

    for b in layout.get('buildings', []):
        bid = b['id']
        rect = b['tileRect']
        src = art / 'buildings' / f'{bid}.png'
        if not src.exists() or bid in EXCLUDE_IDS:
            continue

        if bid in DETECT_IDS:
            hits = find_placements(tilemap, 96, 96, rect)
        else:
            hits = [(rect['x'], rect['y'])]
        placements = merge_runs(hits, rect['columns'], rect['rows']) if bid in TILED_IDS else [
            {'x': x, 'y': y, 'columns': rect['columns'], 'rows': rect['rows']} for x, y in hits
        ]
        if bid == 'city-wall-segment':
            placements = extend_walls(placements, classes, tilemap)
        if not placements:
            print(f'  ! {bid}: no placements detected, skipped')
            continue

        w, h = rect['columns'] * HD_TILE, rect['rows'] * HD_TILE
        src_img = Image.open(src).convert('RGBA')
        adjust = alignment(src_img, rect, classes, tilemap)
        img = src_img.resize((w, h), Image.LANCZOS)
        img.save(lisbon_dir / f'{bid}.png')

        var = js_id(bid)
        imports.append(f"import b_{var} from './lisbon/buildings/{bid}.png';")

        emissive = bake_emissive(img)
        emissive_ts = 'null'
        if emissive is not None:
            emissive.save(lisbon_dir / f'{bid}-emissive.png')
            imports.append(f"import b_{var}_e from './lisbon/buildings/{bid}-emissive.png';")
            emissive_ts = f'b_{var}_e'

        shadow = bake_shadow(img, bid in TILED_IDS)
        shadow.save(lisbon_dir / f'{bid}-shadow.png')
        imports.append(f"import b_{var}_s from './lisbon/buildings/{bid}-shadow.png';")
        shadow_ts = f'b_{var}_s'

        pl_ts = ', '.join(
            f"{{ x: {p['x']}, y: {p['y']}, columns: {p['columns']}, rows: {p['rows']} }}"
            for p in placements
        )
        adjust_ts = (
            f'{{ x: {adjust[0]}, y: {adjust[1]} }}' if adjust else 'null'
        )
        tile_ts = 'true' if bid in TILED_IDS else 'false'
        buildings_ts.append(
            f"  {{ url: b_{var}, emissive: {emissive_ts}, shadow: {shadow_ts}, adjust: {adjust_ts}, tile: {tile_ts}, placements: [{pl_ts}] }},"
        )
        if adjust:
            print(f'  ~ {bid}: alignment offset {adjust[0]},{adjust[1]} tiles')
        placed[bid] = (placements, adjust)
        found['buildings'].append(bid)

    characters_ts = []
    for src in sorted((art / 'characters').glob('*-strip.png')) if (art / 'characters').exists() else []:
        cid = src.name[:-len('-strip.png')]
        img = Image.open(src)
        frames = img.width // CHAR_FRAME
        if img.height != CHAR_FRAME or img.width % CHAR_FRAME:
            print(f'  ! character {cid}: unexpected size {img.size}, skipped')
            continue
        if frames not in EXPECTED_FRAMES:
            print(f'  ! character {cid}: {frames} frames (expected 2 or 8), imported anyway')
        img.save(char_dir / f'{cid}.png')
        var = js_id(cid)
        imports.append(f"import c_{var} from './characters/{cid}.png';")
        characters_ts.append(f"  '{cid}': {{ url: c_{var}, frames: {frames} }},")
        found['characters'].append(cid)

    ground_ts = []
    for key in GROUND_KEYS:
        src = art / 'ground' / f'{key}.png'
        if not src.exists():
            continue
        Image.open(src).convert('RGB').resize((GROUND_SIZE, GROUND_SIZE), Image.LANCZOS).save(
            ground_dir / f'{key}.png'
        )
        var = js_id(key)
        imports.append(f"import g_{var} from './ground/{key}.png';")
        ground_ts.append(f"  '{key}': g_{var},")
        found['ground'].append(key)

    props_ts = []
    for pid in PROP_IDS:
        src = art / 'props' / f'{pid}.png'
        if not src.exists():
            continue
        shutil.copy(src, prop_dir / f'{pid}.png')
        var = js_id(pid)
        imports.append(f"import p_{var} from './props/{pid}.png';")
        props_ts.append(f"  '{pid}': p_{var},")
        found['props'].append(pid)

    manifest = f'''/* eslint-disable */
// Generated by scripts/art/import-hd.py — do not edit; re-run the script.
{chr(10).join(imports) if imports else '// (no HD art imported yet)'}

export interface HdPlacement {{
  x: number;
  y: number;
  columns: number;
  rows: number;
}}

export interface HdBuilding {{
  url: string;
  emissive: string | null;
  shadow: string | null;
  // uniform tile-unit translation when the art's opaque bbox is offset from
  // the building-tile footprint inside its rect (null = no correction)
  adjust: {{ x: number; y: number }} | null;
  // true: repeat the art horizontally at its native rect aspect (walls)
  tile: boolean;
  placements: HdPlacement[];
}}

export const hdBuildings: HdBuilding[] = [
{chr(10).join(buildings_ts)}
];

export const hdCharacters: {{ [id: string]: {{ url: string; frames: number }} }} = {{
{chr(10).join(characters_ts)}
}};

export const hdGround: {{ [kind: string]: string }} = {{
{chr(10).join(ground_ts)}
}};

export const hdGroundComplete = {str(len(found["ground"]) == len(GROUND_KEYS)).lower()};

export const hdProps: {{ [id: string]: string }} = {{
{chr(10).join(props_ts)}
}};
'''
    (out_dir / 'hdManifest.ts').write_text(manifest)
    print('imported:', json.dumps(found))
    write_align_debug(art, layout, placed, classes, tilemap, entrances)


CLASS_COLORS = {
    'grass': (90, 140, 80), 'sand': (210, 190, 140),
    'cobble': (150, 150, 150), 'water': (40, 80, 140),
    'building': (60, 60, 60), 'tree': (30, 90, 40),
    'shadow': (40, 40, 50), 'ship': (20, 60, 110),
}


def write_align_debug(art, layout, placed, classes, tilemap, entrances,
                      out='/tmp/uw2-hd-align.png', scale=8):
    """Town render: terrain colours + overlays + collision (red/orange for
    blocked/half-blocked tiles) + entrance tiles (green)."""
    img = Image.new('RGB', (96 * scale, 96 * scale))
    px = img.load()
    for ty in range(96):
        for tx in range(96):
            color = CLASS_COLORS[classes[tilemap[ty * 96 + tx]]]
            for dy in range(scale):
                for dx in range(scale):
                    px[tx * scale + dx, ty * scale + dy] = color

    for b in layout.get('buildings', []):
        src = art / 'buildings' / f"{b['id']}.png"
        if not src.exists() or b['id'] not in placed:
            continue
        art_img = Image.open(src).convert('RGBA')
        placements, adjust = placed[b['id']]
        ax, ay = adjust if adjust else (0, 0)
        for p in placements:
            tile_art = art_img.resize(
                (p['columns'] * scale, p['rows'] * scale), Image.LANCZOS)
            img.paste(
                tile_art,
                (round((p['x'] + ax) * scale), round((p['y'] + ay) * scale)),
                tile_art,
            )

    tint = Image.new('RGBA', img.size, (0, 0, 0, 0))
    tpx = tint.load()
    for ty in range(96):
        for tx in range(96):
            t = tilemap[ty * 96 + tx]
            color = (255, 0, 0, 90) if t >= 40 else (
                (255, 140, 0, 70) if t >= 29 else None)
            if color:
                for dy in range(scale):
                    for dx in range(scale):
                        tpx[tx * scale + dx, ty * scale + dy] = color
    for ex, ey in entrances:
        for dy in range(2):
            for dx in range(2):
                for sy in range(scale):
                    for sx in range(scale):
                        tpx[(ex + dx) * scale + sx, (ey + dy) * scale + sy] = (
                            0, 255, 0, 110)
    Image.alpha_composite(img.convert('RGBA'), tint).save(out)
    print(f'alignment debug: {out}')


if __name__ == '__main__':
    main()
