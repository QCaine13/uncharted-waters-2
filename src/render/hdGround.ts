/**
 * Bakes the HD Lisbon ground: per-tile terrain class resolution, organic
 * class edges, texture compositing and prop/shadow placement. Runs once per
 * port entry; deterministic so re-entry produces identical output.
 */
import { portTerrainClassAt, PortTerrainClass } from '../data/portTerrain';
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
  width?: number; // explicit world-px width (ship props); else PROP_SPEC
}

// Rendered prop footprint in tile units (width x height above the anchor).
export const PROP_SPEC: { [id: string]: { w: number; h: number } } = {
  'tree-1': { w: 2, h: 2.5 },
  'tree-2': { w: 2, h: 2.5 },
  cypress: { w: 1, h: 2.5 },
  'bush-1': { w: 1, h: 1 },
  'bush-2': { w: 1, h: 1 },
  flowerpot: { w: 0.8, h: 0.9 },
  'lantern-post': { w: 0.7, h: 2 },
  crate: { w: 0.9, h: 0.9 },
  barrel: { w: 0.8, h: 0.9 },
  'ship-anchored': { w: 6, h: 7 },
  'ship-anchored-2': { w: 6, h: 7 },
  'boat-beached-1': { w: 3, h: 3 },
  'boat-beached-2': { w: 3, h: 3 },
};

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

// under structures/props only land classes may show through — a water tile
// beside a building must not bleed onto its surroundings
const LAND_GROUND = new Set<GroundClass>(['grass', 'sand', 'cobble']);

const resolveClasses = (
  tileAt: (position: Position) => number,
  covered: boolean[][],
): { classes: GroundClass[][]; raw: PortTerrainClass[][] } => {
  const raw: PortTerrainClass[][] = [];
  const classes: GroundClass[][] = [];

  for (let y = 0; y < MAP_TILES; y += 1) {
    raw[y] = [];
    for (let x = 0; x < MAP_TILES; x += 1) {
      raw[y][x] =
        portTerrainClassAt(0, tileAt({ x, y }), { x, y }) ?? 'building';
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
      const cls = raw[y][x];
      // ships resolve to water: no shore halo, sea animation shows through
      if (cls === 'ship' || cls === 'water') {
        nearest[y][x] = 'water';
      } else if (LAND_GROUND.has(cls as GroundClass)) {
        nearest[y][x] = cls as GroundClass;
      } else {
        nearest[y][x] = null;
      }
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

// World-pixel repeat period per ground kind, in tiles. Man-made stone reads
// at half a tile per block; organic textures tile more loosely.
const TEXTURE_REPEAT_TILES: { [kind: string]: number } = {
  cobble: 6,
  grass: 8,
  sand: 8,
  water: 16,
  'water-shore': 16,
};

interface BakeOptions {
  tileAt: (position: Position) => number;
  legacyTileset: HTMLCanvasElement;
  groundImages: { [kind: string]: HTMLImageElement };
  propIds: string[];
  buildingRects: { x: number; y: number; columns: number; rows: number }[];
  entrances?: Position[];
  isWalkable?: (position: Position) => boolean;
}

export const bakeHdGround = ({
  tileAt,
  legacyTileset,
  groundImages,
  propIds,
  buildingRects,
  entrances = [],
  isWalkable = () => false,
}: BakeOptions): HdGroundBake => {
  const covered: boolean[][] = [];
  for (let y = 0; y < MAP_TILES; y += 1) {
    covered[y] = new Array(MAP_TILES).fill(false);
  }
  buildingRects.forEach((rect) => {
    // rects may be fractional after art alignment; cover every tile the
    // rect touches
    for (
      let y = Math.floor(rect.y);
      y < Math.ceil(rect.y + rect.rows);
      y += 1
    ) {
      for (
        let x = Math.floor(rect.x);
        x < Math.ceil(rect.x + rect.columns);
        x += 1
      ) {
        if (x >= 0 && y >= 0 && x < MAP_TILES && y < MAP_TILES)
          covered[y][x] = true;
      }
    }
  });

  const { classes, raw } = resolveClasses(tileAt, covered);

  // Connected clusters of legacy ship tiles; HD ship props (when present)
  // replace the hull, otherwise the legacy tiles are drawn over the water.
  const shipClusters: {
    x: number;
    y: number;
    columns: number;
    rows: number;
  }[] = [];
  const shipCovered: boolean[][] = [];
  for (let y = 0; y < MAP_TILES; y += 1) {
    shipCovered[y] = new Array(MAP_TILES).fill(false);
  }
  {
    const seen: boolean[][] = [];
    for (let y = 0; y < MAP_TILES; y += 1) {
      seen[y] = new Array(MAP_TILES).fill(false);
    }
    for (let y = 0; y < MAP_TILES; y += 1) {
      for (let x = 0; x < MAP_TILES; x += 1) {
        if (raw[y][x] !== 'ship' || seen[y][x]) continue;
        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;
        const stack = [{ x, y }];
        seen[y][x] = true;
        while (stack.length) {
          const p = stack.pop()!;
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
          for (let d = 0; d < 4; d += 1) {
            const nx = p.x + [1, -1, 0, 0][d];
            const ny = p.y + [0, 0, 1, -1][d];
            if (nx < 0 || ny < 0 || nx >= MAP_TILES || ny >= MAP_TILES)
              continue;
            if (seen[ny][nx] || raw[ny][nx] !== 'ship') continue;
            seen[ny][nx] = true;
            stack.push({ x: nx, y: ny });
          }
        }
        shipClusters.push({
          x: minX,
          y: minY,
          columns: maxX - minX + 1,
          rows: maxY - minY + 1,
        });
      }
    }
  }

  const groundData: { [kind: string]: ImageData } = {};
  Object.entries(groundImages).forEach(([kind, img]) => {
    groundData[kind] = imageData(img);
  });
  const legacy = imageData(legacyTileset);

  // colours of the plain open-sea tile (index 63, day row) — pixels matching
  // them inside legacy ship hull tiles are dropped so animated HD water
  // shows through instead of a stamped water square
  const seaColors = new Set<number>();
  {
    const SEA_INDEX = 63;
    for (let sy = 0; sy < TILE_SIZE; sy += 1) {
      for (let sx = 0; sx < TILE_SIZE; sx += 1) {
        const li =
          ((TILE_SIZE + sy) * legacy.width + SEA_INDEX * TILE_SIZE + sx) * 4;
        seaColors.add(
          (legacy.data[li] << 16) |
            (legacy.data[li + 1] << 8) |
            legacy.data[li + 2],
        );
      }
    }
  }

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
    kind: string,
    x: number,
    y: number,
    out: number[],
    offset: number,
  ) => {
    const data = groundData[kind];
    const scale = data.width / ((TEXTURE_REPEAT_TILES[kind] ?? 16) * TILE_SIZE);
    const tx = Math.floor(((x * scale) % data.width) + data.width) % data.width;
    const ty =
      Math.floor(((y * scale) % data.height) + data.height) % data.height;
    const i = (ty * data.width + tx) * 4;
    out[offset] = data.data[i];
    out[offset + 1] = data.data[i + 1];
    out[offset + 2] = data.data[i + 2];
    out[offset + 3] = 255;
  };

  const classAtTile = (tx: number, ty: number): GroundClass => {
    const cx = Math.min(MAP_TILES - 1, Math.max(0, tx));
    const cy = Math.min(MAP_TILES - 1, Math.max(0, ty));
    return classes[cy][cx];
  };

  const sampleClass = (px: number, py: number): GroundClass => {
    // Man-made surfaces (cobble) keep straight tile-aligned edges; organic
    // classes get the displaced lookup.
    const base = classAtTile(
      Math.floor(px / TILE_SIZE),
      Math.floor(py / TILE_SIZE),
    );
    if (base === 'cobble') {
      return 'cobble';
    }
    const nx = bilinear(fieldX, px, py);
    const ny = bilinear(fieldY, px, py);
    const cls = classAtTile(
      Math.floor((px + nx) / TILE_SIZE),
      Math.floor((py + ny) / TILE_SIZE),
    );
    return cls === 'cobble' ? base : cls;
  };

  // Water distance field on a coarse grid so the shore band is a smooth
  // gradient (~0.75 tile) instead of per-tile steps.
  const DIST_CELL = 8;
  const DIST_SIZE = (MAP_TILES * TILE_SIZE) / DIST_CELL;
  const dist = new Float32Array(DIST_SIZE * DIST_SIZE).fill(-1);
  {
    const queue: number[] = [];
    for (let cy = 0; cy < DIST_SIZE; cy += 1) {
      for (let cx = 0; cx < DIST_SIZE; cx += 1) {
        const cls = sampleClass(
          cx * DIST_CELL + DIST_CELL / 2,
          cy * DIST_CELL + DIST_CELL / 2,
        );
        if (cls !== 'water') {
          dist[cy * DIST_SIZE + cx] = 0;
          queue.push(cy * DIST_SIZE + cx);
        }
      }
    }
    let head = 0;
    while (head < queue.length) {
      const i = queue[head];
      head += 1;
      const cx = i % DIST_SIZE;
      const cy = Math.floor(i / DIST_SIZE);
      const d = dist[i] + DIST_CELL;
      for (let s = 0; s < 4; s += 1) {
        const nx = cx + [1, -1, 0, 0][s];
        const ny = cy + [0, 0, 1, -1][s];
        if (nx < 0 || ny < 0 || nx >= DIST_SIZE || ny >= DIST_SIZE) continue;
        const ni = ny * DIST_SIZE + nx;
        if (dist[ni] === -1 || dist[ni] > d) {
          dist[ni] = d;
          queue.push(ni);
        }
      }
    }
  }

  const SHORE_PX = TILE_SIZE * 0.75;

  const bakeChunk = (cx: number, cy: number, waterOnly: boolean): HdChunk => {
    const canvas = document.createElement('canvas');
    const size = CHUNK_TILES * TILE_SIZE;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d')!;
    const frame = context.createImageData(size, size);
    const px = [0, 0, 0, 0];
    const px2 = [0, 0, 0, 0];

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const wx = cx * size + x;
        const wy = cy * size + y;
        const cls = sampleClass(wx, wy);
        const i = (y * size + x) * 4;

        if (waterOnly) {
          if (cls !== 'water') continue;
          const tx = Math.floor(wx / TILE_SIZE);
          const ty = Math.floor(wy / TILE_SIZE);
          if (raw[ty][tx] === 'ship' && !shipCovered[ty][tx]) {
            // uncovered ship hull: legacy tile from the day row
            const index = tileAt({ x: tx, y: ty });
            const lx = index * TILE_SIZE + (wx % TILE_SIZE);
            const ly = TILE_SIZE + (wy % TILE_SIZE);
            const li = (ly * legacy.width + lx) * 4;
            const rgb =
              (legacy.data[li] << 16) |
              (legacy.data[li + 1] << 8) |
              legacy.data[li + 2];
            if (!seaColors.has(rgb)) {
              frame.data[i] = legacy.data[li];
              frame.data[i + 1] = legacy.data[li + 1];
              frame.data[i + 2] = legacy.data[li + 2];
              frame.data[i + 3] = 255;
            }
            continue;
          }
          const d = bilinear(dist, wx, wy);
          const shore = Math.min(1, Math.max(0, d / SHORE_PX));
          texturePixel('water', wx, wy, px, 0);
          if (shore < 1 && groundData['water-shore']) {
            texturePixel('water-shore', wx, wy, px2, 0);
            const t = 1 - shore;
            px[0] = px[0] * shore + px2[0] * t;
            px[1] = px[1] * shore + px2[1] * t;
            px[2] = px[2] * shore + px2[2] * t;
          }
          frame.data[i] = px[0];
          frame.data[i + 1] = px[1];
          frame.data[i + 2] = px[2];
          frame.data[i + 3] = 255;
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
            texturePixel(cls, wx, wy, px, 0);
            // darker stone seam where cobble meets another surface
            if (cls === 'cobble') {
              const ex = wx % TILE_SIZE;
              const ey = wy % TILE_SIZE;
              const tx = Math.floor(wx / TILE_SIZE);
              const ty = Math.floor(wy / TILE_SIZE);
              let seam = false;
              if (ex < 3 && classAtTile(tx - 1, ty) !== 'cobble') seam = true;
              if (ex > 28 && classAtTile(tx + 1, ty) !== 'cobble') seam = true;
              if (ey < 3 && classAtTile(tx, ty - 1) !== 'cobble') seam = true;
              if (ey > 28 && classAtTile(tx, ty + 1) !== 'cobble') seam = true;
              if (seam) {
                px[0] *= 0.8;
                px[1] *= 0.8;
                px[2] *= 0.8;
              }
            }
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

  // anchored-ship props replace legacy hull clusters when art exists
  const SHIP_PROPS = propIds.filter((id) => id.startsWith('ship-anchored'));
  if (SHIP_PROPS.length) {
    shipClusters.forEach((cluster, i) => {
      if (cluster.columns < 3) return;
      const id = SHIP_PROPS[i % SHIP_PROPS.length];
      props.push({
        id,
        x: (cluster.x + cluster.columns / 2) * TILE_SIZE,
        y: (cluster.y + cluster.rows) * TILE_SIZE,
        width: cluster.columns * TILE_SIZE * 1.2,
      });
      for (let y = cluster.y; y < cluster.y + cluster.rows; y += 1) {
        for (let x = cluster.x; x < cluster.x + cluster.columns; x += 1) {
          shipCovered[y][x] = true;
        }
      }
    });
  }

  const overlapsBuilding = (id: string, x: number, y: number): boolean => {
    const spec = PROP_SPEC[id] ?? { w: 1, h: 1 };
    const half = (spec.w * TILE_SIZE) / 2;
    const top = y - spec.h * TILE_SIZE;
    return buildingRects.some((r) => {
      const rx = r.x * TILE_SIZE;
      const ry = r.y * TILE_SIZE;
      const rw = r.columns * TILE_SIZE;
      const rh = r.rows * TILE_SIZE;
      // allow a few px of silhouette overlap before rejecting the prop
      const ix = Math.min(x + half, rx + rw) - Math.max(x - half, rx);
      const iy = Math.min(y, ry + rh) - Math.max(top, ry);
      return ix > 6 && iy > 6;
    });
  };

  const putProp = (id: string, x: number, y: number) => {
    if (!overlapsBuilding(id, x, y)) {
      props.push({ id, x, y });
    }
  };

  for (let y = 0; y < MAP_TILES; y += 1) {
    // hedge runs: contiguous tree tiles alternate bushes, with an occasional
    // taller accent every 3rd-4th tile
    let run = 0;
    for (let x = 0; x < MAP_TILES; x += 1) {
      const cls = raw[y][x];
      if (cls === 'water') {
        waterTiles.push({ x, y });
        run = 0;
      } else if (cls === 'ship') {
        waterTiles.push({ x, y });
        run = 0;
      } else if (cls === 'tree' && TREES.length) {
        run += 1;
        const inRun =
          (x + 1 < MAP_TILES && raw[y][x + 1] === 'tree') ||
          (x - 1 >= 0 && raw[y][x - 1] === 'tree');
        let id: string;
        if (inRun) {
          const bushes = TREES.filter((t) => t.startsWith('bush'));
          const accents = TREES.filter(
            (t) => t === 'cypress' || t.startsWith('tree'),
          );
          if (run % 4 === 3 && accents.length) {
            id = accents[Math.floor(hash2(x, y, 33) * accents.length)];
          } else if (bushes.length) {
            id = bushes[run % bushes.length];
          } else {
            id = TREES[Math.floor(hash2(x, y, 31) * TREES.length)];
          }
        } else {
          const tall = TREES.filter((t) => t !== 'bush-1' && t !== 'bush-2');
          const pool = tall.length ? tall : TREES;
          id = pool[Math.floor(hash2(x, y, 31) * pool.length)];
        }
        putProp(id, (x + 0.5) * TILE_SIZE, (y + 1) * TILE_SIZE);
      } else {
        run = 0;
        if (cls === 'shadow' && !covered[y][x]) {
          blobShadows.push({
            x: (x + 0.5) * TILE_SIZE,
            y: (y + 0.5) * TILE_SIZE,
            rx: TILE_SIZE * 0.8,
            ry: TILE_SIZE * 0.5,
          });
        }
      }
    }
  }

  // deterministic scatter of decorative props on walkable ground
  const DECOR = propIds.filter((id) =>
    ['flowerpot', 'crate', 'barrel'].includes(id),
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
      putProp(pick, (x + 0.5) * TILE_SIZE, (y + 1) * TILE_SIZE);
    }
  }

  // lantern posts: one beside each building entrance (right of the door when
  // walkable — purely visual, never blocks), plus a rhythm along the quay
  if (propIds.includes('lantern-post')) {
    entrances.forEach(({ x, y }) => {
      const spot = { x: x + 2, y: y + 1 };
      if (
        spot.x >= 0 &&
        spot.x < MAP_TILES &&
        spot.y >= 0 &&
        spot.y < MAP_TILES &&
        isWalkable(spot)
      ) {
        putProp(
          'lantern-post',
          (spot.x + 0.5) * TILE_SIZE,
          (spot.y + 1) * TILE_SIZE,
        );
        lanternSpots.push(spot);
      }
    });

    for (let y = 0; y + 2 < MAP_TILES; y += 1) {
      let runStart = -1;
      for (let x = 0; x <= MAP_TILES; x += 1) {
        const isQuayEdge =
          x < MAP_TILES &&
          classes[y][x] === 'cobble' &&
          classes[y + 2][x] === 'water';
        if (isQuayEdge && runStart < 0) runStart = x;
        if ((!isQuayEdge || x === MAP_TILES - 1) && runStart >= 0) {
          for (let lx = runStart + 2; lx < x; lx += 8) {
            putProp(
              'lantern-post',
              (lx + 0.5) * TILE_SIZE,
              (y + 1) * TILE_SIZE,
            );
            lanternSpots.push({ x: lx, y });
          }
          runStart = -1;
        }
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
