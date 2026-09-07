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
  type CombatOutcome,
  type Equipment,
  type MateProgress,
} from '../combat/types';
import {
  canReplayEncounter,
  isSupportedCombatState,
} from '../combat/encounters';
import { itemData } from '../data/itemData';

export const SAVE_VERSION = 7;

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
  // 6 -> 7: persist the first completion time for story events.
  6: (save) => ({
    ...save,
    version: 7,
    storyEventTimes: save.storyEventTimes ?? {},
  }),
};

const normalizeEquipment = (value: unknown, items: unknown): Equipment => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { weaponId: null, armorId: null };
  }
  const record = value as Record<string, unknown>;
  const owned = new Set(
    Array.isArray(items)
      ? items.filter((item): item is string => typeof item === 'string')
      : [],
  );
  const weaponId = typeof record.weaponId === 'string' ? record.weaponId : null;
  const armorId = typeof record.armorId === 'string' ? record.armorId : null;
  const weapon =
    weaponId !== null && owned.has(weaponId)
      ? itemData[weaponId as keyof typeof itemData]
      : undefined;
  const armor =
    armorId !== null && owned.has(armorId)
      ? itemData[armorId as keyof typeof itemData]
      : undefined;
  return {
    weaponId:
      weapon && ['1', '2', '3', '4'].includes(weapon.categoryId)
        ? weaponId
        : null,
    armorId: armor?.categoryId === '7' ? armorId : null,
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

const normalizeV6 = (save: AnySave): AnySave => {
  const combatResults = normalizeCombatResults(save.combatResults);
  const activeCombat = isSupportedCombatState(save.activeCombat)
    ? save.activeCombat
    : null;
  return {
    ...save,
    equipment: normalizeEquipment(save.equipment, save.items),
    mateProgress: normalizeMateProgress(save.mateProgress),
    combatResults,
    activeCombat:
      activeCombat !== null &&
      canReplayEncounter(activeCombat.encounterId, combatResults)
        ? activeCombat
        : null,
  };
};

const isValidStoryEventTime = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const normalizeStoryEventTimes = (
  value: unknown,
  storyEvents: unknown,
  timePassed: unknown,
): Record<string, number> => {
  const normalized =
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value).filter((entry): entry is [string, number] =>
            isValidStoryEventTime(entry[1]),
          ),
        )
      : {};
  const fallback = isValidStoryEventTime(timePassed) ? timePassed : 0;
  if (Array.isArray(storyEvents)) {
    storyEvents.forEach((eventId) => {
      if (
        typeof eventId === 'string' &&
        !isValidStoryEventTime(normalized[eventId])
      ) {
        normalized[eventId] = fallback;
      }
    });
  }
  return normalized;
};

const normalizeV7 = (save: AnySave): AnySave => {
  const normalized = normalizeV6(save);
  return {
    ...normalized,
    storyEventTimes: normalizeStoryEventTimes(
      save.storyEventTimes,
      save.storyEvents,
      save.timePassed,
    ),
  };
};

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

  return normalizeV7(current);
};
