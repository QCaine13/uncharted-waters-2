# Save/Load & Persistence

## Current contract — M2 / save v6

Updated 2026-09-06. The implementation is in
[`saveMigrations.ts`](../../src/state/saveMigrations.ts),
[`saveLoad.ts`](../../src/state/saveLoad.ts), and
[`state.ts`](../../src/state/state.ts). The proposal below is retained as
historical design context; its version-1 status and remaining-work list are not
the current implementation status.

- A single `savedState` key holds the game snapshot. Language preference uses
  the separate `uw2.locale` key. Browser origins, including different preview
  ports, have separate storage.
- Startup and explicit Load share the migration chain. Versions 1 through 5
  migrate to version 6; an unsupported version or invalid JSON is rejected.
  Explicit failed Load leaves the running game unchanged. Live world/port
  objects are rebuilt after a successful load, and load subscribers reconcile
  input pauses and open sessions.
- Version 5 introduced `storyEvents` and `reportedDiscoveries`. Old Lisbon
  quest keys remain in `quests`; unknown progress IDs are retained. Version-4
  discoveries are treated as already reported because their gold was paid by
  that version.
- Version 6 adds `equipment` (`weaponId`, `armorId`), `mateProgress` (battle XP
  by sailor ID), `combatResults` (outcome by encounter ID), and `activeCombat`
  (a serializable duel/naval snapshot or `null`). Version-5 migration initializes
  those fields without changing possessions, money, companions, or story history.
- Current-version normalization clears unsupported or malformed active combats,
  invalid equipment slots, invalid XP entries, and invalid outcome values.
  Equipped items must be owned and match the slot category. Unknown historical
  combat IDs with supported outcome values remain saved; unknown inventory IDs
  remain owned. This is defensive normalization of the M2 fields, not a claim
  that every legacy state field has a complete runtime schema.
- Combat snapshots retain phase, intent, round, revision, HP, range, crew, shot,
  lumber, and any nested captain duel. A legal action saves once. Result
  confirmation records the outcome, applies its one-time XP/recovery, and clears
  the active snapshot in one save. Stale controls and covered controls do nothing.
- Start, normalization, and final settlement share `canReplayEncounter` from
  `src/combat/encounters.ts`. If stored history already closes an encounter,
  normalization discards its conflicting active snapshot and load releases the
  combat pause; history, possessions, and earned XP remain intact. House-draw
  rematches and naval-defeat retries remain valid, including pending results.
  Final settlement independently rejects a closed encounter before mutation.
  Loading normalizes the running state without immediately rewriting storage;
  the next save persists the normalized snapshot.
- A declarative event that starts combat uses `startCombatWithoutSave` inside
  its effect group; the story runtime performs the enclosing save. Do not add
  a second save or a narrative callback to simulate an outcome.

When adding persistent state, update the state type, save/load field list,
migration defaults, normalization where needed, and round-trip tests together.
The explicit field list is still maintained in code; the proposed
`SERIALIZABLE_KEYS` refactor and multiple save slots below have not shipped.
Combat coverage lives in `src/state/saveMigrations.test.ts`,
`src/state/saveLoad.test.ts`, and `src/state/actionsCombat.test.ts`.

## Historical proposal — June 2026

**Status**: Revised — MVP already shipped; this doc now covers the *remaining* hardening work  
**Date**: 2026-06-13 (revised 2026-06-13 against commit `9593a11`)  
**Related**: `docs/roadmap.md` (lists Save/Load as Phase 2), `docs/5-data-governance/`

> **Revision note**: The original draft assumed Save/Load did not exist yet. Since commit
> `9593a11` ("add save/load system and market trading"), a working MVP is already in the
> codebase. The sections below have been rewritten to reflect that and to scope only the
> work that genuinely remains.

## 1. What Already Exists (✅ Done)

The MVP described as "the goal" in the original draft is **already implemented**:

- **Explicit serializable subset** — [`src/state/saveLoad.ts`](../../src/state/saveLoad.ts)
  defines a `SaveData` interface with an explicit field list (`portId`, `timePassed`,
  `fleets`, `gold`, `quests`, `usedShipsAtPort`, `savings`, `debt`, `items`, `mates`, …)
  plus `version: 1`. Live objects (`world`, `port`) are deliberately **excluded** and set to
  `undefined` on load so the game loop recreates them.
- **Save / Load / Reset UI** — [`src/interface/System.tsx`](../../src/interface/System.tsx)
  already exposes Save, Load, and Reset buttons (Reset has a two-click confirm).
- **Load-on-init** — `state.ts` hydrates from `localStorage` at startup via `loadSavedState`,
  guarded by a `version === 1` check.
- **Round-trip-safe primitives** — mutable nested objects (`fleets`, `usedShipsAtPort`,
  `mates`) are deep-cloned on save.

So the "Slice A" from the original plan is effectively **complete**. The diagnosis below
focuses only on what is still missing.

## 2. What Still Genuinely Remains

Three real gaps, in priority order:

1. **Version migration (highest value).** Today a version mismatch in both
   `saveLoad.load()` and `state.loadSavedState()` simply **discards the save**
   (returns `false` / `{}`). The moment we add a field and bump to `version: 2`,
   every existing player loses their progress. We need a migration step that upgrades
   old snapshots instead of dropping them.
2. **Schema drift safety.** Adding a new state field (fame, relationships, discovered
   ports) requires remembering to add it in *three* places (`State`, `SaveData`,
   `loadSavedState`). There is no guard that catches a forgotten field. A single source
   of truth for the serializable shape would prevent silent data loss.
3. **Multiple save slots (lowest priority).** Currently a single `localStorage` key
   (`savedState`). Slots are a nice-to-have, not a blocker for the story work.

Everything else in the original draft (separating serializable vs live state, an explicit
menu, New Game/Reset) is already done.

## 2. Goals

- Make saving **explicit and reliable** (user can Save at any time, Load previous games).
- Make the save format **versioned and migratable**.
- Clearly separate **serializable snapshot** from **live runtime objects**.
- Support "New Game" / Reset.
- Provide a foundation that works for both the current Joao tutorial and the future multi-protagonist story system.

## 3. Proposed Design for the Remaining Work

### 3.1 Migration step (the one thing worth doing now)

Replace the "version mismatch → discard" behaviour with a migration chain. Keep it
dead simple: a map from version N to a pure function that produces a version N+1 snapshot.

```ts
// src/state/saveMigrations.ts
type AnySave = Record<string, unknown> & { version: number };

const migrations: Record<number, (s: AnySave) => AnySave> = {
  // 1 -> 2: introduce fame, default to zero for old saves
  1: (s) => ({ ...s, version: 2, fame: { adventure: 0, pirate: 0, trade: 0 } }),
};

export const migrate = (raw: AnySave): AnySave | null => {
  let cur = raw;
  while (cur.version < SAVE_VERSION) {
    const step = migrations[cur.version];
    if (!step) return null;          // unknown/broken chain → safe fallback
    cur = step(cur);
  }
  return cur.version === SAVE_VERSION ? cur : null;
};
```

Both `saveLoad.load()` and `state.loadSavedState()` route through `migrate()` instead of
the current hard `version !== 1` rejection. When `migrate()` returns `null` we fall back to
the current safe behaviour (ignore the save) — so this is strictly an improvement, never a
regression.

> Note: migrations only become necessary *the first time we bump `SAVE_VERSION`*. We can
> land the migration scaffolding now (with an empty `migrations` map) so the very next
> field addition is non-destructive, or defer it to the moment we add the first new field.
> Recommended: land the scaffolding alongside the first field that the story engine needs
> (likely `fame`).

### 3.2 Single source of truth for the serializable shape

The same field list currently lives in three places (`State`, `SaveData`, the spread in
`state.ts`). To stop fields silently falling out of saves, derive `SaveData` from a single
list of serializable keys rather than maintaining it by hand:

```ts
const SERIALIZABLE_KEYS = [
  'portId', 'buildingId', 'timePassed', 'fleets', 'dayAtSea', 'gold',
  'quests', 'usedShipsAtPort', 'savings', 'debt', 'items', 'mates',
] as const;

type SaveData = { version: number } & Pick<State, typeof SERIALIZABLE_KEYS[number]>;
```

`save()` then iterates `SERIALIZABLE_KEYS` (deep-cloning as needed) instead of listing each
field. Adding a serializable field becomes a one-line change in one place, and TypeScript
enforces that the key exists on `State`. This directly mitigates the "forgot to serialize a
new field" risk noted in §2.

### 3.3 UI Integration — ✅ already done

Save / Load / Reset already exist in
[`src/interface/System.tsx`](../../src/interface/System.tsx). The only future UI work is
optional save-slot selection (§2 item 3), which we are deferring.

### 3.4 Data Management Note (Centralized vs File-based)

For persistence we should keep **save data centralized** (one or a few `localStorage` keys + one `SerializableGameState` type).

Reasons (aligned with your existing `data-governance/` thinking):

- Player progress is inherently a single coherent snapshot.
- Easier to version the entire player state.
- Easier to implement cloud sync or export/import later.
- Avoids the complexity of coordinating multiple files for one play session.

**Contrast with design data** (ports, stories, trade goods): those benefit from file-based / folder-based management (see the third proposal).

Recommendation:
- Game saves → centralized (localStorage + one schema).
- Authoring data (story events, world data, etc.) → start centralized in a few `src/data/*.ts` files, move to per-protagonist or per-chapter folders only when the volume justifies it (as discussed in the quest proposal).

## 4. Implementation Slices (only the remaining work)

**Slice A — ✅ already shipped** (commit `9593a11`): explicit `SaveData` + `version`,
Save/Load/Reset UI, load-on-init, deep-clone of nested objects.

**Slice B (the recommended next step, ideally bundled with the story engine's `fame` field)**:
- Add `src/state/saveMigrations.ts` with the `migrate()` chain (§3.1).
- Route both `saveLoad.load()` and `state.loadSavedState()` through `migrate()`.
- Refactor `SaveData` to derive from `SERIALIZABLE_KEYS` (§3.2).
- Add 2–3 Jest tests: (a) save → mutate → load round-trip; (b) a v1 snapshot migrates to
  the current version without losing fields; (c) a broken/unknown version falls back safely.
- Document the rule in `docs/5-data-governance/save-format.md`.

**Slice C (deferred, low priority)**:
- Multiple save slots + slot-selection UI.
- Periodic/auto-save policy beyond the current "save after key actions".

## 5. Risks & Mitigations

- Risk: A future `SAVE_VERSION` bump silently wipes testers' progress.
  Mitigation: land the `migrate()` scaffolding (§3.1) *before* the first version bump.

- Risk: Forgetting to mark a new field as serializable when adding systems (fame, relationships).
  Mitigation: the `SERIALIZABLE_KEYS` single-source list (§3.2); TypeScript then enforces the key exists.

- Risk: Recreating live objects (world/port) incorrectly on load.
  Mitigation: this already works (load nulls `world`/`port`; the game loop rebuilds them).
  Keep a test that saves mid-voyage and reloads when we touch this path.

## 6. Success Criteria (for Slice B)

- Bumping `SAVE_VERSION` and adding a field no longer wipes an existing save — old snapshots migrate.
- Adding a serializable field is a one-line change in `SERIALIZABLE_KEYS`, enforced by the type system.
- A corrupt/unknown-version save still fails safely (no crash, falls back to fresh state).
- All existing Joao Lisbon actions still work after a save → load cycle (regression test).
- Versioning + migration policy recorded in `docs/5-data-governance/save-format.md`.

---

The Save/Load MVP is already done and de-risked. The only remaining high-leverage piece is
**migration**, and the cleanest moment to add it is together with the first new serializable
field the story engine introduces (`fame`). Until then this system is not on the critical path.
