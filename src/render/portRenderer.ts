import {
  Application,
  Assets as PixiAssets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
} from 'pixi.js';
import Assets from '../assets';
import { hdBuildings } from '../game/images/hd/hdManifest';
import { TILE_SIZE } from '../constants';
import type { Map as GameMap } from '../map';
import type { PortNpc } from '../game/port/portNpc';
import type { PortPlayer } from '../game/port/portPlayer';
import type { Position } from '../types';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 800;

const VIEW_TILES_X = CANVAS_WIDTH / TILE_SIZE;
const VIEW_TILES_Y = CANVAS_HEIGHT / TILE_SIZE;

const MIN_ZOOM = 1;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

// Session-only zoom level, shared across port visits.
let zoomFactor = MIN_ZOOM;

type Character = PortPlayer | PortNpc;

interface Frame {
  camera: Position;
  player: Character;
  npcs: Character[];
  timeOfDay: number;
  percentNextMove: number;
  marker: Position | null;
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
  buildingLayer: Container;
  characterLayer: Container;
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

        const hdTextures = Promise.all(
          hdBuildings.flatMap((building) =>
            [building.url, building.emissive]
              .filter((url): url is string => url !== null)
              .map((url) => PixiAssets.load(url)),
          ),
        ).then((textures: Texture[]) => {
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
  buildingLayer: new Container(),
  characterLayer: new Container(),
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

interface PortRendererOptions {
  map: GameMap;
  hdPort: boolean;
}

const createPortRenderer = (
  canvas: HTMLCanvasElement,
  { map, hdPort }: PortRendererOptions,
) => {
  const session = createSession();
  let ready = false;

  initApp(canvas).then((app) => {
    if (activeSession) {
      activeSession.world.destroy({ children: true });
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

    session.world.addChild(
      session.tileLayer,
      session.buildingLayer,
      session.characterLayer,
      session.marker,
    );
    app.stage.addChild(session.world);
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

      syncTiles(timeOfDay);
      syncCharacters([player, ...npcs]);

      [player, ...npcs].forEach((character) => {
        const sprite = session.characterSprites.get(character);
        if (!sprite) {
          return;
        }

        const position = character.position(percentNextMove);
        sprite.texture = characterTexture(character.frame());
        sprite.position.set(position.x * TILE_SIZE, position.y * TILE_SIZE);
      });

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
