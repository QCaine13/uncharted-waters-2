import createMap from '../../map';
import PercentNextMove from '../../percentNextMove';
import createBuilding from '../../building';
import createPortCharacters from './portCharacters';
import createPortPath, { resolveClickTarget } from './portPath';
import { getPortData } from './portUtils';
import { getTimeOfDay, isDay } from '../../state/selectors';
import { getCameraPosition } from '../world/sharedUtils';
import createPortRenderer from '../../render/portRenderer';
import state from '../../state/state';
import Input from '../../input';
import { TILE_SIZE } from '../../constants';

const createPort = (portId: string) => {
  const canvas = document.getElementById('camera-port') as HTMLCanvasElement;

  const width = canvas.width / TILE_SIZE;
  const height = canvas.height / TILE_SIZE;

  const portData = getPortData(portId);
  const map = createMap(
    [Math.ceil(width + 1), Math.ceil(height + 1)],
    portData,
  );

  const building = createBuilding(portId);
  const bounds = { columns: map.tilemapColumns, rows: map.tilemapRows };
  const path = createPortPath({ isBlocked: map.collisionAt, bounds });
  const characters = createPortCharacters(
    map,
    building,
    portData.isSupplyPort,
    path,
  );
  const renderer = createPortRenderer(canvas, { map });

  renderer.onTileClick((tile) => {
    if (Input.isSuspended() || state.buildingId !== null) {
      return;
    }

    const target = resolveClickTarget(tile, {
      buildings: Object.values(portData.buildings),
      isBlocked: map.collisionAt,
      bounds,
    });

    if (target) {
      path.setGoal(target);
    }
  });

  renderer.onSecondaryClick(() => {
    path.cancel();
  });

  if (isDay()) {
    characters.spawnNpcs();
  }

  return {
    update: () => {
      PercentNextMove.update();

      if (PercentNextMove.get() !== 0) {
        return;
      }

      characters.update();
    },
    draw: () => {
      const player = characters.player();
      const camera = getCameraPosition(
        player,
        { width: width / renderer.zoom(), height: height / renderer.zoom() },
        map,
        PercentNextMove.get(),
        false,
      );

      renderer.render({
        camera,
        player,
        npcs: characters.npcs(),
        timeOfDay: getTimeOfDay(),
        percentNextMove: PercentNextMove.get(),
        marker: path.goal(),
      });
    },
    characters: () => characters,
  };
};

export type Port = ReturnType<typeof createPort>;

export default createPort;
