# Task 3 report: Combat, equipment and repair interface

## Status

DONE

## What I implemented

### Playable combat overlay

- Added a `Combat` overlay on the 1280×800 game canvas at `z-20`, below the
  sidebar overlay (`z-30`/`z-40`). It subscribes to the serializable combat
  snapshot and current locale and delegates every mutation to `actCombat` or
  `finishCombat` with the exact rendered snapshot identity.
- Duel presentation includes both combatants, HP bars and exact HP, round,
  current enemy intent, the player's weapon, armor and effective battle level,
  three attack or defense buttons, translated matchup help, and translated
  structured battle-log entries.
- Naval presentation includes range and its meaning, both flagships' hull and
  crew, effective firepower, shot and lumber, seven actions, and a visible
  reason beside every unavailable action. Its nested captain duel uses the
  same duel controls. A restored terminal nested duel can return safely to the
  naval view through `resolveChallenge`.
- Result presentation distinguishes victory, defeat, draw and retreat and
  explains the settlement before the native Continue button confirms it. XP
  lines match the action-layer awards; naval defeat explains Lisbon recovery,
  emergency flagship repair/crew and retained possessions.
- Combat buttons are ordinary accessible buttons with stable `data-test`
  selectors. The result and battle log are scroll-safe inside the fixed canvas.
- Kept all dark text on cream cards/buttons and used supported light Tailwind
  3.1 colors for text on the navy combat surface. The HP track uses supported
  `blue-900`; no unsupported `*-950` utilities remain.

### Runtime/input integration

- `Interface` subscribes to combat snapshot and generation changes. Camera
  stays mounted. Building and SeaStory are unmounted while combat is active,
  which removes their Menu/Confirm/Acknowledge/cancel key handlers.
- The current Building is remounted with the combat generation after result
  confirmation, letting the resolver select the next story frame. SeaStory is
  similarly restored after combat.
- Left/System stays mounted. Its save, load and locale controls remain usable
  over combat. The existing overlay suspension plus exact-snapshot action
  boundary rejects covered or stale combat actions. A restored snapshot
  notification reconstructs the correct attack/defense controls.

### Fleet preparation

- Items marks equipped entries, shows the selected item detail, equips weapons
  and armor, and unequips the current selection through the Task 2 actions.
  Controls are disabled with a translated reason during combat. The detail
  region has a fixed height and vertical overflow guard.
- Shipyard Repair lists each damaged ship with missing and affordable hull
  points, shows the exact capped quote and confirmation, calls `repairShip`,
  and reports the actual points/cost applied. Full fleets retain the existing
  tiptop-shape response; unaffordable damage explains the 10-gold minimum.
- Mates now renders the effective battle level and accumulated battle XP from
  `getMates` instead of a constant zero.

### Localization/presentation prework adopted

- Adopted and reviewed the controller's `DuelControls`, presentation helper,
  tests, combat Chinese catalog and catalog registration.
- `attackLabel`, `defenseLabel` and `formatCombatLog` remain the public
  presentation APIs. Added only the final UI strings needed by Combat and
  Shipyard; existing banking `Withdraw` and item-stat `Attack` vocabulary is
  unchanged.

## TDD evidence

### RED: combat, equipment, repair and mate UI

Command:

```text
PATH=/Users/qsircaine/uncharted-waters-2/.worktrees/.tools/bin:/Users/qsircaine/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin:$PATH npm test -- --runInBand src/interface/combat/Combat.test.tsx src/interface/Items.test.tsx src/interface/Mates.test.tsx src/interface/port/shipyard/Shipyard.repair.test.tsx
```

Expected pre-implementation failures included:

```text
FAIL src/interface/combat/Combat.test.tsx
Cannot find module './Combat'
FAIL src/interface/Items.test.tsx
Expected [data-test=items-content] and equipment controls; received undefined
FAIL src/interface/Mates.test.tsx
Expected battle-level "3"; received undefined
Test Suites: 4 failed, 4 total
Tests: 4 failed, 1 passed, 5 total
```

After correcting the Shipyard test asset fixture, its behavior failed for the
intended missing branch:

```text
FAIL src/interface/port/shipyard/Shipyard.repair.test.tsx
Expected substring: "Esperanza — 7 damage — 5 affordable"
Received: "Your fleet’s already in tiptop shape, matey!..."
Tests: 1 failed, 1 total
```

### RED: Interface combat mount boundary

Command:

```text
PATH=... npm test -- --runInBand src/interface/Interface.combat.test.tsx
```

After installing the CSS test stub, the two tests failed because `Interface`
had no named testable export and no combat mount integration:

```text
FAIL src/interface/Interface.combat.test.tsx
Element type is invalid ... got: undefined
Tests: 2 failed, 2 total
```

### GREEN: complete focused Task 3 behavior

Command:

```text
PATH=/Users/qsircaine/uncharted-waters-2/.worktrees/.tools/bin:/Users/qsircaine/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin:$PATH npm test -- --runInBand src/interface/combat/Combat.test.tsx src/interface/combat/DuelControls.test.tsx src/interface/combat/combatPresentation.test.ts src/interface/Interface.combat.test.tsx src/interface/Items.test.tsx src/interface/Mates.test.tsx src/interface/port/shipyard/Shipyard.repair.test.tsx src/localization/localization.test.ts
```

```text
PASS (all eight suites)
Test Suites: 8 passed, 8 total
Tests: 33 passed, 33 total
Snapshots: 0 total
```

The controller's prework had separately recorded the required missing-module
RED and GREEN cycles for `combatPresentation` (17 focused tests with
localization) and `DuelControls` (3 tests). Those files were included in this
task's focused and full validation.

## Full verification

All commands used the required Node 22 PATH.

```text
npm test -- --runInBand
Test Suites: 79 passed, 79 total
Tests: 610 passed, 610 total
Snapshots: 0 total
exit 0

npm run typecheck
tsc --noEmit
exit 0

npm run lint
eslint src/ --ext .ts --ext .tsx
exit 0, no warnings

npm run build
Verified 38 PNG/OGG/MP3 assets.
webpack 5.74.0 compiled with 3 warnings
exit 0
```

The three build warnings are the existing asset/entrypoint size
recommendations plus the stale Browserslist notice. After the screenshot color
fix, focused combat eslint and a fresh production build both exited 0 with the
same warnings.

Controller browser validation against the initial stable build:

```text
4/4 restored-combat Cypress cases passed in 15s
log: /tmp/uw2-m2-ui-browser.log
```

The initial screenshots then exposed the low-contrast combat-surface text and
unsupported `blue-950` class. I changed only the color utilities described
above and rebuilt. The controller reran all four cases against that build:

```text
4/4 restored-combat Cypress cases passed
log: /tmp/uw2-m2-ui-browser-colors.log
```

The controller visually checked the refreshed duel and naval screenshots and
confirmed the navy-surface text is readable.

## Files changed

- `src/interface/Interface.tsx`
- `src/interface/Interface.combat.test.tsx`
- `src/interface/Items.tsx`
- `src/interface/Items.test.tsx`
- `src/interface/Mates.tsx`
- `src/interface/Mates.test.tsx`
- `src/interface/port/shipyard/Shipyard.tsx`
- `src/interface/port/shipyard/Shipyard.repair.test.tsx`
- `src/interface/combat/Combat.tsx`
- `src/interface/combat/Combat.test.tsx`
- `src/interface/combat/DuelControls.tsx`
- `src/interface/combat/DuelControls.test.tsx`
- `src/interface/combat/NavalControls.tsx`
- `src/interface/combat/combatPresentation.ts`
- `src/interface/combat/combatPresentation.test.ts`
- `src/localization/combat.ts`
- `src/localization/catalogs.ts`
- `.superpowers/sdd/2026-09-06-m2-conflict-and-growth/task-3-report.md`

## Browser validation entry points

- Main combat dialog: `[data-test=combat]`
- Duel choices: `[data-test=duel-attack-thrust|slash|heavy]` and
  `[data-test=duel-defend-parry|block|dodge]`
- Naval choices: `[data-test=naval-approach]`, `naval-withdraw`, `naval-fire`,
  `naval-board`, `naval-repair`, `naval-challenge`, `naval-retreat`
- Range/resources: `[data-test=naval-range]`
- Structured log: `[data-test=combat-log]`
- Result/confirmation: `[data-test=combat-result]`,
  `[data-test=finish-combat]`
- Equipment: open Items, then `[data-test=items-content]` and
  `[data-test=equip-item]`
- Repair: enter Lisbon Shipyard, select Repair, then the level-two `Your Ships`
  menu and shared `[data-test=confirmYes]`
- Mate progress: `[data-test=battle-level]`,
  `[data-test=battle-experience]`

## Self-review

- Re-read all Task 3 acceptance bullets and traced each mutation to a Task 2
  action call using the rendered snapshot or selected stable index.
- Confirmed Camera and System stay mounted; only input-owning Building and
  SeaStory are removed during combat.
- Confirmed all combat action buttons are native buttons, all illegal naval
  choices expose a reason, and overlay/stale/result/load paths have real React
  integration coverage.
- Checked the fixed canvas height: participant/resource cards, controls and the
  capped log remain within 800px; item details and logs use bounded overflow.
- Confirmed the Chinese catalog has no collisions and all new runtime labels
  use `t()`; English remains the source locale and Chinese remains the default.
- Confirmed root-owned verification notes and Task 6 Cypress/helper files are
  untracked and excluded from this task's staging list.

## Concerns

None.

## Review fix round 1

The review found that a repair which removed the fleet's final damage mutated
the hull and gold correctly but did not show its exact receipt. On the render
after `repairShip`, `repairableShips.length === 0` selected the generic
tiptop-shape response before the existing `step === 2 && repairResult` branch.
That generic acknowledgement also unwound only one step at a time.

I added a real Shipyard regression starting at hull 25 and 1,800 gold. It
selects and confirms the five-point repair, verifies hull 30 and 1,750 gold,
requires the exact `Repaired 5 hull for 50 gold.` receipt instead of the
generic response, acknowledges once, and verifies the main Shipyard menu is
restored. I then prioritized the persisted step-two result before the
recomputed damaged-ship list. The existing `back(3)` completion remains the
single acknowledgement path.

### Fix TDD evidence

RED:

```text
PATH=/Users/qsircaine/uncharted-waters-2/.worktrees/.tools/bin:/Users/qsircaine/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin:$PATH npm test -- --runInBand src/interface/port/shipyard/Shipyard.repair.test.tsx
FAIL src/interface/port/shipyard/Shipyard.repair.test.tsx
Expected substring: "Repaired 5 hull for 50 gold."
Received: "Your fleet’s already in tiptop shape, matey!..."
Tests: 1 failed, 1 passed, 2 total
```

GREEN and final focused verification:

```text
PATH=/Users/qsircaine/uncharted-waters-2/.worktrees/.tools/bin:/Users/qsircaine/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin:$PATH npm test -- --runInBand src/interface/port/shipyard/Shipyard.repair.test.tsx
PASS src/interface/port/shipyard/Shipyard.repair.test.tsx
Tests: 2 passed, 2 total
Snapshots: 0 total
exit 0

PATH=... npm run typecheck
tsc --noEmit
exit 0

PATH=... npx eslint src/interface/port/shipyard/Shipyard.tsx src/interface/port/shipyard/Shipyard.repair.test.tsx --ext .ts --ext .tsx
exit 0, no warnings

git diff --check -- src/interface/port/shipyard/Shipyard.tsx src/interface/port/shipyard/Shipyard.repair.test.tsx .superpowers/sdd/2026-09-06-m2-conflict-and-growth/task-3-report.md
exit 0

PATH=... npm run build
Verified 38 PNG/OGG/MP3 assets.
webpack 5.74.0 compiled with 3 warnings
exit 0
```

The build warnings remain the known Browserslist and bundle-size notices. Root
browser reproduction before this fix was `/tmp/uw2-m2-preparation-browser-corrected.log`
(two preparation cases passed, the full-repair receipt case failed). A rebuilt
artifact was handed back to root for the corrected Cypress check.

Root then ran the complete rebuilt preparation/combat browser package:

```text
7/7 Cypress cases passed in 11s
0 failed, 0 pending, 0 skipped
log: /tmp/uw2-m2-ui-preparation-browser-green.log
```

That run covers four combat cases plus equipment, full-repair and
partial-repair flows.

Fix-round concern: none. The review's minor duplicated reward-preview values
remain recorded for final triage and were intentionally outside this focused
repair fix.
