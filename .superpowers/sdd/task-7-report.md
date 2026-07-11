# Task 7 Report: Migrate the João Lisbon Opening Content

## Outcome

- Kept `src/interface/quest/questData.ts` and `questEvents.ts` authoritative at their original paths, with zero diff from `HEAD`.
- Added a parallel declarative Lisbon opening arc under `src/story/content/arcs/joao/lisbon-opening/`.
- Added the strict assembled content entry through `storyContentSource` and `compiledStoryContent` without switching the live quest runtime.
- Did not change Save, dependencies, progress, Chatlog, live hooks, or legacy runtime wiring.

## State recovery evidence

The inherited mechanical state contained two `git mv` relocations, five adjusted relative imports, and two untracked compatibility shims. Recovery used only the approved operations:

1. Deleted the two untracked shims with `apply_patch`.
2. Used `git mv` to move the relocated sources back to `src/interface/quest/`.
3. Restored the five relative import lines with `apply_patch`.
4. Confirmed `git diff --exit-code -- src/interface/quest/questData.ts src/interface/quest/questEvents.ts` exits 0.
5. Confirmed the recovered baseline with legacy parity (2/2) and full Jest (29 suites / 186 tests).

No `git reset` or `git checkout` was used.

## Snapshot provenance

`src/story/__fixtures__/legacyLisbonSnapshot.ts` is a test-only, callback-free, state-action-free data oracle.

- A one-time focused generator test imported the still-unmodified legacy `questData` export.
- State actions were Jest-mocked before exercising callbacks, so no real state or save operation ran.
- The test normalized all 36 exported transcript arrays and separately exercised the `harborFinal` yes/no callbacks to capture their appended transcript branches and operation intent.
- The ordered legacy rule table was copied in source order from the unexported `questRules` constant in the still-unmodified `questEvents.ts`; this is the one part that could not be obtained through a module export.
- The generator printed the literal, the literal was committed through `apply_patch`, and the generator test was deleted.
- The permanent migration test asserts the current legacy transcript normalization still equals the committed oracle.

Snapshot statistics:

- 36 legacy keys
- 181 main transcript messages
- 7 `harborFinal` branch messages (4 yes, 3 no)
- 36 ordered legacy rule rows
- 12 callback-operation manifest entries

## Declarative content statistics

- Exact legacy-to-semantic mapping: 36 keys / 36 unique semantic IDs
- Events: 48 total
  - 36 base semantic events
  - 12 extra bank/guild ambient variants required because those buildings exit while the lodge remains open
- Recursive steps across all event variants:
  - 207 dialogue steps
  - 1 choice step with stable `yes` and `no` IDs
  - 34 effect steps
  - 46 individual effects
- All exported arc content is recursively function-free.
- Every once-only event has one unique `legacyCompletionKey`.
- Every speaker resolves through the canonical Lisbon character registry.

## Trigger and effect preservation

- Each trigger includes Lisbon port `1`, building stage, and its exact building predicate.
- `blockedBy`, `requires`, and the 22:00-midnight window were converted to story conditions.
- Priorities advance by the original rule order within each building.
- Lodge/bank/guild before/after candidates use stable per-building random groups.
- Bank/guild before-introduction variants receive `exitBuilding`; lodge and all after-introduction ambient variants remain open as in legacy behavior.
- All legacy action, completion, exit, and fade boundaries are asserted against the snapshot.
- `harborFinal` emits explicit Rocco `firstMate` and Enrico `bookKeeper` intents on yes, preserves both branch transcripts, and completes on both choices.

## TDD evidence

1. Wrote `lisbonOpening.test.ts` before the declarative production modules existed.
2. Ran the focused suite and observed RED: Jest could not resolve the new story/content strict entry.
3. Added the minimal dialogue, event, arc, content, and compiled entry implementation.
4. Ran the focused suite and reached GREEN: 8/8 tests.
5. Retained tests for mapping uniqueness, immutable oracle parity, transcript/effect boundaries, both choice branches, canonical speakers, zero callbacks, trigger/random structure, completion keys, and strict compilation.

## Verification gates

- Focused Lisbon content: 8/8 passed.
- Legacy parity: 2/2 passed.
- Full Jest after migration: 30 suites / 194 tests passed.
- TypeScript: passed (`tsc --noEmit`).
- ESLint: passed (`eslint src/ --ext .ts --ext .tsx`).
- Formatting: Prettier applied to all new TypeScript files.
- Diff hygiene: old production sources remain zero-diff; final staged diff check is recorded by the successful commit workflow.

## Commit

- Commit message: `feat: migrate Lisbon opening content`
- Scope: this Task 7 report, snapshot fixture, declarative content, content indexes, and focused tests only.

## Self-review and concerns

- The 12 ambient bank/guild variants intentionally use derived semantic IDs with `.bank` / `.guild` suffixes; the exact accepted 36-key adapter mapping continues to point to the base semantic IDs used by the lodge variants.
- Task 8 must preserve the characterized legacy role-assignment outcome when wiring the explicit `assignMate` intents into the live runtime. Task 7 only declares the intents and does not activate them.
- The immutable oracle is compile-time immutable (`as const`) and contains only literals. Runtime deep-freezing was deliberately avoided so the fixture remains pure data with no helper function or callback.
- No live resolver cutover is included; the old runtime remains authoritative until Task 8 parity work.
