import { START_TIME_PASSED } from '../constants';
import { fleets } from '../game/world/fleets';
import { notifyCombatChanged } from '../combat/combatEvents';
import { updateGeneral } from './actionsPort';
import { notifyGameLoaded } from './saveEvents';
import { save } from './saveLoad';
import type { ProtagonistId } from './saveMigrations';
import state, { type Fame, type Role, type State } from './state';

export interface ProtagonistProfile {
  id: ProtagonistId;
  name: string;
  title: string;
  nationality: string;
  startPortId: string;
  startPosition: { x: number; y: number };
  startGold: number;
  startDebt: number;
  startFame: Fame;
  startMates: ReadonlyArray<{ sailorId: string; role: Role }>;
}

export const PROTAGONIST_PROFILES: Record<ProtagonistId, ProtagonistProfile> = {
  joao: {
    id: 'joao',
    name: 'João Franco',
    title: 'Heir to Duke León Franco',
    nationality: 'Portugal',
    startPortId: '1',
    startPosition: { x: 966, y: 398 },
    startGold: 0,
    startDebt: 0,
    startFame: { adventure: 0, pirate: 0, trade: 0 },
    startMates: [
      { sailorId: '1', role: null },
      { sailorId: '32', role: 'firstMate' },
    ],
  },
  katarina: {
    id: 'katarina',
    name: 'Katarina Erantzo',
    title: 'Red-Haired Corsair of Spain',
    nationality: 'Spain',
    startPortId: '2',
    startPosition: { x: 862, y: 374 },
    startGold: 500,
    startDebt: 0,
    startFame: { adventure: 0, pirate: 100, trade: 0 },
    startMates: [{ sailorId: '2', role: null }],
  },
  otto: {
    id: 'otto',
    name: 'Otto Baynes',
    title: 'Privateer of the English Crown',
    nationality: 'England',
    startPortId: '30',
    startPosition: { x: 900, y: 264 },
    startGold: 1000,
    startDebt: 0,
    startFame: { adventure: 0, pirate: 80, trade: 0 },
    startMates: [{ sailorId: '3', role: null }],
  },
  ernst: {
    id: 'ernst',
    name: 'Ernst von Bohr',
    title: 'Dutch Cartographer & Scholar',
    nationality: 'Holland',
    startPortId: '34',
    startPosition: { x: 936, y: 250 },
    startGold: 800,
    startDebt: 0,
    startFame: { adventure: 80, pirate: 0, trade: 0 },
    startMates: [{ sailorId: '5', role: null }],
  },
  pietro: {
    id: 'pietro',
    name: 'Pietro Conti',
    title: 'Genoese Explorer & Relic Seeker',
    nationality: 'Italy',
    startPortId: '9',
    startPosition: { x: 950, y: 322 },
    startGold: 200,
    startDebt: 5000,
    startFame: { adventure: 50, pirate: 0, trade: 0 },
    startMates: [{ sailorId: '4', role: null }],
  },
  ali: {
    id: 'ali',
    name: 'Ali Vezas',
    title: 'Rising Merchant of Istanbul',
    nationality: 'Turkey',
    startPortId: '3',
    startPosition: { x: 1072, y: 346 },
    startGold: 0,
    startDebt: 1000,
    startFame: { adventure: 0, pirate: 0, trade: 20 },
    startMates: [{ sailorId: '6', role: null }],
  },
};

export const startNewGameAs = (protagonistId: ProtagonistId): void => {
  const profile =
    PROTAGONIST_PROFILES[protagonistId] ?? PROTAGONIST_PROFILES.joao;
  const freshFleets = JSON.parse(JSON.stringify(fleets)) as State['fleets'];
  freshFleets['1'].position = { ...profile.startPosition };
  freshFleets['1'].ships = [];

  state.protagonistId = profile.id;
  state.portId = profile.startPortId;
  state.buildingId = null;
  state.timePassed = START_TIME_PASSED;
  state.fleets = freshFleets;
  state.dayAtSea = 0;
  state.gold = profile.startGold;
  state.quests = [];
  state.usedShipsAtPort = {};
  state.savings = 0;
  state.debt = profile.startDebt;
  state.items = [];
  state.mates = profile.startMates.map((mate) => ({ ...mate }));
  state.fame = { ...profile.startFame };
  state.marketPrices = {};
  state.portInvestments = {};
  state.discoveries = [];
  state.storyEvents = [];
  state.storyEventTimes = {};
  state.reportedDiscoveries = [];
  state.equipment = { weaponId: null, armorId: null };
  state.mateProgress = {};
  state.combatResults = {};
  state.activeCombat = null;
  state.world = undefined as unknown as State['world'];
  state.port = undefined as unknown as State['port'];

  notifyCombatChanged();
  save();
  notifyGameLoaded();
  updateGeneral();
};
