# Task 3 report: first voyage content, reporting, and journal

## Outcome

Implemented the first-voyage chapter as four registered semantic events under
`joao.first-voyage`, added the verified Domingo sailor and portrait binding,
moved discovery gold to one-time Lisbon Guild reporting, and added a bilingual
quest journal available at port and sea.

The chapter remains completable after either commission or Domingo refusal.
The sea refusal completes only `domingo-met`; the Lisbon Guild reconsideration
stays repeatable until acceptance. Chapter completion requires the commission,
the recruited Domingo companion, and a specifically reported Strait of
Gibraltar, then completes and grants 500g in one saved effect group.

## Public IDs and UI hooks

- Arc: `joao.first-voyage`
- Events:
  - `joao.first-voyage.commission-accepted`
  - `joao.first-voyage.domingo-met`
  - `joao.first-voyage.domingo-recruited`
  - `joao.first-voyage.chapter-complete`
- Target: `strait-of-gibraltar`
- UI hooks: `questJournal`, `journal-entry-<id>`, `guild`,
  `guild-report-receipt`
- Guild labels:
  - `Job Assignment` / `接受任务`
  - `Report Discoveries` / `上报发现`
  - `Country Info` / `国家情报`

Selected-route visible story frames are 3 for commission, 5 for the sea
meeting, 3 for reconsideration, and 2 for chapter completion. Chinese
translations are limited to 48 characters per new dialogue, choice, journal,
and title source in the localization coverage test.

## TDD evidence

### Initial RED

Command:

```text
PATH=/Users/qsircaine/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin:/Users/qsircaine/uncharted-waters-2/.worktrees/.tools/bin:$PATH \
npm test -- --runInBand \
  src/state/actionsDiscovery.test.ts \
  src/state/actionsWorld.test.ts \
  src/story/content/arcs/joao/first-voyage/firstVoyage.test.ts \
  src/story/firstVoyageJournal.test.ts \
  src/interface/Discoveries.test.tsx \
  src/interface/world/DiscoveryBanner.test.tsx
```

Output:

```text
v22.23.2
FAIL src/story/content/arcs/joao/first-voyage/firstVoyage.test.ts
  Cannot find module '.'
FAIL src/story/firstVoyageJournal.test.ts
  Cannot find module './content/arcs/joao/first-voyage'
FAIL src/state/actionsDiscovery.test.ts
  Cannot find module './actionsDiscovery'
FAIL src/interface/Discoveries.test.tsx
  Expected: Unreported — 1500g pending at Lisbon Guild
  Received: +150 adventure fame, +1500g
  Expected: Reported — 300g paid
  Received: +30 adventure fame, +300g
FAIL src/interface/world/DiscoveryBanner.test.tsx
  Expected: Discovered: Strait of Gibraltar — +30 adventure fame; report for 300g
  Received: Discovered: Strait of Gibraltar — +30 adventure fame, +300g
FAIL src/state/actionsWorld.test.ts
  Expected gold: 0
  Received gold: 300

Test Suites: 6 failed, 6 total
Tests:       7 failed, 11 passed, 18 total
Snapshots:   0 total
Exit:        1
```

This proved the missing modules and the old immediate-payout behavior before
production implementation.

### Focused GREEN

Command:

```text
npm test -- --runInBand \
  src/state/actionsDiscovery.test.ts \
  src/state/actionsWorld.test.ts \
  src/story/content/arcs/joao/first-voyage/firstVoyage.test.ts \
  src/story/firstVoyageJournal.test.ts \
  src/interface/Discoveries.test.tsx \
  src/interface/world/DiscoveryBanner.test.tsx \
  src/interface/Mates.test.tsx \
  src/interface/QuestJournal.test.tsx \
  src/interface/port/Guild.test.tsx \
  src/story/content/characters/characters.test.ts \
  src/localization/localization.test.ts
```

Output:

```text
PASS src/interface/Mates.test.tsx
PASS src/interface/Discoveries.test.tsx
PASS src/interface/port/Guild.test.tsx
PASS src/localization/localization.test.ts
PASS src/state/actionsWorld.test.ts
PASS src/interface/QuestJournal.test.tsx
PASS src/story/content/arcs/joao/first-voyage/firstVoyage.test.ts
PASS src/interface/world/DiscoveryBanner.test.tsx
PASS src/state/actionsDiscovery.test.ts
PASS src/story/content/characters/characters.test.ts
PASS src/story/firstVoyageJournal.test.ts

Test Suites: 11 passed, 11 total
Tests:       56 passed, 56 total
Snapshots:   0 total
Exit:        0
```

### Guild transition RED/GREEN

The added receipt-dismissal and post-commission story-refresh tests first
failed with these exact results:

```text
FAIL src/interface/port/Guild.test.tsx
  reports pending discoveries through the Guild menu and shows a receipt
    Expected guild-report-receipt to be null after Enter; received receipt.
  assignment action re-resolves an eligible chapter after commission acceptance
    Expected Job Assignment not to contain text-gray-400; it was disabled.

Test Suites: 1 failed, 1 total
Tests:       2 failed, 2 total
Exit:        1
```

After clearing report state on acknowledgement and keeping assignment review
available after the Lisbon opening:

```text
PASS src/interface/port/Guild.test.tsx
  ✓ reports pending discoveries through the Guild menu and shows a receipt
  ✓ assignment action re-resolves an eligible chapter after commission acceptance

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Exit:        0
```

### Repository integration RED/GREEN

The first full Jest run found four stale single-arc assumptions:

```text
FAIL src/story/lisbonResolver.parity.test.ts
  production resolver selected joao.first-voyage.commission-accepted in a
  Lisbon-only oracle matrix
FAIL src/story/content/arcs/joao/lisbon-opening/lisbonOpening.test.ts
  expected one arc and only the Lisbon event array
FAIL src/story/core/validator.semantics.test.ts
  expected all production events to equal the 48 migrated Lisbon events
FAIL src/story/contentManifest.test.ts
  expected 8 characters, 7 relationships, 1 arc, and 48 events

Test Suites: 4 failed, 63 passed, 67 total
Tests:       4 failed, 518 passed, 522 total
Exit:        1
```

The Lisbon parity harness now compiles only the Lisbon arc, the migration
inventory remains exactly the 48 legacy-migrated events, and content reporting
counts legacy compatibility only for the migration manifest. Focused result:

```text
PASS src/story/contentManifest.test.ts
PASS src/story/lisbonResolver.parity.test.ts
PASS src/story/content/arcs/joao/lisbon-opening/lisbonOpening.test.ts
PASS src/story/core/validator.semantics.test.ts

Test Suites: 4 passed, 4 total
Tests:       38 passed, 38 total
Exit:        0
```

## Final verification

### Full Jest

```text
npm test -- --runInBand

Test Suites: 67 passed, 67 total
Tests:       522 passed, 522 total
Snapshots:   0 total
Time:        9.978 s
Exit:        0
```

### TypeScript

```text
npm run typecheck
> tsc --noEmit
Exit: 0
```

### ESLint

```text
npm run lint
> eslint src/ --ext .ts --ext .tsx
Exit: 0
```

### Story validation and diff hygiene

```text
npm run story:validate
PASS src/story/contentManifest.test.ts
Tests: 1 passed, 3 skipped, 4 total
Exit: 0

git diff --check
Exit: 0
```

## Files and decisions

- Chapter content lives in
  `src/story/content/arcs/joao/first-voyage/{index,events,dialogue}.ts`.
  Dialogue data is immutable text; events directly own conditions and terminal
  declarative effects.
- Domingo uses sailor and portrait id `34`, age 17, the verified stats, and
  Negotiation only. `joao.domingo.companion` supplies the reciprocal companion
  relationship. No ship or mate role is added.
- `reportDiscoveries()` accepts only Lisbon port `1`, Guild building `7`,
  filters unknown, duplicate, and reported IDs, pays catalog gold once, updates
  the general UI, and writes one save. Sighting still grants its existing fame.
- Guild story priorities are chapter `1`, Domingo reconsideration `2`, and
  commission `3`, all below Lisbon ambient `10`/`20` and non-overlapping.
- The Guild remounts its `BuildingWrapper` after reporting or choosing Job
  Assignment. This uses the existing story hook unchanged and lets newly
  eligible chapter conversations resolve without reload.
- The journal contains six concrete Lisbon opening stops followed by the
  commission, three-day Domingo meeting/reconsideration, eastward south-Iberian
  Gibraltar route and coordinates, report, and reward.
- `src/localization/catalogs.ts` merges UI, terms, Lisbon dialogue, and first
  voyage dialogue with conflict detection before `t()` consumes the catalog.
- Content reporting now distinguishes migrated once-events from new semantic
  once-events, matching Task 1's validator ruling.

## Remaining risk

Task 4 still owns continuous production-browser acceptance for the full fresh
journey, save/load interaction during sea dialogue, real navigation to the
collision-safe Gibraltar point, and final report/reward display. Unit and
integration tests cover the underlying state effects, resolver branches,
translation parameters, UI refresh boundaries, and one-time persistence.
