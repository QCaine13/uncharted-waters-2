import type { DuelCombatantStats } from './types';

export interface DuelEncounter {
  kind: 'duel';
  enemy: DuelCombatantStats;
}

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
    kind: 'duel',
    enemy: {
      swordplay: 84,
      level: 4,
      weaponRating: 25,
      armorRating: 15,
      weaponCategory: null,
    },
  },
} as const;

export type CombatEncounterId = keyof typeof encounterCatalog;
