import Input from '../../input';
import type { Position } from '../../types';
import { Map } from '../../map';
import createWorldPlayer from './worldPlayer';
import createWorldNpc, { WorldNpc } from './worldNpc';
import state from '../../state/state';
import type { Ship } from './fleets';
import { hasOars } from './worldUtils';
import { dock } from '../../state/actionsWorld';

const FRAMES_PER_SHIP = 8;
const SHIP_VARIANTS = 2;

export const getStartFrame = (flagship: Ship, isPlayer = false) => {
  const startFrame = hasOars(flagship.id) ? 0 : FRAMES_PER_SHIP;

  return isPlayer ? startFrame : startFrame + FRAMES_PER_SHIP * SHIP_VARIANTS;
};

const createWorldCharacters = (map: Map) => {
  const playerFleet = state.fleets[1];

  if (!playerFleet.position) {
    throw Error('Player fleet has no position');
  }

  const player = createWorldPlayer(
    playerFleet.position,
    getStartFrame(playerFleet.ships[0], true),
    'n',
  );

  const npcs: WorldNpc[] = [];

  for (let id = 2; id <= Object.keys(state.fleets).length; id += 1) {
    const { position, ships } = state.fleets[id];

    if (!position) {
      throw Error('NPC fleet has no position');
    }

    npcs.push(createWorldNpc(position, getStartFrame(ships[0]), 'n', true));
  }

  const collision = (position: Position) => map.collisionAt(position);

  return {
    update: () => {
      player.update();

      /*
        createWorldPlayer captures the fleet's starting position and then
        REASSIGNS its own local each tick, so state.fleets never saw the
        fleet move — it stayed frozen at wherever the last dock or load put
        it, for the whole voyage. Everything reading the fleet's position off
        state was therefore reading the departure port: updateWorldStatus's
        sea area (so wind and current never changed at sea) and landmark
        discovery (which could only ever fire from a docked position).
        Publishing the committed tile position here is the sync that was
        missing; dock() still owns writing the final position on arrival.
       */
      playerFleet.position = player.position();

      if (Input.getPressedE() && dock(player.position())) {
        player.setHeading('');
        return;
      }

      const direction = Input.getDirection({ includeOrdinal: true });

      // this check allows the player to keep their heading even after releasing input
      if (direction) {
        player.setHeading(direction);
      }

      player.updateSpeed();

      const heading = player.heading();

      if (heading) {
        player.move(heading, collision);
      }

      npcs.forEach((npc) => {
        npc.update();

        if (!npc.shouldMove()) {
          return;
        }

        npc.move();

        // if (collision(npc)) {
        //   npc.undoMove();
        // }
      });
    },
    player: () => player,
    npcs: () => npcs,
  };
};

export type WorldCharacters = ReturnType<typeof createWorldCharacters>;

export default createWorldCharacters;
