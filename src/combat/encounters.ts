import { isCombatState } from './types';
import type {
  CombatOutcome,
  CombatState,
  DuelCombatantStats,
  NavalForce,
} from './types';

interface EncounterPolicy {
  nameKey: string;
  captainNameKey?: string;
  replayOutcomes: readonly CombatOutcome[];
  experience: Partial<
    Record<CombatOutcome, { readonly joao: number; readonly others: number }>
  >;
  recoveryPortId?: string;
}

export interface DuelEncounter extends EncounterPolicy {
  kind: 'duel';
  enemy: DuelCombatantStats;
}

export interface NavalEncounter extends EncounterPolicy {
  kind: 'naval';
  enemy: NavalForce;
  captain: DuelCombatantStats;
}

export type CombatEncounter = DuelEncounter | NavalEncounter;

export const encounterCatalog = {
  'joao.m2.kahn-shipyard': {
    kind: 'duel',
    nameKey: 'Kahn at the shipyard',
    captainNameKey: 'Antonio Kahn',
    replayOutcomes: [],
    experience: {},
    enemy: {
      swordplay: 66,
      level: 2,
      weaponRating: 10,
      armorRating: 0,
      weaponCategory: null,
    },
  },
  'joao.m2.kahn-house': {
    kind: 'duel',
    nameKey: 'Kahn at the Franco house',
    captainNameKey: 'Antonio Kahn',
    replayOutcomes: ['draw'],
    experience: { victory: { joao: 100, others: 0 } },
    enemy: {
      swordplay: 78,
      level: 3,
      weaponRating: 20,
      armorRating: 10,
      weaponCategory: null,
    },
  },
  'joao.m2.katarina': {
    kind: 'naval',
    nameKey: 'Katarina’s pursuit',
    captainNameKey: 'Katarina Erantzo',
    replayOutcomes: ['defeat'],
    experience: {
      victory: { joao: 100, others: 50 },
      retreat: { joao: 25, others: 25 },
    },
    recoveryPortId: '1',
    enemy: { hull: 42, maxHull: 42, crew: 18, guns: 8 },
    captain: {
      swordplay: 84,
      level: 4,
      weaponRating: 25,
      armorRating: 15,
      weaponCategory: null,
    },
  },
  'joao.m3.ottoman-one': {
    kind: 'naval',
    nameKey: 'Ottoman Vanguard',
    captainNameKey: 'Ottoman Vanguard Captain',
    replayOutcomes: ['defeat'],
    experience: {
      victory: { joao: 100, others: 50 },
      retreat: { joao: 25, others: 25 },
    },
    recoveryPortId: '75',
    enemy: { hull: 46, maxHull: 46, crew: 18, guns: 8 },
    captain: {
      swordplay: 76,
      level: 4,
      weaponRating: 20,
      armorRating: 10,
      weaponCategory: null,
    },
  },
  'joao.m3.ottoman-two': {
    kind: 'naval',
    nameKey: 'Ottoman Main Fleet',
    captainNameKey: 'Ottoman Fleet Captain',
    replayOutcomes: ['defeat'],
    experience: {
      victory: { joao: 100, others: 50 },
      retreat: { joao: 25, others: 25 },
    },
    recoveryPortId: '75',
    enemy: { hull: 52, maxHull: 52, crew: 20, guns: 8 },
    captain: {
      swordplay: 80,
      level: 5,
      weaponRating: 25,
      armorRating: 15,
      weaponCategory: null,
    },
  },
  'joao.m3.rudolph': {
    kind: 'duel',
    nameKey: 'Rudolph',
    replayOutcomes: [],
    experience: { victory: { joao: 100, others: 0 } },
    enemy: {
      swordplay: 86,
      level: 5,
      weaponRating: 30,
      armorRating: 15,
      weaponCategory: null,
    },
  },
  'joao.m3.amazon': {
    kind: 'naval',
    nameKey: 'Neo-Atlantis Fleet',
    captainNameKey: "Martinez's Captain",
    replayOutcomes: ['defeat', 'retreat', 'draw'],
    experience: {
      victory: { joao: 150, others: 75 },
      retreat: { joao: 0, others: 0 },
    },
    recoveryPortId: '57',
    enemy: { hull: 64, maxHull: 64, crew: 22, guns: 10 },
    captain: {
      swordplay: 90,
      level: 6,
      weaponRating: 35,
      armorRating: 20,
      weaponCategory: null,
    },
  },
  'katarina.seville-patrol': {
    kind: 'naval',
    nameKey: 'Spanish Pursuit Squadron',
    captainNameKey: 'Spanish Patrol Commander',
    replayOutcomes: ['defeat', 'retreat'],
    experience: {
      victory: { joao: 100, others: 50 },
      retreat: { joao: 25, others: 25 },
    },
    recoveryPortId: '2',
    enemy: { hull: 40, maxHull: 40, crew: 16, guns: 6 },
    captain: {
      swordplay: 70,
      level: 3,
      weaponRating: 15,
      armorRating: 10,
      weaponCategory: null,
    },
  },
  'katarina.joao-fleet': {
    kind: 'naval',
    nameKey: 'Franco Expedition Fleet',
    captainNameKey: 'Franco Vanguard Captain',
    replayOutcomes: ['defeat', 'retreat'],
    experience: {
      victory: { joao: 120, others: 60 },
      retreat: { joao: 25, others: 25 },
    },
    recoveryPortId: '29',
    enemy: { hull: 46, maxHull: 46, crew: 18, guns: 8 },
    captain: {
      swordplay: 76,
      level: 4,
      weaponRating: 20,
      armorRating: 10,
      weaponCategory: null,
    },
  },
  'katarina.cayenne-duel': {
    kind: 'duel',
    nameKey: 'Cayenne Garrison Duel',
    captainNameKey: 'Colonial Commandant',
    replayOutcomes: ['defeat', 'draw'],
    experience: { victory: { joao: 120, others: 0 } },
    enemy: {
      swordplay: 82,
      level: 5,
      weaponRating: 25,
      armorRating: 15,
      weaponCategory: null,
    },
  },
  'katarina.amazon-martinez': {
    kind: 'naval',
    nameKey: "Marquis Martinez's Flagship",
    captainNameKey: 'Marquis Martinez',
    replayOutcomes: ['defeat', 'retreat', 'draw'],
    experience: {
      victory: { joao: 180, others: 90 },
      retreat: { joao: 0, others: 0 },
    },
    recoveryPortId: '57',
    enemy: { hull: 68, maxHull: 68, crew: 24, guns: 10 },
    captain: {
      swordplay: 88,
      level: 6,
      weaponRating: 30,
      armorRating: 20,
      weaponCategory: null,
    },
  },
  'pietro.basra-raider': {
    kind: 'duel',
    nameKey: 'Basra Relic Duel',
    captainNameKey: 'Relic Hunter Boss',
    replayOutcomes: ['defeat', 'draw'],
    experience: { victory: { joao: 100, others: 0 } },
    enemy: {
      swordplay: 72,
      level: 3,
      weaponRating: 15,
      armorRating: 10,
      weaponCategory: null,
    },
  },
  'pietro.eldorado-fleet': {
    kind: 'naval',
    nameKey: 'El Dorado Guardian Fleet',
    captainNameKey: 'Sanctuary Fleet Commander',
    replayOutcomes: ['defeat', 'retreat', 'draw'],
    experience: {
      victory: { joao: 150, others: 75 },
      retreat: { joao: 0, others: 0 },
    },
    recoveryPortId: '57',
    enemy: { hull: 56, maxHull: 56, crew: 20, guns: 8 },
    captain: {
      swordplay: 80,
      level: 5,
      weaponRating: 25,
      armorRating: 15,
      weaponCategory: null,
    },
  },
} as const;

export type CombatEncounterId = keyof typeof encounterCatalog;

export const getEncounter = (
  encounterId: string,
): CombatEncounter | undefined =>
  encounterCatalog[encounterId as CombatEncounterId] as
    | CombatEncounter
    | undefined;

export const canReplayEncounter = (
  encounterId: string,
  combatResults: Readonly<Record<string, CombatOutcome>>,
): boolean => {
  const definition = getEncounter(encounterId);
  if (!definition) return false;
  const outcome = combatResults[encounterId];
  return outcome === undefined || definition.replayOutcomes.includes(outcome);
};

export const getEncounterExperience = (
  encounterId: string,
  outcome: CombatOutcome,
): { joao: number; others: number } => {
  const reward = getEncounter(encounterId)?.experience[outcome];
  return reward ? { ...reward } : { joao: 0, others: 0 };
};

const sameStats = (
  actual: DuelCombatantStats,
  expected: DuelCombatantStats,
): boolean =>
  actual.swordplay === expected.swordplay &&
  actual.level === expected.level &&
  actual.weaponRating === expected.weaponRating &&
  actual.armorRating === expected.armorRating &&
  actual.weaponCategory === expected.weaponCategory;

export const isSupportedCombatState = (
  value: unknown,
): value is CombatState => {
  if (!isCombatState(value)) return false;
  const definition = getEncounter(value.encounterId);
  if (!definition || definition.kind !== value.kind) return false;

  if (value.kind === 'duel' && definition.kind === 'duel') {
    return sameStats(value.enemy.stats, definition.enemy);
  }

  if (value.kind !== 'naval' || definition.kind !== 'naval') return false;
  if (
    value.enemy.maxHull !== definition.enemy.maxHull ||
    value.enemy.guns !== definition.enemy.guns ||
    value.enemy.crew > definition.enemy.crew
  ) {
    return false;
  }
  return (
    value.boardingDuel === null ||
    (value.boardingDuel.encounterId === value.encounterId &&
      sameStats(value.boardingDuel.enemy.stats, definition.captain))
  );
};
