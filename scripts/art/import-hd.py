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
]
# ids whose images tile horizontally across detected wall extents
TILED_IDS = {'city-wall-segment', 'palace-wall-segment'}
# ids that may appear at several positions (detected by matching tile data)
DETECT_IDS = {'palace-w', 'city-wall-segment', 'palace-wall-segment'}


def load_terrain_classes(repo: Path):
    src = (repo / 'src/data/portTerrain.ts').read_text()
    body = src.split('PORT_TERRAIN_TILESET_0: PortTerrainClass[] = [', 1)[1]
    classes = re.findall(r"'(grass|sand|cobble|water|building|tree|shadow)'", body)
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


def building_mask(classes, tilemap, rect, out_w, out_h):
    """Alpha mask: transparent where the underlying tile is not 'building'."""
    mask = Image.new('L', (rect['columns'], rect['rows']), 0)
    px = mask.load()
    for dy in range(rect['rows']):
        for dx in range(rect['columns']):
            idx = tilemap[(rect['y'] + dy) * 96 + rect['x'] + dx]
            if classes[idx] == 'building':
                px[dx, dy] = 255
    return mask.resize((out_w, out_h), Image.NEAREST)


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
    tilemap = (repo / 'src/data/assets/portTilemaps.wasm').read_bytes()[: 96 * 96]

    for d in (lisbon_dir, char_dir, ground_dir, prop_dir):
        shutil.rmtree(d, ignore_errors=True)
        d.mkdir(parents=True)

    imports = []
    buildings_ts = []
    found = {'buildings': [], 'characters': [], 'ground': [], 'props': []}

    for b in layout.get('buildings', []):
        bid = b['id']
        rect = b['tileRect']
        src = art / 'buildings' / f'{bid}.png'
        if not src.exists():
            continue

        if bid in DETECT_IDS:
            hits = find_placements(tilemap, 96, 96, rect)
        else:
            hits = [(rect['x'], rect['y'])]
        placements = merge_runs(hits, rect['columns'], rect['rows']) if bid in TILED_IDS else [
            {'x': x, 'y': y, 'columns': rect['columns'], 'rows': rect['rows']} for x, y in hits
        ]
        if not placements:
            print(f'  ! {bid}: no placements detected, skipped')
            continue

        w, h = rect['columns'] * HD_TILE, rect['rows'] * HD_TILE
        img = Image.open(src).convert('RGBA').resize((w, h), Image.LANCZOS)
        mask = building_mask(classes, tilemap, rect, w, h)
        alpha = img.getchannel('A')
        from PIL import ImageChops
        img.putalpha(ImageChops.multiply(alpha, mask))
        img.save(lisbon_dir / f'{bid}.png')

        var = js_id(bid)
        imports.append(f"import b_{var} from './lisbon/buildings/{bid}.png';")

        emissive = bake_emissive(img)
        emissive_ts = 'null'
        if emissive is not None:
            emissive.save(lisbon_dir / f'{bid}-emissive.png')
            imports.append(f"import b_{var}_e from './lisbon/buildings/{bid}-emissive.png';")
            emissive_ts = f'b_{var}_e'

        pl_ts = ', '.join(
            f"{{ x: {p['x']}, y: {p['y']}, columns: {p['columns']}, rows: {p['rows']} }}"
            for p in placements
        )
        buildings_ts.append(f"  {{ url: b_{var}, emissive: {emissive_ts}, placements: [{pl_ts}] }},")
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


if __name__ == '__main__':
    main()
