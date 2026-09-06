/*
 Save-format version migrations (decision D6).

 Before this existed, a version mismatch on load simply DISCARDED the save, so the
 first time we added a field and bumped the version every player would lose their
 progress. Instead we upgrade old snapshots step by step.

 To add a new save field: bump CURRENT_VERSION, then add a migration from the previous
 version that fills in a sensible default for the new field. Migrations are pure and
 run in sequence (1 -> 2 -> 3 ...). An unknown / unparseable version falls back to null,
 which callers treat the same as "no save" — so this is strictly safer than before.
*/

import { legacyToSemanticEvent } from '../story/legacy/lisbonCompletionKeys';
import {
  combatOutcomes,
  isCombatState,
  type CombatOutcome,
  type Equipment,
  type MateProgress,
} from '../combat/types';

export const SAVE_VERSION = 6;

export type AnySave = Record<string, unknown> & { version?: unknown };

const migrations: Record<number, (save: AnySave) => AnySave> = {
  // 1 -> 2: introduce fame (decision D6 / story-engine slice 2). Old saves start at zero.
  1: (save) => ({
    ...save,
    version: 2,
    fame: { adventure: 0, pirate: 0, trade: 0 },
  }),
  // 2 -> 3: introduce dynamic market prices (market price dynamics design).
  // Old saves have no price history, so every good starts at the default index.
  2: (save) => ({
    ...save,
    version: 3,
    marketPrices: {},
  }),
  // 3 -> 4: introduce geographic discoveries (discovery MVP design). Old
  // saves haven't sighted any landmark yet.
  3: (save) => ({
    ...save,
    version: 4,
    discoveries: [],
  }),
  // 4 -> 5: persist semantic story completion independently of legacy quest
  // keys. Discoveries in v4 have already paid their gold reward, so they are
  // reported during migration to prevent a second payout.
  4: (save) => {
    const quests = Array.isArray(save.quests) ? save.quests : [];
    const discoveries = Array.isArray(save.discoveries) ? save.discoveries : [];
    const storyEvents = quests.reduce<string[]>((eventIds, key) => {
      if (typeof key !== 'string') return eventIds;
      const eventId =
        legacyToSemanticEvent[key as keyof typeof legacyToSemanticEvent];
      if (eventId !== undefined) eventIds.push(eventId);
      return eventIds;
    }, []);

    return {
      ...save,
      version: 5,
      storyEvents: [...new Set(storyEvents)],
      reportedDiscoveries: [...discoveries],
    };
  },
  // 5 -> 6: persist deterministic combat progression and resumable snapshots.
  5: (save) => ({
    ...save,
    version: 6,
    equipment: { weaponId: null, armorId: null },
    mateProgress: {},
    combatResults: {},
    activeCombat: null,
  }),
};

const normalizeEquipment = (value: unknown): Equipment => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { weaponId: null, armorId: null };
  }
  const record = value as Record<string, unknown>;
  return {
    weaponId: typeof record.weaponId === 'string' ? record.weaponId : null,
    armorId: typeof record.armorId === 'string' ? record.armorId : null,
  };
};

const normalizeMateProgress = (value: unknown): MateProgress => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, { battleExperience: number }] => {
        const progress = entry[1];
        return (
          typeof progress === 'object' &&
          progress !== null &&
          !Array.isArray(progress) &&
          typeof (progress as Record<string, unknown>).battleExperience ===
            'number' &&
          Number.isFinite(
            (progress as Record<string, unknown>).battleExperience,
          ) &&
          ((progress as Record<string, unknown>).battleExperience as number) >=
            0
        );
      },
    ),
  );
};

const normalizeCombatResults = (
  value: unknown,
): Record<string, CombatOutcome> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, CombatOutcome] =>
      combatOutcomes.includes(entry[1] as CombatOutcome),
    ),
  );
};

const normalizeV6 = (save: AnySave): AnySave => ({
  ...save,
  equipment: normalizeEquipment(save.equipment),
  mateProgress: normalizeMateProgress(save.mateProgress),
  combatResults: normalizeCombatResults(save.combatResults),
  activeCombat: isCombatState(save.activeCombat) ? save.activeCombat : null,
});

export const migrate = (raw: AnySave | null | undefined): AnySave | null => {
  if (!raw || typeof raw.version !== 'number') {
    return null;
  }

  let current = raw;

  while (current.version !== SAVE_VERSION) {
    const step = migrations[current.version as number];

    if (!step) {
      // Unknown version or a hole in the migration chain — fail safe.
      return null;
    }

    current = step(current);
  }

  return normalizeV6(current);
};
