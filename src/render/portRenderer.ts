import {
  Application,
  Assets as PixiAssets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
  TilingSprite,
} from 'pixi.js';
import Assets from '../assets';
import {
  hdBuildings,
  hdCharacters,
  hdGround,
  hdGroundComplete,
  hdProps,
} from '../game/images/hd/hdManifest';
import { bakeHdGround, loadImages } from './hdGround';
import { TILE_SIZE } from '../constants';
import { getProtagonistId } from '../state/selectors';
import { ambientAt } from './lighting';
import type { Weather } from './weather';
import type { Map as GameMap } from '../map';
import type { PortNpc } from '../game/port/portNpc';
import type { PortPlayer } from '../game/port/portPlayer';
import type { Position } from '../types';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 800;

const VIEW_TILES_X = CANVAS_WIDTH / TILE_SIZE;
const VIEW_TILES_Y = CANVAS_HEIGHT / TILE_SIZE;

const MAP_PIXELS = 96 * TILE_SIZE;

const MIN_ZOOM = 1;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

// Session-only zoom level, shared across port visits.
let zoomFactor = MIN_ZOOM;

export const setZoomFactor = (zoom: number) => {
  zoomFactor = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
};

type Character = PortPlayer | PortNpc;

interface Frame {
  camera: Position;
  player: Character;
  npcs: Character[];
  timeOfDay: number;
  percentNextMove: number;
  marker: Position | null;
  weather: Weather;
}

interface Handlers {
  onTileClick: ((tile: Position) => void) | null;
  onSecondaryClick: (() => void) | null;
}

/*
  One shared Pixi Application owns the camera-port canvas. Each port visit
  gets its own session (world container + handlers) created by
  createPortRenderer; DOM listeners are attached once and dispatch to the
  active session.
 */
interface Session {
  world: Container;
  tileLayer: Container;
  groundLayer: Container;
  buildingLayer: Container;
  propsLayer: Container;
  blobShadows: Graphics;
  waterTiles: TilingSprite[];
  characterLayer: Container;
  shadows: Graphics;
  tint: Graphics;
  lights: Container;
  weather: Container;
  weatherShadows: Graphics;
  weatherFx: Graphics;
  emissiveSprites: Sprite[];
  marker: Graphics;
  tileSprites: Sprite[];
  characterSprites: Map<Character, Sprite>;
  lastOrigin: Position;
  lastTilesetRow: number;
  lastTileWidth: number;
  camera: Position;
  handlers: Handlers;
}

let appPromise: Promise<Application> | null = null;
let activeSession: Session | null = null;
let tilesetSource: Texture['source'] | null = null;
let characterSource: Texture['source'] | null = null;

const tileTextureCache = new Map<string, Texture>();
const characterTextureCache = new Map<number, Texture>();

// HD character strips: 256px frames, feet baseline at y=232, drawn 96px
// wide/tall so the sprite is 3x the legacy 64px frame.
const HD_CHAR_SIZE = 96;
const HD_CHAR_FRAME = 256;
const HD_FEET_BASELINE = 232;

const hdStripFrames = new Map<string, Texture[]>();

const PROTAGONIST_STRIPS: { [id: string]: string } = {
  joao: 'farrell-son',
  katarina: 'heroine-captain',
  otto: 'privateer',
  ernst: 'scholar',
  pietro: 'adventurer',
  ali: 'merchant-youth',
};

const npcStripId = (frame: number): string | null => {
  if (frame < 16) {
    return 'woman';
  }
  if (frame < 24) {
    return 'man';
  }
  return (
    ['merchant', 'dog', 'guard', 'beggar'][Math.floor((frame - 24) / 2)] ?? null
  );
};

const hdFramesFor = (
  frame: number,
  protagonistId: string,
): Texture[] | null => {
  if (frame < 8) {
    const preferred = PROTAGONIST_STRIPS[protagonistId] ?? 'farrell-son';
    return (
      hdStripFrames.get(preferred) ?? hdStripFrames.get('farrell-son') ?? null
    );
  }

  const id = npcStripId(frame);

  return id ? (hdStripFrames.get(id) ?? null) : null;
};

const tileTexture = (column: number, row: number): Texture => {
  const key = `${column}:${row}`;
  let texture = tileTextureCache.get(key);

  if (!texture) {
    texture = new Texture({
      source: tilesetSource!,
      frame: new Rectangle(
        column * TILE_SIZE,
        row * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
      ),
    });
    tileTextureCache.set(key, texture);
  }

  return texture;
};

const characterTexture = (frame: number): Texture => {
  let texture = characterTextureCache.get(frame);

  if (!texture) {
    texture = new Texture({
      source: characterSource!,
      frame: new Rectangle(frame * 64, 0, 64, 64),
    });
    characterTextureCache.set(frame, texture);
  }

  return texture;
};

const screenToTile = (
  session: Session,
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): Position => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: Math.floor(
      session.camera.x +
        ((clientX - rect.left) * scaleX) / (TILE_SIZE * zoomFactor),
    ),
    y: Math.floor(
      session.camera.y +
        ((clientY - rect.top) * scaleY) / (TILE_SIZE * zoomFactor),
    ),
  };
};

const initApp = (canvas: HTMLCanvasElement): Promise<Application> => {
  if (!appPromise) {
    const app = new Application();
    appPromise = app
      .init({
        canvas,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        background: 0x000000,
        antialias: false,
        resolution: 1,
        roundPixels: true,
        preserveDrawingBuffer: true,
      })
      .then(() => {
        tilesetSource = Texture.from(Assets.images('portTilesets')).source;
        tilesetSource.scaleMode = 'nearest';
        characterSource = Texture.from(Assets.images('portCharacters')).source;
        characterSource.scaleMode = 'nearest';

        const hdTextures = Promise.all([
          ...hdBuildings.flatMap((building) =>
            [building.url, building.emissive]
              .filter((url): url is string => url !== null)
              .map((url) => PixiAssets.load(url)),
          ),
          ...Object.values(hdProps).map((url) => PixiAssets.load(url)),
          ...Object.values(hdGround).map((url) => PixiAssets.load(url)),
          ...Object.entries(hdCharacters).map(([id, { url, frames }]) =>
            PixiAssets.load(url).then((texture: Texture) => {
              const { source } = texture;
              source.scaleMode = 'linear';
              hdStripFrames.set(
                id,
                Array.from(
                  { length: frames },
                  (_unused, i) =>
                    new Texture({
                      source: texture.source,
                      frame: new Rectangle(
                        i * HD_CHAR_FRAME,
                        0,
                        HD_CHAR_FRAME,
                        HD_CHAR_FRAME,
                      ),
                    }),
                ),
              );
              return texture;
            }),
          ),
        ]).then((textures: Texture[]) => {
          textures.forEach((texture) => {
            const { source } = texture;
            source.scaleMode = 'linear';
          });
          return app;
        });

        canvas.addEventListener('pointerdown', (event) => {
          const session = activeSession;

          if (!session) {
            return;
          }

          if (event.button === 0 && session.handlers.onTileClick) {
            session.handlers.onTileClick(
              screenToTile(session, canvas, event.clientX, event.clientY),
            );
          } else if (event.button === 2 && session.handlers.onSecondaryClick) {
            session.handlers.onSecondaryClick();
          }
        });

        canvas.addEventListener(
          'wheel',
          (event) => {
            event.preventDefault();

            zoomFactor = Math.min(
              MAX_ZOOM,
              Math.max(
                MIN_ZOOM,
                Math.round(
                  (zoomFactor - Math.sign(event.deltaY) * ZOOM_STEP) * 100,
                ) / 100,
              ),
            );
          },
          { passive: false },
        );

        return hdTextures;
      });
  }

  return appPromise;
};

const createSession = (): Session => ({
  world: new Container(),
  tileLayer: new Container(),
  groundLayer: new Container(),
  buildingLayer: new Container(),
  propsLayer: new Container(),
  blobShadows: new Graphics(),
  waterTiles: [],
  characterLayer: new Container(),
  shadows: new Graphics(),
  tint: new Graphics(),
  lights: new Container(),
  weather: new Container(),
  weatherShadows: new Graphics(),
  weatherFx: new Graphics(),
  emissiveSprites: [],
  marker: new Graphics(),
  tileSprites: [],
  characterSprites: new Map(),
  lastOrigin: { x: -1, y: -1 },
  lastTilesetRow: -1,
  lastTileWidth: -1,
  camera: { x: 0, y: 0 },
  handlers: { onTileClick: null, onSecondaryClick: null },
});

const weatherRand = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const drawWeather = (
  session: Session,
  weather: Weather,
  timeOfDay: number,
  now: number,
) => {
  session.weatherShadows.clear();
  session.weatherFx.clear();

  if (weather === 'cloudy') {
    for (let i = 0; i < 4; i += 1) {
      const x = ((weatherRand(i, 1) * 1600 + now * 18) % 1600) - 160;
      const y = weatherRand(i, 2) * 700;
      session.weatherShadows
        .ellipse(
          x,
          y,
          320 + weatherRand(i, 3) * 160,
          140 + weatherRand(i, 4) * 60,
        )
        .fill({ color: 0x777788, alpha: 0.16 });
    }
  } else if (weather === 'rain') {
    session.weatherShadows
      .rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      .fill({ color: 0x8888a0, alpha: 0.12 });
    for (let i = 0; i < 90; i += 1) {
      const x = weatherRand(i, 5) * CANVAS_WIDTH;
      const speed = 550 + weatherRand(i, 6) * 350;
      const y =
        (weatherRand(i, 7) * CANVAS_HEIGHT + now * speed) % CANVAS_HEIGHT;
      session.weatherFx.rect(x, y, 2, 14).fill({ color: 0xaaccee, alpha: 0.4 });
    }
    for (let i = 0; i < 24; i += 1) {
      const x = weatherRand(i, 8) * CANVAS_WIDTH;
      const y = weatherRand(i, 9) * CANVAS_HEIGHT;
      const phase = (now * 1.6 + weatherRand(i, 10)) % 1;
      session.weatherFx
        .circle(x, y, 1 + phase * 4)
        .stroke({ width: 1, color: 0xbbddff, alpha: (1 - phase) * 0.4 });
    }
  } else if (weather === 'fog') {
    const dawnFactor = Math.max(0, 1 - Math.abs(timeOfDay - 390) / 240);
    const alpha = 0.1 + dawnFactor * 0.18;
    for (let i = 0; i < 5; i += 1) {
      const x = ((weatherRand(i, 11) * 1700 + now * (8 + i * 3)) % 1700) - 200;
      const y = weatherRand(i, 12) * 800;
      session.weatherFx
        .ellipse(x, y, 420, 150 + weatherRand(i, 13) * 80)
        .fill({ color: 0xcfd4dd, alpha });
    }
  }
};

const drawMarker = (marker: Graphics, goal: Position | null) => {
  marker.clear();

  if (!goal) {
    return;
  }

  marker
    .circle(0, 0, TILE_SIZE / 3)
    .stroke({ width: 3, color: 0xffffff, alpha: 0.9 });
  marker.position.set((goal.x + 1) * TILE_SIZE, (goal.y + 1) * TILE_SIZE);
};

let lightTexture: Texture | null = null;

const warmLightTexture = (): Texture => {
  if (!lightTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,210,140,0.9)');
    gradient.addColorStop(0.5, 'rgba(255,170,80,0.35)');
    gradient.addColorStop(1, 'rgba(255,150,60,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    lightTexture = Texture.from(canvas);
  }

  return lightTexture;
};

interface PortRendererOptions {
  map: GameMap;
  hdPort: boolean;
  lightSpots: Position[];
}

const createPortRenderer = (
  canvas: HTMLCanvasElement,
  { map, hdPort, lightSpots }: PortRendererOptions,
) => {
  const session = createSession();
  let ready = false;

  initApp(canvas).then(async (app) => {
    if (activeSession) {
      activeSession.world.destroy({ children: true });
      activeSession.weather.destroy({ children: true });
    }

    if (hdPort) {
      hdBuildings.forEach((building) => {
        building.placements.forEach((placement) => {
          const sprite = new Sprite(PixiAssets.get<Texture>(building.url));
          sprite.position.set(placement.x * TILE_SIZE, placement.y * TILE_SIZE);
          sprite.width = placement.columns * TILE_SIZE;
          sprite.height = placement.rows * TILE_SIZE;
          session.buildingLayer.addChild(sprite);

          if (building.emissive) {
            const emissive = new Sprite(
              PixiAssets.get<Texture>(building.emissive),
            );
            emissive.position.copyFrom(sprite.position);
            emissive.width = sprite.width;
            emissive.height = sprite.height;
            emissive.blendMode = 'add';
            emissive.alpha = 0;
            session.buildingLayer.addChild(emissive);
            session.emissiveSprites.push(emissive);
          }
        });
      });
    }

    if (hdPort && hdGroundComplete) {
      const [groundImages, propImages] = await Promise.all([
        loadImages(hdGround),
        loadImages(hdProps),
      ]);
      const bake = bakeHdGround({
        tileAt: map.tileAt,
        legacyTileset: Assets.images('portTilesets'),
        groundImages,
        propIds: Object.keys(propImages),
        buildingRects: hdBuildings.flatMap((building) => building.placements),
      });

      // animated water under everything else, masked to water tiles
      const water = new Container();
      const mask = new Graphics();
      bake.waterTiles.forEach(({ x, y }) => {
        mask.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      });
      mask.fill({ color: 0xffffff });
      [1, 0.35].forEach((alpha) => {
        const waterSprite = new TilingSprite({
          texture: PixiAssets.get<Texture>(hdGround.water),
          width: MAP_PIXELS,
          height: MAP_PIXELS,
        });
        waterSprite.alpha = alpha;
        water.addChild(waterSprite);
        session.waterTiles.push(waterSprite);
      });
      water.mask = mask;
      session.groundLayer.addChild(water, mask);

      bake.waterChunks.forEach(({ canvas: waterCanvas, x, y }) => {
        const sprite = new Sprite(Texture.from(waterCanvas));
        sprite.position.set(x, y);
        session.groundLayer.addChild(sprite);
      });
      bake.landChunks.forEach(({ canvas: landCanvas, x, y }) => {
        const sprite = new Sprite(Texture.from(landCanvas));
        sprite.position.set(x, y);
        session.groundLayer.addChild(sprite);
      });

      // soft blob shadows on 'shadow' tiles and along building edges
      bake.blobShadows.forEach(({ x, y, rx, ry }) => {
        session.blobShadows
          .ellipse(x, y, rx, ry)
          .fill({ color: 0x000000, alpha: 0.18 });
      });
      bake.buildingShadows.forEach(({ x, y, width, height }) => {
        session.blobShadows
          .poly([
            x,
            y,
            x + width,
            y,
            x + width - 24,
            y + height,
            x - 24,
            y + height,
          ])
          .fill({ color: 0x000000, alpha: 0.15 });
      });

      bake.props.forEach(({ id, x, y }) => {
        const sprite = new Sprite(PixiAssets.get<Texture>(hdProps[id]));
        sprite.anchor.set(0.5, 1);
        sprite.position.set(x, y);
        let propHeight = TILE_SIZE * 1.25;
        if (id.startsWith('bush')) {
          propHeight = TILE_SIZE * 1.5;
        } else if (id === 'cypress' || id.startsWith('tree')) {
          propHeight = TILE_SIZE * 3;
        }
        sprite.height = propHeight;
        session.propsLayer.addChild(sprite);
      });

      bake.lanternSpots.forEach((spot) => {
        const light = new Sprite(warmLightTexture());
        light.anchor.set(0.5);
        light.position.set((spot.x + 0.5) * TILE_SIZE, spot.y * TILE_SIZE);
        light.width = 80;
        light.height = 80;
        light.blendMode = 'add';
        session.lights.addChild(light);
      });
    }

    if (hdPort) {
      lightSpots.forEach((spot) => {
        const light = new Sprite(warmLightTexture());
        light.anchor.set(0.5);
        light.position.set(
          (spot.x + 0.5) * TILE_SIZE,
          (spot.y + 0.5) * TILE_SIZE - 8,
        );
        light.width = 96;
        light.height = 96;
        light.blendMode = 'add';
        session.lights.addChild(light);
      });
      session.tint.blendMode = 'multiply';
    }

    session.weatherShadows.blendMode = 'multiply';
    session.weather.addChild(session.weatherShadows, session.weatherFx);

    session.world.addChild(
      session.tileLayer,
      session.groundLayer,
      session.buildingLayer,
      session.blobShadows,
      session.propsLayer,
      session.shadows,
      session.characterLayer,
      session.lights,
      session.tint,
      session.marker,
    );
    app.stage.addChild(session.world, session.weather);
    activeSession = session;
    ready = true;
  });

  const poolSize =
    (Math.ceil(VIEW_TILES_X) + 2) * (Math.ceil(VIEW_TILES_Y) + 2);

  while (session.tileSprites.length < poolSize) {
    const sprite = new Sprite(Texture.EMPTY);
    sprite.visible = false;
    session.tileLayer.addChild(sprite);
    session.tileSprites.push(sprite);
  }

  const syncTiles = (timeOfDay: number) => {
    const tilesetRow = map.tilesetRow(timeOfDay);
    const originX = Math.floor(session.camera.x);
    const originY = Math.floor(session.camera.y);

    const width = Math.ceil(VIEW_TILES_X / zoomFactor) + 2;
    const height = Math.ceil(VIEW_TILES_Y / zoomFactor) + 2;

    if (
      originX === session.lastOrigin.x &&
      originY === session.lastOrigin.y &&
      tilesetRow === session.lastTilesetRow &&
      width === session.lastTileWidth
    ) {
      return;
    }

    session.lastOrigin = { x: originX, y: originY };
    session.lastTilesetRow = tilesetRow;
    session.lastTileWidth = width;

    for (let index = 0; index < session.tileSprites.length; index += 1) {
      const sprite = session.tileSprites[index];

      if (index >= width * height) {
        sprite.visible = false;
      } else {
        const xOffset = index % width;
        const yOffset = Math.floor(index / width);
        const tile = map.tileAt({ x: originX + xOffset, y: originY + yOffset });

        sprite.texture = tileTexture(tile, tilesetRow);
        sprite.position.set(
          (originX + xOffset) * TILE_SIZE,
          (originY + yOffset) * TILE_SIZE,
        );
        sprite.visible = true;
      }
    }
  };

  const syncCharacters = (characters: Character[]) => {
    const seen = new Set<Character>();

    characters.forEach((character) => {
      seen.add(character);

      let sprite = session.characterSprites.get(character);

      if (!sprite) {
        sprite = new Sprite(characterTexture(character.frame()));
        session.characterLayer.addChild(sprite);
        session.characterSprites.set(character, sprite);
      }
    });

    session.characterSprites.forEach((sprite, character) => {
      if (!seen.has(character)) {
        sprite.destroy();
        session.characterSprites.delete(character);
      }
    });
  };

  let lastMarker: Position | null = null;
  let markerDirty = true;

  return {
    isReady: () => ready,
    zoom: () => zoomFactor,
    onTileClick: (handler: Handlers['onTileClick']) => {
      session.handlers.onTileClick = handler;
    },
    onSecondaryClick: (handler: Handlers['onSecondaryClick']) => {
      session.handlers.onSecondaryClick = handler;
    },
    render: ({
      camera,
      player,
      npcs,
      timeOfDay,
      percentNextMove,
      marker,
      weather,
    }: Frame) => {
      if (!ready) {
        return;
      }

      session.camera = camera;

      session.world.scale.set(zoomFactor);
      session.world.position.set(
        -camera.x * TILE_SIZE * zoomFactor,
        -camera.y * TILE_SIZE * zoomFactor,
      );

      session.tileLayer.visible = !(hdPort && hdGroundComplete);
      if (session.tileLayer.visible) {
        syncTiles(timeOfDay);
      }
      syncCharacters([player, ...npcs]);

      const protagonistId = getProtagonistId();
      session.shadows.clear();

      [player, ...npcs].forEach((character) => {
        const sprite = session.characterSprites.get(character);
        if (!sprite) {
          return;
        }

        const frame = character.frame();
        const position = character.position(percentNextMove);
        const hdFrames = hdFramesFor(frame, protagonistId);

        if (hdFrames) {
          sprite.texture = hdFrames[frame % hdFrames.length];
          sprite.anchor.set(0.5, HD_FEET_BASELINE / HD_CHAR_FRAME);
          sprite.width = HD_CHAR_SIZE;
          sprite.height = HD_CHAR_SIZE;
          sprite.position.set(
            (position.x + 1) * TILE_SIZE,
            (position.y + 2) * TILE_SIZE,
          );
          session.shadows
            .ellipse(
              (position.x + 1) * TILE_SIZE,
              (position.y + 2) * TILE_SIZE - 4,
              TILE_SIZE / 2,
              5,
            )
            .fill({ color: 0x000000, alpha: 0.25 });
        } else {
          sprite.anchor.set(0, 0);
          sprite.texture = characterTexture(frame);
          sprite.position.set(position.x * TILE_SIZE, position.y * TILE_SIZE);
        }
      });

      const hdActive = hdPort && hdGroundComplete;
      const ambient = ambientAt(timeOfDay);

      session.tint.clear();
      if (hdActive) {
        const [r, g, b] = ambient.tint.map(Math.round);
        session.tint
          .rect(
            camera.x * TILE_SIZE,
            camera.y * TILE_SIZE,
            CANVAS_WIDTH / zoomFactor + TILE_SIZE,
            CANVAS_HEIGHT / zoomFactor + TILE_SIZE,
          )
          .fill({ color: r * 65536 + g * 256 + b });
      }

      const lightAlpha = hdActive
        ? Math.min(1, Math.max(0, (ambient.darkness - 0.3) / 0.3))
        : 0;
      session.lights.alpha = lightAlpha;
      session.emissiveSprites.forEach((emissive) => {
        const sprite = emissive;
        sprite.alpha = lightAlpha;
      });

      const now = performance.now() / 1000;
      session.waterTiles.forEach((waterSprite, i) => {
        const sprite = waterSprite;
        sprite.tilePosition.x = -now * (i === 0 ? 6 : 11);
        sprite.tilePosition.y = i === 0 ? 0 : -now * 4;
      });

      drawWeather(session, weather, timeOfDay, now);

      const markerChanged =
        (marker === null) !== (lastMarker === null) ||
        (marker !== null &&
          lastMarker !== null &&
          (marker.x !== lastMarker.x || marker.y !== lastMarker.y));

      if (markerChanged || markerDirty) {
        drawMarker(session.marker, marker);
        lastMarker = marker ? { ...marker } : null;
        markerDirty = false;
      }
    },
  };
};

export type PortRenderer = ReturnType<typeof createPortRenderer>;

export default createPortRenderer;
