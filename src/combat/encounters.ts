import { isCombatState } from './types';
import type {
  CombatOutcome,
  CombatState,
  DuelCombatantStats,
  NavalForce,
} from './types';

export interface DuelEncounter {
  kind: 'duel';
  enemy: DuelCombatantStats;
}

export interface NavalEncounter {
  kind: 'naval';
  enemy: NavalForce;
  captain: DuelCombatantStats;
}

export type CombatEncounter = DuelEncounter | NavalEncounter;

export const encounterCatalog = {
  'joao.m2.kahn-shipyard': {
    kind: 'duel',
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
    enemy: { hull: 42, maxHull: 42, crew: 18, guns: 8 },
    captain: {
      swordplay: 84,
      level: 4,
      weaponRating: 25,
      armorRating: 15,
      weaponCategory: null,
    },
  },
} as const;

export type CombatEncounterId = keyof typeof encounterCatalog;

export const canReplayEncounter = (
  encounterId: string,
  combatResults: Readonly<Record<string, CombatOutcome>>,
): boolean => {
  const outcome = combatResults[encounterId];
  if (outcome === undefined) return true;
  if (encounterId === 'joao.m2.kahn-house') return outcome === 'draw';
  if (encounterId === 'joao.m2.katarina') return outcome === 'defeat';
  return false;
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
  const definition: CombatEncounter | undefined =
    encounterCatalog[value.encounterId as CombatEncounterId];
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
