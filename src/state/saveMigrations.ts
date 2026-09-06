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

export const SAVE_VERSION = 5;

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

  return current;
};
