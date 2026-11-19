/**
 * Bakes the HD Lisbon ground: per-tile terrain class resolution, organic
 * class edges, texture compositing and prop/shadow placement. Runs once per
 * port entry; deterministic so re-entry produces identical output.
 */
import { portTerrainClass, PortTerrainClass } from '../data/portTerrain';
import { TILE_SIZE } from '../constants';
import type { Position } from '../types';

/* eslint-disable no-bitwise, no-continue, prefer-destructuring, no-param-reassign */
const MAP_TILES = 96;
const CHUNK_TILES = 48; // 48*32 = 1536px, under the 2048 texture limit

type GroundClass = 'grass' | 'sand' | 'cobble' | 'water' | 'building';

export interface HdChunk {
  canvas: HTMLCanvasElement;
  x: number;
  y: number;
}

export interface HdPropPlacement {
  id: string;
  x: number;
  y: number; // world px of the prop's ground contact (bottom edge)
}

export interface HdBlob {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

export interface HdGroundBake {
  landChunks: HdChunk[];
  waterChunks: HdChunk[];
  waterTiles: Position[];
  props: HdPropPlacement[];
  blobShadows: HdBlob[];
  lanternSpots: Position[];
  buildingShadows: { x: number; y: number; width: number; height: number }[];
}

const hash2 = (x: number, y: number, seed: number): number => {
  let h = Math.imul(x + seed, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// Smooth value noise, period-locked so edges look organic not random.
const valueNoise = (x: number, y: number, scale: number, seed: number) => {
  const gx = x / scale;
  const gy = y / scale;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = gx - x0;
  const fy = gy - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const a = hash2(x0, y0, seed);
  const b = hash2(x0 + 1, y0, seed);
  const c = hash2(x0, y0 + 1, seed);
  const d = hash2(x0 + 1, y0 + 1, seed);

  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
};

const TRUE_GROUND = new Set<GroundClass>(['grass', 'sand', 'cobble', 'water']);

const resolveClasses = (
  tileAt: (position: Position) => number,
  covered: boolean[][],
): { classes: GroundClass[][]; raw: PortTerrainClass[][] } => {
  const raw: PortTerrainClass[][] = [];
  const classes: GroundClass[][] = [];

  for (let y = 0; y < MAP_TILES; y += 1) {
    raw[y] = [];
    for (let x = 0; x < MAP_TILES; x += 1) {
      raw[y][x] = portTerrainClass(0, tileAt({ x, y })) ?? 'building';
    }
  }

  // Multi-source BFS: nearest true-ground class for every tile, so building,
  // tree and shadow tiles get the surrounding ground baked underneath
  // overlays and props (no legacy tiles peeking out around silhouettes).
  const nearest: (GroundClass | null)[][] = [];
  const queue: Position[] = [];
  for (let y = 0; y < MAP_TILES; y += 1) {
    nearest[y] = [];
    for (let x = 0; x < MAP_TILES; x += 1) {
      const cls = raw[y][x] as GroundClass;
      nearest[y][x] = TRUE_GROUND.has(cls) ? cls : null;
      if (nearest[y][x]) queue.push({ x, y });
    }
  }
  for (let head = 0; head < queue.length; head += 1) {
    const { x, y } = queue[head];
    const cls = nearest[y][x];
    for (let d = 0; d < 4; d += 1) {
      const nx = x + [1, -1, 0, 0][d];
      const ny = y + [0, 0, 1, -1][d];
      if (nx < 0 || ny < 0 || nx >= MAP_TILES || ny >= MAP_TILES) continue;
      if (nearest[ny][nx] !== null) continue;
      nearest[ny][nx] = cls;
      queue.push({ x: nx, y: ny });
    }
  }

  for (let y = 0; y < MAP_TILES; y += 1) {
    classes[y] = [];
    for (let x = 0; x < MAP_TILES; x += 1) {
      const cls = raw[y][x];
      // Structures with no overlay art keep their legacy tiles; everything
      // else resolves to the nearest walkable/shore ground class.
      classes[y][x] =
        cls === 'building' && !covered[y][x]
          ? 'building'
          : (nearest[y][x] ?? 'grass');
    }
  }

  return { classes, raw };
};

const imageData = (img: HTMLImageElement | HTMLCanvasElement): ImageData => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d')!.drawImage(img, 0, 0);
  return canvas.getContext('2d')!.getImageData(0, 0, img.width, img.height);
};

interface BakeOptions {
  tileAt: (position: Position) => number;
  legacyTileset: HTMLCanvasElement;
  groundImages: { [kind: string]: HTMLImageElement };
  propIds: string[];
  buildingRects: { x: number; y: number; columns: number; rows: number }[];
}

export const bakeHdGround = ({
  tileAt,
  legacyTileset,
  groundImages,
  propIds,
  buildingRects,
}: BakeOptions): HdGroundBake => {
  const covered: boolean[][] = [];
  for (let y = 0; y < MAP_TILES; y += 1) {
    covered[y] = new Array(MAP_TILES).fill(false);
  }
  buildingRects.forEach((rect) => {
    for (let y = rect.y; y < rect.y + rect.rows; y += 1) {
      for (let x = rect.x; x < rect.x + rect.columns; x += 1) {
        if (x >= 0 && y >= 0 && x < MAP_TILES && y < MAP_TILES)
          covered[y][x] = true;
      }
    }
  });

  const { classes, raw } = resolveClasses(tileAt, covered);

  const groundData: { [kind: string]: ImageData } = {};
  Object.entries(groundImages).forEach(([kind, img]) => {
    groundData[kind] = imageData(img);
  });
  const legacy = imageData(legacyTileset);

  // coarse displacement field (8px cells) — bilinear-sampled per pixel so
  // class edges wobble organically without per-pixel noise cost
  const FIELD_CELL = 8;
  const FIELD_SIZE = (MAP_TILES * TILE_SIZE) / FIELD_CELL;
  const fieldX = new Float32Array(FIELD_SIZE * FIELD_SIZE);
  const fieldY = new Float32Array(FIELD_SIZE * FIELD_SIZE);
  for (let fy = 0; fy < FIELD_SIZE; fy += 1) {
    for (let fx = 0; fx < FIELD_SIZE; fx += 1) {
      fieldX[fy * FIELD_SIZE + fx] =
        (valueNoise(fx * FIELD_CELL, fy * FIELD_CELL, 90, 7) - 0.5) * 30;
      fieldY[fy * FIELD_SIZE + fx] =
        (valueNoise(fx * FIELD_CELL + 977, fy * FIELD_CELL + 131, 90, 13) -
          0.5) *
        30;
    }
  }

  const bilinear = (field: Float32Array, px: number, py: number) => {
    const gx = Math.min(FIELD_SIZE - 1.001, Math.max(0, px / FIELD_CELL));
    const gy = Math.min(FIELD_SIZE - 1.001, Math.max(0, py / FIELD_CELL));
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const fx = gx - x0;
    const fy = gy - y0;
    const i = y0 * FIELD_SIZE + x0;
    const top = field[i] + (field[i + 1] - field[i]) * fx;
    const bot =
      field[i + FIELD_SIZE] +
      (field[i + FIELD_SIZE + 1] - field[i + FIELD_SIZE]) * fx;
    return top + (bot - top) * fy;
  };

  const texturePixel = (
    data: ImageData,
    x: number,
    y: number,
    out: number[],
    offset: number,
  ) => {
    const tx = ((x % data.width) + data.width) % data.width;
    const ty = ((y % data.height) + data.height) % data.height;
    const i = (ty * data.width + tx) * 4;
    out[offset] = data.data[i];
    out[offset + 1] = data.data[i + 1];
    out[offset + 2] = data.data[i + 2];
    out[offset + 3] = 255;
  };

  const sampleClass = (px: number, py: number): GroundClass => {
    // displace the sample point by low-frequency noise for organic edges
    const nx = bilinear(fieldX, px, py);
    const ny = bilinear(fieldY, px, py);
    const tx = Math.min(
      MAP_TILES - 1,
      Math.max(0, Math.floor((px + nx) / TILE_SIZE)),
    );
    const ty = Math.min(
      MAP_TILES - 1,
      Math.max(0, Math.floor((py + ny) / TILE_SIZE)),
    );
    return classes[ty][tx];
  };

  const bakeChunk = (cx: number, cy: number, waterOnly: boolean): HdChunk => {
    const canvas = document.createElement('canvas');
    const size = CHUNK_TILES * TILE_SIZE;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d')!;
    const frame = context.createImageData(size, size);
    const px = [0, 0, 0, 0];

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const wx = cx * size + x;
        const wy = cy * size + y;
        const cls = sampleClass(wx, wy);
        const i = (y * size + x) * 4;

        if (waterOnly) {
          if (cls !== 'water') continue;
          // shore: within ~1 tile of land use water-shore blend
          const tx = Math.floor(wx / TILE_SIZE);
          const ty = Math.floor(wy / TILE_SIZE);
          let nearLand = false;
          for (let dy = -1; dy <= 1 && !nearLand; dy += 1) {
            for (let dx = -1; dx <= 1 && !nearLand; dx += 1) {
              const nx = tx + dx;
              const ny = ty + dy;
              if (nx >= 0 && ny >= 0 && nx < MAP_TILES && ny < MAP_TILES) {
                if (classes[ny][nx] !== 'water') nearLand = true;
              }
            }
          }
          const kind = nearLand ? 'water-shore' : 'water';
          const data = groundData[kind] ?? groundData.water;
          texturePixel(data, wx, wy, px, 0);
          frame.data[i] = px[0];
          frame.data[i + 1] = px[1];
          frame.data[i + 2] = px[2];
          frame.data[i + 3] = nearLand ? 220 : 255;
        } else {
          if (cls === 'water') continue;
          if (cls === 'building') {
            // uncovered structures stay on the legacy tile; the tileset is
            // upscaled 2x so each tile occupies TILE_SIZE px
            const tx = Math.floor(wx / TILE_SIZE);
            const ty = Math.floor(wy / TILE_SIZE);
            const index = tileAt({ x: tx, y: ty });
            const lx = index * TILE_SIZE + (wx % TILE_SIZE);
            const ly = TILE_SIZE + (wy % TILE_SIZE); // row 1 = daylight
            const li = (ly * legacy.width + lx) * 4;
            frame.data[i] = legacy.data[li];
            frame.data[i + 1] = legacy.data[li + 1];
            frame.data[i + 2] = legacy.data[li + 2];
            frame.data[i + 3] = 255;
          } else {
            const data = groundData[cls] ?? groundData.grass;
            texturePixel(data, wx, wy, px, 0);
            frame.data[i] = px[0];
            frame.data[i + 1] = px[1];
            frame.data[i + 2] = px[2];
            frame.data[i + 3] = 255;
          }
        }
      }
    }

    context.putImageData(frame, 0, 0);
    return { canvas, x: cx * size, y: cy * size };
  };

  const landChunks: HdChunk[] = [];
  const waterChunks: HdChunk[] = [];
  for (let cy = 0; cy < MAP_TILES / CHUNK_TILES; cy += 1) {
    for (let cx = 0; cx < MAP_TILES / CHUNK_TILES; cx += 1) {
      landChunks.push(bakeChunk(cx, cy, false));
      waterChunks.push(bakeChunk(cx, cy, true));
    }
  }

  const waterTiles: Position[] = [];
  const props: HdPropPlacement[] = [];
  const blobShadows: HdBlob[] = [];
  const lanternSpots: Position[] = [];

  const TREES = propIds.filter((id) =>
    ['tree-1', 'tree-2', 'cypress', 'bush-1', 'bush-2'].includes(id),
  );

  for (let y = 0; y < MAP_TILES; y += 1) {
    for (let x = 0; x < MAP_TILES; x += 1) {
      const cls = raw[y][x];
      if (cls === 'water') {
        waterTiles.push({ x, y });
      } else if (cls === 'tree' && TREES.length) {
        const pick = Math.floor(hash2(x, y, 31) * TREES.length);
        props.push({
          id: TREES[pick],
          x: (x + 0.5) * TILE_SIZE,
          y: (y + 1) * TILE_SIZE,
        });
      } else if (cls === 'shadow') {
        blobShadows.push({
          x: (x + 0.5) * TILE_SIZE,
          y: (y + 0.5) * TILE_SIZE,
          rx: TILE_SIZE * 0.8,
          ry: TILE_SIZE * 0.5,
        });
      }
    }
  }

  // deterministic scatter of decorative props on walkable ground
  const DECOR = propIds.filter((id) =>
    ['flowerpot', 'lantern-post', 'crate', 'barrel'].includes(id),
  );
  for (let y = 0; y < MAP_TILES; y += 1) {
    for (let x = 0; x < MAP_TILES; x += 1) {
      if (classes[y][x] !== 'grass' && classes[y][x] !== 'cobble') continue;
      // no decor on wall walkways or ground pressed against structures
      let nearStructure = false;
      for (let dy = -1; dy <= 1 && !nearStructure; dy += 1) {
        for (let dx = -1; dx <= 1 && !nearStructure; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < MAP_TILES && ny < MAP_TILES) {
            if (raw[ny][nx] === 'building') nearStructure = true;
          }
        }
      }
      if (nearStructure) continue;
      const roll = hash2(x, y, 97);
      if (roll > 0.004 || !DECOR.length) continue;
      const pick = DECOR[Math.floor(hash2(x, y, 98) * DECOR.length)];
      props.push({
        id: pick,
        x: (x + 0.5) * TILE_SIZE,
        y: (y + 1) * TILE_SIZE,
      });
      if (pick === 'lantern-post') {
        lanternSpots.push({ x, y });
      }
    }
  }

  const buildingShadows = buildingRects.map((r) => ({
    x: r.x * TILE_SIZE - TILE_SIZE * 0.6,
    y: r.y * TILE_SIZE + r.rows * TILE_SIZE * 0.4,
    width: r.columns * TILE_SIZE + TILE_SIZE * 0.6,
    height: TILE_SIZE * 0.9,
  }));

  return {
    landChunks,
    waterChunks,
    waterTiles,
    props,
    blobShadows,
    lanternSpots,
    buildingShadows,
  };
};

export const loadImages = (urls: { [key: string]: string }) =>
  Promise.all(
    Object.entries(urls).map(
      ([key, url]) =>
        new Promise<[string, HTMLImageElement]>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve([key, img]);
          img.onerror = reject;
          img.src = url;
        }),
    ),
  ).then(
    (entries) =>
      Object.fromEntries(entries) as {
        [key: string]: HTMLImageElement;
      },
  );
