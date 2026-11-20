#!/usr/bin/env python3
"""Import whole-scene Lisbon district paintings.

Reads <scene>/districts.json and <scene>/output/<ID>.png district images,
feather-blends them into one 3072x3072 RGBA map painting, slices it into
overlapping chunks (WebP), and generates src/game/images/hd/hdSceneManifest.ts.

Idempotent: re-run after new district art lands. Missing art is simply absent.
"""

import argparse
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

TILE_PX = 32
MAP_TILES = 96
MAP_PX = MAP_TILES * TILE_PX  # 3072
WINDOW_TILES = (48, 32)
CHUNK = 512
CHUNKS = MAP_PX // CHUNK  # 6
FEATHER_PX = TILE_PX  # 32px ramp centred on owned-rect edges
KERNEL = FEATHER_PX + 1  # 33px box blur

REPO = Path(__file__).resolve().parents[2]
DEFAULT_SCENE = REPO.parent / 'uncharted-waters-2' / 'art' / 'chatgpt' / 'scene'
OUT_DIR = REPO / 'src' / 'game' / 'images' / 'hd' / 'scene'
MANIFEST = REPO / 'src' / 'game' / 'images' / 'hd' / 'hdSceneManifest.ts'


def rect_mask(rects, inset=None):
    """Rasterise tile rects to a 3072x3072 binary mask (float 0..1)."""
    mask = np.zeros((MAP_PX, MAP_PX), dtype=np.float32)
    for x0, y0, x1, y1 in rects:
        if inset:
            x0 += inset[0]
            y0 += inset[1]
            x1 -= inset[2]
            y1 -= inset[3]
        px0 = max(0, int(round(x0 * TILE_PX)))
        py0 = max(0, int(round(y0 * TILE_PX)))
        px1 = min(MAP_PX, int(round(x1 * TILE_PX)))
        py1 = min(MAP_PX, int(round(y1 * TILE_PX)))
        if px1 > px0 and py1 > py0:
            mask[py0:py1, px0:px1] = 1.0
    return mask


def window_mask(window):
    mask = np.zeros((MAP_PX, MAP_PX), dtype=np.float32)
    px0 = int(round(window[0] * TILE_PX))
    py0 = int(round(window[1] * TILE_PX))
    px1 = px0 + WINDOW_TILES[0] * TILE_PX
    py1 = py0 + WINDOW_TILES[1] * TILE_PX
    mask[py0:py1, px0:px1] = 1.0
    return mask


def feather(mask):
    """Linear 32px ramp centred on mask edges; map borders replicate, not fade."""
    padded = np.pad(mask, FEATHER_PX, mode='edge')
    img = Image.fromarray((padded * 255).astype(np.uint8))
    img = img.filter(ImageFilter.BoxBlur(KERNEL // 2))
    out = np.asarray(img).astype(np.float32) / 255.0
    return out[FEATHER_PX:-FEATHER_PX, FEATHER_PX:-FEATHER_PX]


def pilot_inset(window):
    """Inset the pilot window by 1 tile on each side that is not a map edge."""
    x0, y0 = window
    x1 = x0 + WINDOW_TILES[0]
    y1 = y0 + WINDOW_TILES[1]
    return (
        1.0 if x0 > 0 else 0.0,
        1.0 if y0 > 0 else 0.0,
        1.0 if x1 < MAP_TILES else 0.0,
        1.0 if y1 < MAP_TILES else 0.0,
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--scene',
        type=Path,
        default=DEFAULT_SCENE,
        help='scene art directory (contains districts.json and output/)',
    )
    args = parser.parse_args()
    meta = json.loads((args.scene / 'districts.json').read_text())
    output = args.scene / 'output'

    used = []

    def load_rgb(path):
        img = Image.open(path).convert('RGB')
        if img.size != (1536, 1024):
            img = img.resize((1536, 1024), Image.LANCZOS)
        return np.asarray(img).astype(np.float32)

    def place(rgb, window, omask):
        """Accumulate a district image into map-space buffers at its window."""
        nonlocal acc_rgb, acc_w
        full = np.zeros((MAP_PX, MAP_PX, 3), dtype=np.float32)
        px0 = int(round(window[0] * TILE_PX))
        py0 = int(round(window[1] * TILE_PX))
        full[py0 : py0 + 1024, px0 : px0 + 1536] = rgb
        acc_rgb += full * omask[:, :, None]
        acc_w += omask

    acc_rgb = np.zeros((MAP_PX, MAP_PX, 3), dtype=np.float32)
    acc_w = np.zeros((MAP_PX, MAP_PX), dtype=np.float32)

    for did in meta['order']:
        path = output / f'{did}.png'
        if not path.exists():
            continue
        district = meta['districts'][did]
        window = district['window']
        omask = feather(rect_mask(district['owned'])) * window_mask(window)
        place(load_rgb(path), window, omask)
        used.append(did)

    # pilot: only while C2.png does not exist
    pilot_used = False
    if not (output / 'C2.png').exists():
        pilot = meta['pilot']
        path = output / pilot['file']
        if path.exists():
            window = pilot['window']
            x0, y0 = window
            owned = [[x0, y0, x0 + WINDOW_TILES[0], y0 + WINDOW_TILES[1]]]
            mask = rect_mask(owned, inset=pilot_inset(window))
            omask = feather(mask) * window_mask(window)
            place(load_rgb(path), window, omask)
            pilot_used = True

    w = np.clip(acc_w, 0.0, 1.0)
    safe_w = np.maximum(acc_w, 1e-6)
    rgb = np.clip(acc_rgb / safe_w[:, :, None], 0, 255)
    alpha = (w * 255).astype(np.float32)

    # patches: alpha-composite over the district blend using their
    # feathered owned mask; missing files are skipped silently
    patches_used = []
    for pid, patch in (meta.get('patches') or {}).items():
        path = output / f'{pid}.png'
        if not path.exists():
            continue
        omask = feather(rect_mask(patch['owned'])) * window_mask(patch['window'])
        prgb = load_rgb(path)
        full = np.zeros((MAP_PX, MAP_PX, 3), dtype=np.float32)
        px0 = int(round(patch['window'][0] * TILE_PX))
        py0 = int(round(patch['window'][1] * TILE_PX))
        full[py0 : py0 + 1024, px0 : px0 + 1536] = prgb
        m = omask[:, :, None]
        rgb = full * m + rgb * (1.0 - m)
        alpha = 255.0 * omask + alpha * (1.0 - omask)
        patches_used.append(pid)

    alpha8 = np.clip(alpha, 0, 255).astype(np.uint8)
    canvas = np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), alpha8])
    painting = Image.fromarray(canvas)

    # --- animated-water mask ----------------------------------------------
    # Water in the painting is teal/blue (b >> r). Gate the colour test by
    # the legacy terrain water/ship class so teal roofs/props never mask.
    # WATER_SHIP_INDICES duplicates the 'water'/'ship' entries of
    # PORT_TERRAIN_TILESET_0 in src/data/portTerrain.ts — keep in sync.
    WATER_SHIP_INDICES = {
        52, 53, 60, 61, 62, 63, 64, 66, 67, 68, 69, 70, 71, 73, 84, 85, 86,
        105, 106, 107, 115, 116, 117, 118, 119, 124, 125, 126, 127, 128, 129,
        134, 135, 136, 137, 138, 139, 144, 145, 146, 147, 148, 149, 150, 151,
        153, 154, 155, 156, 157, 158, 159, 160, 161,
    }
    MASK_PX = 768  # 8 px per tile

    tilemap_path = REPO / 'src' / 'data' / 'assets' / 'portTilemaps.wasm'
    tilemap = tilemap_path.read_bytes()[: MAP_TILES * MAP_TILES]
    terrain = np.array(
        [t in WATER_SHIP_INDICES for t in tilemap], dtype=bool
    ).reshape(MAP_TILES, MAP_TILES)
    # dilate by ~1.5 tiles: 8-connected reach (sqrt(2) <= 1.5)
    dilated = terrain.copy()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            dilated[
                max(0, dy) : 96 + min(0, dy), max(0, dx) : 96 + min(0, dx)
            ] |= terrain[
                max(0, -dy) : 96 + min(0, -dy), max(0, -dx) : 96 + min(0, -dx)
            ]
    terrain_mask = (
        np.asarray(
            Image.fromarray(dilated.astype(np.uint8) * 255).resize(
                (MASK_PX, MASK_PX), Image.NEAREST
            )
        )
        > 0
    )

    small = np.asarray(
        painting.resize((MASK_PX, MASK_PX), Image.BILINEAR)
    ).astype(np.int32)
    sr, sg, sb, sa = small[:, :, 0], small[:, :, 1], small[:, :, 2], small[:, :, 3]
    smax = np.maximum(np.maximum(sr, sg), sb)
    smin = np.minimum(np.minimum(sr, sg), sb)
    sat = np.where(smax > 0, (smax - smin) / np.maximum(smax, 1), 0)
    water_colour = (sb > sr + 12) & (sg > sr + 5) & (sat > 0.2) & (sa > 200)
    water_mask_img = Image.fromarray(
        (water_colour & terrain_mask).astype(np.uint8) * 255
    ).filter(ImageFilter.GaussianBlur(1))
    water_mask = np.asarray(water_mask_img).astype(np.float32) / 255.0

    # debug overlay: mask tinted magenta over the painting
    dbg = np.asarray(painting.resize((MASK_PX, MASK_PX), Image.BILINEAR)).copy()
    wm = (water_mask > 0.4)[:, :, None]
    dbg[:, :, :3] = (
        dbg[:, :, :3] * (1 - wm * 0.5) + np.array([255, 0, 255]) * wm * 0.5
    ).astype(np.uint8)
    Image.fromarray(dbg).save('/tmp/uw2-water-mask-debug.png')

    # --- painted lamp detection -------------------------------------------
    # very bright warm pixels (lamp glows), outside water, small blobs only
    full_rgb = np.asarray(painting).astype(np.int32)
    fr, fg, fb = full_rgb[:, :, 0], full_rgb[:, :, 1], full_rgb[:, :, 2]
    water_full = (
        np.asarray(
            water_mask_img.resize((MAP_PX, MAP_PX), Image.NEAREST)
        )
        > 128
    )
    # tuned against /tmp/uw2-lamps-debug.png — strict amber thresholds keep
    # lit sconces/lantern heads while dropping pale sunlit highlights
    warm = (
        (fr > 240)
        & (fg > 196)
        & (fb < 158)
        & ((fr - fb) > 80)
        & ~water_full
        & (full_rgb[:, :, 3] > 200)
    )

    # connected components over the warm pixels (union via left/up runs);
    # parent[i] is the representative of label i, label 0 = background
    labels = np.zeros(warm.shape, dtype=np.int32)
    next_label = 0
    parent = [0]

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    ys, xs = np.where(warm)
    for y, x in zip(ys.tolist(), xs.tolist()):
        up = int(labels[y - 1, x]) if y > 0 else 0
        left = int(labels[y, x - 1]) if x > 0 else 0
        if up and left:
            ru, rl = find(up), find(left)
            if ru != rl:
                parent[rl] = ru
            labels[y, x] = ru
        elif up:
            labels[y, x] = find(up)
        elif left:
            labels[y, x] = find(left)
        else:
            next_label += 1
            parent.append(next_label)
            labels[y, x] = next_label

    comp_size = {}
    for y, x in zip(ys.tolist(), xs.tolist()):
        lab = find(int(labels[y, x]))
        if lab == 0:
            continue
        entry = comp_size.get(lab)
        if entry is None:
            comp_size[lab] = [1, x, y, x, x, y, y]
        else:
            entry[0] += 1
            entry[1] += x
            entry[2] += y
            entry[3] = min(entry[3], x)
            entry[4] = max(entry[4], x)
            entry[5] = min(entry[5], y)
            entry[6] = max(entry[6], y)

    lum = 0.35 * fr + 0.5 * fg + 0.15 * fb

    blobs = []
    for lab, (size, sx, sy, x0, x1, y0, y1) in comp_size.items():
        if not (20 <= size <= 900):
            continue
        cx, cy = sx / size, sy / size
        bw, bh = x1 - x0 + 1, y1 - y0 + 1
        fill = size / (bw * bh)
        # lamp glows are compact roundish amber blobs — reject elongated
        # highlights (wall caps) and scattered clusters (flowers)
        if fill < 0.5 or not (0.5 <= bw / bh <= 2.0):
            continue
        # mean colour inside the blob must be amber, not pale cream
        region = full_rgb[y0 : y1 + 1, x0 : x1 + 1]
        warm_sel = warm[y0 : y1 + 1, x0 : x1 + 1]
        if not warm_sel.any():
            continue
        mr = float(np.mean(region[:, :, 0][warm_sel]))
        mg = float(np.mean(region[:, :, 1][warm_sel]))
        mb = float(np.mean(region[:, :, 2][warm_sel]))
        if not (mb < 170 and mr - mb > 85):
            continue
        # local contrast: the blob must stand out from its surroundings —
        # rejects warm speckles sitting on already-bright sand
        r0, r1 = max(0, x0 - 10), min(MAP_PX, x1 + 11)
        b0, b1 = max(0, y0 - 10), min(MAP_PX, y1 + 11)
        ring = lum[b0:b1, r0:r1]
        blob_lum = float(np.mean(lum[y0 : y1 + 1, x0 : x1 + 1]))
        if blob_lum - float(np.mean(ring)) < 65:
            continue
        # dark anchor: lamp heads have a metal post/bracket/cap — require a
        # dark pixel within 12 px above or below the blob centre column
        anchor_found = False
        ac0, ac1 = max(0, int(cx) - 6), min(MAP_PX, int(cx) + 7)
        for band in (
            (max(0, y1 + 1), min(MAP_PX, y1 + 13)),
            (max(0, y0 - 12), max(0, y0)),
        ):
            if band[1] > band[0] and (lum[band[0] : band[1], ac0:ac1] < 75).any():
                anchor_found = True
                break
        if not anchor_found:
            continue
        blobs.append([cx, cy, size])

    # merge centroids closer than 40 px
    blobs.sort(key=lambda b: -b[2])
    lamps = []
    while blobs:
        bx, by, bs = blobs.pop(0)
        cluster = [(bx, by, bs)]
        rest = []
        for other in blobs:
            if (other[0] - bx) ** 2 + (other[1] - by) ** 2 < 40 * 40:
                cluster.append(other)
            else:
                rest.append(other)
        blobs = rest
        total = sum(c[2] for c in cluster)
        lamps.append(
            (
                sum(c[0] * c[2] for c in cluster) / total,
                sum(c[1] * c[2] for c in cluster) / total,
            )
        )

    # debug overlay: painting at 50% with circles on detections
    dbg2 = painting.resize((MAP_PX // 2, MAP_PX // 2), Image.BILINEAR).copy()
    from PIL import ImageDraw

    draw = ImageDraw.Draw(dbg2)
    for lx, ly in lamps:
        draw.ellipse(
            (lx / 2 - 8, ly / 2 - 8, lx / 2 + 8, ly / 2 + 8),
            outline=(255, 0, 255),
            width=3,
        )
    dbg2.save('/tmp/uw2-lamps-debug.png')

    # per-tile coverage: mean alpha >= 0.5
    coverage = []
    for ty in range(MAP_TILES):
        row = ''
        for tx in range(MAP_TILES):
            block = alpha[
                ty * TILE_PX : (ty + 1) * TILE_PX,
                tx * TILE_PX : (tx + 1) * TILE_PX,
            ]
            row += '1' if block.mean() >= 128 else '0'
        coverage.append(row)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for stale in OUT_DIR.glob('lisbon-*.webp'):
        stale.unlink()
    for stale in OUT_DIR.glob('lisbon-*.png'):
        stale.unlink()

    imports = []
    chunks = []
    for cy in range(CHUNKS):
        for cx in range(CHUNKS):
            x0 = cx * CHUNK
            y0 = cy * CHUNK
            # 1px overlap on right/bottom so linear filtering shows no seam
            x1 = min((cx + 1) * CHUNK + 1, MAP_PX)
            y1 = min((cy + 1) * CHUNK + 1, MAP_PX)
            chunk = painting.crop((x0, y0, x1, y1))
            if chunk.split()[3].getextrema()[1] == 0:
                continue
            name = f'lisbon-{cx}-{cy}'
            chunk.save(OUT_DIR / f'{name}.webp', 'WEBP', quality=92, method=6)
            var = name.replace('-', '_')
            imports.append(f"import s_{var} from './scene/{name}.webp';")
            chunks.append(
                f"  {{ cx: {cx}, cy: {cy}, url: s_{var} }},"
            )

    # water mask chunk: white RGB, alpha = soft mask
    has_mask = bool((water_mask > 0.05).any())
    mask_import = ''
    if has_mask:
        mask_rgba = np.zeros((MASK_PX, MASK_PX, 4), dtype=np.uint8)
        mask_rgba[:, :, 0:3] = 255
        mask_rgba[:, :, 3] = (water_mask * 255).astype(np.uint8)
        Image.fromarray(mask_rgba).save(
            OUT_DIR / 'lisbon-water-mask.webp', 'WEBP', quality=95, method=6
        )
        mask_import = "import s_water_mask from './scene/lisbon-water-mask.webp';"

    lamps_ts = '\n'.join(
        f'  {{ x: {int(round(lx))}, y: {int(round(ly))} }},' for lx, ly in lamps
    )
    coverage_ts = ',\n'.join(f"  '{row}'" for row in coverage)
    manifest = f"""/* eslint-disable */
// Generated by scripts/art/import-scene.py — do not edit; re-run the script.
{chr(10).join(imports)}
{mask_import}

export interface HdSceneChunk {{
  cx: number;
  cy: number;
  url: string;
}}

// world-px size of one scene chunk before its 1px overlap border
export const HD_SCENE_CHUNK_PX = {CHUNK};
// world px per tile in the scene painting
export const HD_SCENE_TILE_PX = {TILE_PX};

export const hdSceneChunks: HdSceneChunk[] = [
{chr(10).join(chunks)}
];

// soft water mask for animated streaks over the painting, or null when no
// scene art exists
export const hdSceneWaterMask: string | null = {'s_water_mask' if has_mask else 'null'};

// painted lamp positions in map px — get warm glows at night
export const HD_SCENE_LAMPS: {{ x: number; y: number }}[] = [
{lamps_ts}
];

export const HD_SCENE_COVERAGE: string[] = [
{coverage_ts}
];

export const isSceneCovered = (tx: number, ty: number): boolean =>
  ty >= 0 &&
  ty < HD_SCENE_COVERAGE.length &&
  tx >= 0 &&
  tx < HD_SCENE_COVERAGE[ty].length &&
  HD_SCENE_COVERAGE[ty][tx] === '1';
"""
    MANIFEST.write_text(manifest)
    print(
        json.dumps(
            {
                'districts': used,
                'patches': patches_used,
                'pilot': pilot_used,
                'chunks': len(chunks),
                'lamps': len(lamps),
                'waterMask': has_mask,
            }
        )
    )


if __name__ == '__main__':
    main()
