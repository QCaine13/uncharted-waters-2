import { START_TIME_PASSED } from '../constants';
import { Provisions, fleets, Fleets } from '../game/world/fleets';
import type { Port } from '../game/port/port';
import type { World } from '../game/world/world';
import type { LegacyQuestCompletionKey } from '../story/legacy/lisbonCompletionKeys';
import { ItemId } from '../data/itemData';
import type { MarketPriceEntry } from '../data/marketPricing';
import { migrate } from './saveMigrations';
import type {
  CombatOutcome,
  CombatState,
  Equipment,
  MateProgress,
} from '../combat/types';

export type Stage = 'world' | 'port' | 'building';

export type Velocity = {
  direction: number;
  speed: number;
};

export type ProvisionsType = {
  [key in Provisions]: number;
};

type UsedShipsAtPort = { [key: string]: UsedShips };
export type UsedShips = { [key: string]: string };

export type Role =
  | number
  | 'firstMate'
  | 'bookKeeper'
  | 'chiefNavigator'
  | null;

type Mate = {
  sailorId: string;
  role: Role;
};

// The three fame tracks most routes are gated by. (Duplicated minimally from
// data/storyHooks.ts FameType for now; the two should converge later — see D5.)
export type FameType = 'adventure' | 'pirate' | 'trade';
export type Fame = { [key in FameType]: number };

// Sparse: a missing [marketId][goodId] entry means index 100 (design spec
// section 3).
export type MarketPriceState = {
  [marketId: string]: { [goodId: string]: MarketPriceEntry };
};

export interface State {
  portId: string | null;
  buildingId: string | null;
  timePassed: number;
  world: World;
  fleets: Fleets;
  seaArea: number | undefined;
  wind: Velocity;
  current: Velocity;
  playerFleet: Velocity;
  port: Port;
  dayAtSea: number;
  gold: number;
  quests: LegacyQuestCompletionKey[];
  usedShipsAtPort: UsedShipsAtPort;
  savings: number;
  debt: number;
  items: ItemId[];
  mates: Mate[];
  fame: Fame;
  marketPrices: MarketPriceState;
  // Discovered landmark ids (src/data/discoveryData.ts), insertion order.
  discoveries: string[];
  // Semantic story event ids, including IDs unknown to this build.
  storyEvents: string[];
  // Discovery ids whose one-time port report reward has already been paid.
  reportedDiscoveries: string[];
  equipment: Equipment;
  mateProgress: MateProgress;
  combatResults: Record<string, CombatOutcome>;
  activeCombat: CombatState | null;
}

export const SAVED_STATE_KEY = 'savedState';

const loadSavedState = (): Partial<State> => {
  try {
    const raw = window.localStorage.getItem(SAVED_STATE_KEY);
    if (!raw) return {};

    // Run the save through the migration chain so older saves are upgraded
    // (and given defaults for newer fields) instead of being discarded.
    const migrated = migrate(JSON.parse(raw));
    return migrated ? (migrated as Partial<State>) : {};
  } catch {
    return {};
  }
};

const savedState = loadSavedState();

const state = {
  portId: '1',
  buildingId: null,
  timePassed: START_TIME_PASSED,
  fleets,
  dayAtSea: 0,
  gold: 0,
  quests: [] as LegacyQuestCompletionKey[],
  usedShipsAtPort: {},
  savings: 0,
  debt: 0,
  items: [],
  mates: [
    {
      sailorId: '1',
      role: null,
    },
  ] as Mate[],
  fame: { adventure: 0, pirate: 0, trade: 0 },
  marketPrices: {},
  discoveries: [] as string[],
  ...savedState,
  storyEvents: Array.isArray(savedState.storyEvents)
    ? savedState.storyEvents
    : [],
  reportedDiscoveries: Array.isArray(savedState.reportedDiscoveries)
    ? savedState.reportedDiscoveries
    : [],
  equipment: savedState.equipment ?? { weaponId: null, armorId: null },
  mateProgress: savedState.mateProgress ?? {},
  combatResults: savedState.combatResults ?? {},
  activeCombat: savedState.activeCombat ?? null,
} as State;

export default state;
