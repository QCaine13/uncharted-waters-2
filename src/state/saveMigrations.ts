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

export const SAVE_VERSION = 2;

export type AnySave = Record<string, unknown> & { version?: unknown };

const migrations: Record<number, (save: AnySave) => AnySave> = {
  // 1 -> 2: introduce fame (decision D6 / story-engine slice 2). Old saves start at zero.
  1: (save) => ({
    ...save,
    version: 2,
    fame: { adventure: 0, pirate: 0, trade: 0 },
  }),
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
