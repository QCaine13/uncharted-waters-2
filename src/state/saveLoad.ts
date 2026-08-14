import state, { SAVED_STATE_KEY, State } from './state';
import { migrate, SAVE_VERSION } from './saveMigrations';

export { SAVE_VERSION };

interface SaveData {
  version: number;
  portId: State['portId'];
  buildingId: State['buildingId'];
  timePassed: State['timePassed'];
  fleets: State['fleets'];
  dayAtSea: State['dayAtSea'];
  gold: State['gold'];
  quests: State['quests'];
  usedShipsAtPort: State['usedShipsAtPort'];
  savings: State['savings'];
  debt: State['debt'];
  items: State['items'];
  mates: State['mates'];
  fame: State['fame'];
  marketPrices: State['marketPrices'];
  discoveries: State['discoveries'];
}

export const save = (): void => {
  const saveData: SaveData = {
    version: SAVE_VERSION,
    portId: state.portId,
    buildingId: state.buildingId,
    timePassed: state.timePassed,
    fleets: JSON.parse(JSON.stringify(state.fleets)),
    dayAtSea: state.dayAtSea,
    gold: state.gold,
    quests: [...state.quests],
    usedShipsAtPort: JSON.parse(JSON.stringify(state.usedShipsAtPort)),
    savings: state.savings,
    debt: state.debt,
    items: [...state.items],
    mates: JSON.parse(JSON.stringify(state.mates)),
    fame: { ...state.fame },
    marketPrices: JSON.parse(JSON.stringify(state.marketPrices)),
    discoveries: [...state.discoveries],
  };

  window.localStorage.setItem(SAVED_STATE_KEY, JSON.stringify(saveData));
};

export const load = (): boolean => {
  const raw = window.localStorage.getItem(SAVED_STATE_KEY);

  if (!raw) {
    return false;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return false;
  }

  // Upgrade older saves through the migration chain instead of rejecting them.
  const saveData = migrate(parsed as Record<string, unknown>) as SaveData | null;

  if (!saveData) {
    return false;
  }

  state.portId = saveData.portId;
  state.buildingId = saveData.buildingId;
  state.timePassed = saveData.timePassed;
  state.fleets = saveData.fleets;
  state.dayAtSea = saveData.dayAtSea;
  state.gold = saveData.gold;
  state.quests = saveData.quests;
  state.usedShipsAtPort = saveData.usedShipsAtPort;
  state.savings = saveData.savings;
  state.debt = saveData.debt;
  state.items = saveData.items;
  state.mates = saveData.mates;
  state.fame = saveData.fame;
  state.marketPrices = saveData.marketPrices;
  state.discoveries = saveData.discoveries;

  // Clear non-serializable objects so game loop recreates them
  state.world = undefined as unknown as State['world'];
  state.port = undefined as unknown as State['port'];

  return true;
};

export const reset = (): void => {
  window.localStorage.removeItem(SAVED_STATE_KEY);
  window.location.reload();
};

export const hasSave = (): boolean =>
  window.localStorage.getItem(SAVED_STATE_KEY) !== null;
