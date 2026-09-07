# Task 4 report: Declarative combat and companion departure effects

## Status

DONE

## What I implemented

### Declarative combat and rewards

- Added the `combatResolved` condition with encounter ID and accepted outcome
  list. `createStoryContext` copies all persisted combat results, including
  unknown future IDs, and defaults older state shapes to an empty record.
- Added `startCombat`, `receiveFame`, and `removeCompanion` story effects.
  `StoryEffectRuntime` exposes one method for each new effect and retains the
  existing whole-group preflight followed by a single enclosing save.
- The production runtime preflights `startCombat` through `canStartCombat`,
  calls `startCombatWithoutSave` during synchronous execution, and lets the
  enclosing story save commit rewards, completion markers, and active combat
  together. Failed combat preflight leaves gold, fame, completion, combat,
  and storage untouched.
- Both the content validator and runtime group preflight require combat start
  to be the final non-save effect. An explicit `save` after it remains valid
  and is coalesced by the existing one-save interpreter.
- Production validation catalogs now derive encounter IDs from the independent
  combat catalog. Unknown condition/effect encounters, invalid combat outcome
  lists, invalid fame amounts, and missing removal targets receive event-owned
  diagnostics. Existing parity and production event exclusion behavior stays
  unchanged.
- The content manifest counts `removeCompanion` as a character reference.

### Companion departure and captain continuity

- Added a pure `planCompanionDeparture` boundary and a separate apply step.
  It rejects missing companions, João, invalid numeric captain roles, and any
  situation that would require duplicating the relief captain.
- Removing a null-role mate or officer removes only that mate. Removing a ship
  captain assigns the first remaining null-role mate to the vacated numeric
  role. When none exists, it creates exactly one `m2-relief-captain` mate in
  that role. Ships and all other mate roles remain unchanged.
- Registered the project-original Relief Captain as a canonical companion with
  English name `Relief Captain`, Chinese name `代理船长`, sailor ID
  `m2-relief-captain`, no legacy character/portrait ID, age 30, every stat 50,
  navigation/battle levels 1, and no skills.
- A four-ship Domingo departure round trip verifies four ships, one captain per
  numeric role, retained João, persisted relief ID, and valid `getCaptain`
  selector results after load.

### Portraitless presentation

- Added a shared `CharacterPortrait` renderer. Known legacy characters still
  call `Assets.characters` with the exact prior numeric ID. Characters without
  a real portrait render a neutral block containing initials from the already
  localized display name.
- `CharacterMessageBox` now prefers canonical character name, translated name,
  dialogue color, and portrait mapping before safe legacy/sailor fallback. A
  canonical character with no sailor data and no portrait no longer
  dereferences an undefined sailor or requests a fabricated asset.
- `Mates` safely uses canonical colors/portrait links, translates menu/detail
  names, and renders the Relief Captain placeholder without changing existing
  legacy portrait IDs.

## Validator and effect extension points

- Conditions: extend `StoryCondition`, `conditionSatisfied`, and
  `visitCondition`; add production IDs to `StoryValidationCatalogs` when the
  condition references a catalog entity.
- Effects: extend `StoryEffect`, `StoryEffectRuntime`, `executeStoryEffect`, and
  `visitEffect`; add state-dependent checks to `preflightGroup` so the complete
  ordered group is simulated before any mutation.
- Terminal effects: validate both authored content and runtime groups. A
  terminal effect may be followed only by explicit `save` markers, which the
  interpreter ignores during execution before its one final save.
- Stateful departure: compute a pure plan against cloned mates/fleet length in
  preflight, then recompute and apply synchronously after all diagnostics pass.

## TDD evidence

### RED: core condition/effect/runtime/departure behavior

Command:

```text
PATH=/Users/qsircaine/uncharted-waters-2/.worktrees/.tools/bin:/Users/qsircaine/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin:$PATH npm test -- --runInBand src/story/core/resolver.test.ts src/story/core/effects.test.ts src/story/core/validator.contract.test.ts src/story/companionDeparture.test.ts src/story/storyRuntimeActions.test.ts
```

Expected failures before implementation:

```text
FAIL src/story/companionDeparture.test.ts
Cannot find module './companionDeparture'
FAIL src/story/core/validator.contract.test.ts
Unhandled story condition: {"type":"combatResolved",...}
FAIL src/story/core/resolver.test.ts
Unhandled story condition: {"type":"combatResolved",...}
Expected combatResults; received undefined
FAIL src/story/core/effects.test.ts
Unhandled story effect: {"type":"receiveFame",...}
Test Suites: 5 failed, 5 total
Tests: 6 failed, 69 passed, 75 total
```

Why expected: the planner module and all three declarative runtime extensions
were absent, and context construction did not expose persisted combat results.

### GREEN: core behavior

Same command after the minimal implementation:

```text
PASS src/story/core/validator.contract.test.ts
PASS src/story/core/resolver.test.ts
PASS src/story/core/effects.test.ts
PASS src/story/storyRuntimeActions.test.ts
PASS src/story/companionDeparture.test.ts
Test Suites: 5 passed, 5 total
Tests: 97 passed, 97 total
```

### RED: portraitless UI and registered profile

Command:

```text
PATH=/Users/qsircaine/uncharted-waters-2/.worktrees/.tools/bin:/Users/qsircaine/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin:$PATH npm test -- --runInBand src/interface/Mates.test.tsx src/interface/port/CharacterMessageBox.test.tsx src/story/content/characters/characters.test.ts src/story/contentManifest.test.ts
```

Expected failures before UI support and expectation updates:

```text
FAIL src/interface/Mates.test.tsx
TypeError: Cannot destructure property 'color' ... as it is undefined
FAIL src/interface/port/CharacterMessageBox.test.tsx
Expected substring: "代理船长"
Received string: "Relief CaptainReady."
FAIL src/story/content/characters/characters.test.ts
Expected length: 9; Received length: 10
FAIL src/story/contentManifest.test.ts
Expected characters: 9; Received characters: 10
Test Suites: 4 failed, 4 total
Tests: 4 failed, 8 passed, 12 total
```

Why expected: both UI consumers assumed a legacy portrait/color record, and
the registered relief profile intentionally expanded the content catalog.

### GREEN: portraitless UI and profile

Same command after implementation:

```text
PASS src/interface/port/CharacterMessageBox.test.tsx
PASS src/interface/Mates.test.tsx
PASS src/story/contentManifest.test.ts
PASS src/story/content/characters/characters.test.ts
Test Suites: 4 passed, 4 total
Tests: 12 passed, 12 total
```

The final combined focused run covered 12 suites and passed 126/126 tests.

## Final verification

All commands used the required Node 22 PATH.

```text
npm test -- --runInBand
Test Suites: 81 passed, 81 total
Tests: 626 passed, 626 total
Snapshots: 0 total
exit 0

npm run story:validate
Test Suites: 1 passed, 1 total
Tests: 1 passed, 3 skipped, 4 total
exit 0

npm run typecheck
tsc --noEmit
exit 0

npm run lint
eslint src/ --ext .ts --ext .tsx
exit 0, no warnings

git diff --check -- <Task 4 paths>
exit 0
```

No webpack build was run: the controller requested that port 8082 continue to
serve the stable Task 3 build, and confirmed the existing combat/overlay build
had already passed 7/7 Cypress cases.

## Files changed

- `src/story/core/types.ts`
- `src/story/core/resolver.ts`
- `src/story/core/resolver.test.ts`
- `src/story/core/validator.ts`
- `src/story/core/validator.contract.test.ts`
- `src/story/core/effects.ts`
- `src/story/core/effects.test.ts`
- `src/story/content/catalogs.ts`
- `src/story/content/characters/index.ts`
- `src/story/content/characters/relief-captain.ts`
- `src/story/content/characters/characters.test.ts`
- `src/story/contentManifest.ts`
- `src/story/contentManifest.test.ts`
- `src/story/storyRuntimeActions.ts`
- `src/story/storyRuntimeActions.test.ts`
- `src/story/companionDeparture.ts`
- `src/story/companionDeparture.test.ts`
- `src/story/storyProgress.test.ts`
- `src/story/lisbonResolver.parity.test.ts`
- `src/story/content/arcs/joao/lisbon-opening/lisbonOpening.test.ts`
- `src/interface/common/CharacterPortrait.tsx`
- `src/interface/Mates.tsx`
- `src/interface/Mates.test.tsx`
- `src/interface/port/CharacterMessageBox.tsx`
- `src/interface/port/CharacterMessageBox.test.tsx`
- `src/interface/quest/useQuestStep.test.ts`
- `src/data/sailorData.ts`
- `src/localization/ui.ts`
- `tests/seaStoryFixture.ts`
- `.superpowers/sdd/2026-09-06-m2-conflict-and-growth/task-4-report.md`

## Self-review

- Re-read every Task 4 acceptance bullet and traced each to focused coverage.
- Confirmed the combat action layer has no story/content import; only the story
  runtime imports the independent combat action boundary.
- Confirmed all per-effect and group diagnostics run before mutation, explicit
  saves are ignored during execution, and one final save captures the active
  combat snapshot.
- Confirmed the departure planner never mutates its input, never removes João,
  never reduces fleet length, uses the first null-role replacement, and never
  duplicates the relief captain.
- Confirmed `characterData` remains byte-for-byte equivalent for all nine
  existing legacy mappings and every real portrait continues using its prior
  numeric asset ID.
- Confirmed root-owned Task 6 preparation files were neither edited by this
  task nor included in its staging list.

## Integration notes and concerns

- Task 5 can use `combatResolved` to branch on persisted outcomes and must keep
  each `startCombat` as the final non-save effect in its effect array.
- `m2-relief-captain` is intentionally reported as unreferenced until narrative
  content needs it; runtime departure is its current reference path.
- No correctness concerns.

## Fix round 1: ordered combat eligibility

Review source: `task-4-review.md`, based on commit
`4d4e32eceeb9ed87d759b23966a73e3c682613b5`.

### Behavior fixed

- Added one pure `isCombatStartEligible` rule set in `actionsCombat.ts` for
  encounter existence, active combat, overlay suspension, replay policy, and
  naval flagship/captain readiness.
- Kept `canStartCombat` as the live-state entry point and added
  `canStartCombatWithRoster` so story preflight can substitute the prospective
  ships and mates while retaining the live active-combat, overlay, and replay
  guards.
- Changed production story group preflight to simulate ship IDs as well as mate
  roles in effect order. A supported
  `addCompanion -> receiveShip -> startCombat` group can now start naval combat
  from an initially empty fleet.
- Kept `startCombatWithoutSave` in the enclosing story transaction; the group
  still writes exactly one final save.
- Added the two requested coverage gaps for out-of-range/fractional numeric
  captain roles and production nonterminal combat-start atomic rejection.

### RED evidence

Command:

```text
npm test -- --runInBand src/story/storyRuntimeActions.test.ts src/state/actionsCombat.test.ts src/story/companionDeparture.test.ts
```

Output before production changes:

```text
FAIL src/state/actionsCombat.test.ts
TypeError: canStartCombatWithRoster is not a function
FAIL src/story/storyRuntimeActions.test.ts
Expected: { ok: true, executed: 3 }
Received: combat-unavailable, executed: 0
PASS src/story/companionDeparture.test.ts
Test Suites: 2 failed, 1 passed, 3 total
Tests: 2 failed, 50 passed, 52 total
Snapshots: 0 total
exit 1
```

The invalid numeric captain-role cases and the production nonterminal-start
case passed under the existing behavior. The two failures isolated the reviewed
ordered-group defect and the missing shared eligibility entry point.

### GREEN evidence

Same command after implementation:

```text
PASS src/state/actionsCombat.test.ts
PASS src/story/storyRuntimeActions.test.ts
PASS src/story/companionDeparture.test.ts
Test Suites: 3 passed, 3 total
Tests: 52 passed, 52 total
Snapshots: 0 total
exit 0
```

### Fix verification

All commands used the required Node 22/tools PATH.

```text
npm test -- --runInBand src/state/actionsCombat.test.ts src/story/storyRuntimeActions.test.ts src/story/companionDeparture.test.ts src/story/core/effects.test.ts
Test Suites: 4 passed, 4 total
Tests: 58 passed, 58 total
Snapshots: 0 total
exit 0

npm run typecheck
tsc --noEmit
exit 0

npm run story:validate
Test Suites: 1 passed, 1 total
Tests: 1 passed, 3 skipped, 4 total
exit 0

npm run lint
eslint src/ --ext .ts --ext .tsx
exit 0, no warnings

git diff --check
exit 0
```

No build or Cypress run was performed, preserving the controller's stable
Task 3 build on port 8082 as requested.

### Fix files

- `src/state/actionsCombat.ts`
- `src/state/actionsCombat.test.ts`
- `src/story/storyRuntimeActions.ts`
- `src/story/storyRuntimeActions.test.ts`
- `src/story/companionDeparture.test.ts`
- `.superpowers/sdd/2026-09-06-m2-conflict-and-growth/task-4-report.md`

### Fix self-review and integration notes

- The readiness rules have one implementation; live starts and prospective
  story preflight both delegate to it.
- Story preflight changes only the roster inputs. Active combat, overlay,
  encounter existence, and replay outcomes still come from the current runtime.
- Unsupported or nonterminal combat groups return diagnostics before any state
  mutation or storage write.
- The runtime starts combat only after earlier group effects establish the same
  ship and captain state that preflight approved.
- Root-owned Task 5/6 preparation files remain outside this fix staging list.
- No correctness concerns.
