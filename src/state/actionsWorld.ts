import state from './state';
import { portAdjacentAt } from '../game/port/portUtils';
import createPort from '../game/port/port';
import Input from '../input';
import updateInterface from './updateInterface';
import { updateGeneral } from './actionsPort';
import {
  refreshProvisionInterface,
  settleDailyProvisions,
} from './actionsProvisions';
import { save } from './saveLoad';
import {
  getCurrent,
  getIsSummer,
  getSeaArea,
  getWind,
} from '../game/world/windCurrent';
import { START_DATE } from '../constants';
import { positionAdjacentToPort, shouldUpdateWorldStatus } from './selectors';
import { Position } from '../types';
import { getNewlyDiscoveredLandmarks } from '../data/discoveryData';

export const dock = (position: Position) => {
  const portId = portAdjacentAt(position);

  if (!portId) {
    return false; // TODO show message
  }

  // TODO NPC fleet positions need to be saved as well
  const playerFleet = state.fleets[1];

  if (playerFleet.position) {
    playerFleet.position = position;
  }

  state.port = createPort(portId);
  state.portId = portId;

  Input.reset();

  updateGeneral();

  state.dayAtSea = 0;
  updateInterface.dayAtSea(state.dayAtSea);

  // The banner is sea-only (design spec section 3) — clear it on arrival so
  // it can never reappear stale at the start of the next voyage.
  updateInterface.discovery([]);

  save();

  return true;
};

export const updateWorldStatus = () => {
  const { position } = state.fleets['1'];

  if (!position) {
    throw Error('Player fleet position is not set');
  }

  const seaArea = getSeaArea(position);

  const wind = getWind(seaArea, getIsSummer(START_DATE, state.timePassed));
  const current = getCurrent(seaArea);

  state.wind = wind;
  state.current = current;

  updateInterface.indicators({
    wind,
    current,
  });
};

export const worldTimeTick = (minutes = 20) => {
  const previousDay = Math.floor(state.timePassed / 1440);
  state.timePassed += minutes;

  if (shouldUpdateWorldStatus()) {
    updateWorldStatus();
  }

  const currentDay = Math.floor(state.timePassed / 1440);
  const daysCrossed = currentDay - previousDay;

  if (daysCrossed > 0) {
    updateGeneral();

    state.dayAtSea += daysCrossed;
    updateInterface.dayAtSea(state.dayAtSea);
    settleDailyProvisions(daysCrossed);
  }

  // Landmarks are only reachable while sailing — state.portId is null at
  // sea (see dock()/setSail()) — and detection needs a real fleet
  // position, which is unset only in the two edge cases documented on
  // setDockedFleetPositions below.
  const { position } = state.fleets['1'];

  if (state.portId === null && position) {
    const discovered = getNewlyDiscoveredLandmarks(position, state.discoveries);

    if (discovered.length > 0) {
      discovered.forEach((landmark) => {
        state.discoveries.push(landmark.id);
        state.fame.adventure += landmark.fame;
      });

      updateGeneral();
      updateInterface.discovery(discovered);
      // A fresh copy — the fame readout keys its React state off this
      // reference, and worldTimeTick can fire again before the next render,
      // mutating state.fame in place. Handing back the same object would
      // make that second update indistinguishable from the first.
      updateInterface.fame({ ...state.fame });
      save();
    }
  }
};

/*
  While fleets under normal circumstances always have a position even when
  docked, there are two exceptions:
    - The player at the start of the game
    - NPC sailors who have respawned
 */
export const setDockedFleetPositions = () => {
  const playerFleet = state.fleets[1];

  if (!playerFleet.position) {
    if (state.portId === null) {
      throw Error('Player fleet must start with a position if not in port');
    }

    playerFleet.position = positionAdjacentToPort(state.portId);
  }
};

export const setSail = () => {
  state.portId = null;
  state.buildingId = null;

  updateWorldStatus();

  Input.reset();

  updateGeneral();
  refreshProvisionInterface();
  save();
};
