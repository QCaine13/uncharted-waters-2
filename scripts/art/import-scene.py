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
    alpha = (w * 255).astype(np.uint8)
    canvas = np.dstack([rgb.astype(np.uint8), alpha])
    painting = Image.fromarray(canvas)

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

    coverage_ts = ',\n'.join(f"  '{row}'" for row in coverage)
    manifest = f"""/* eslint-disable */
// Generated by scripts/art/import-scene.py — do not edit; re-run the script.
{chr(10).join(imports)}

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
    print(json.dumps({'districts': used, 'pilot': pilot_used, 'chunks': len(chunks)}))


if __name__ == '__main__':
    main()
