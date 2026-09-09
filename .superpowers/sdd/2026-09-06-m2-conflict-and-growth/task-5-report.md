# Task 5 report: João M2 chapter and bilingual journal

## Status

DONE. The implementation, focused tests, full Jest suite, story
validation/report, typecheck, lint, asset validation, production build, and
controller-owned browser acceptance all pass.

## Delivered behavior

The new `joao.conflict-and-growth` arc begins from the semantic M1 chapter
completion marker and ends when João reports Sasha's safety to Ali at the
Istanbul lodge. It contains no M3 event and does not claim that Lucia has been
rescued.

The chapter uses the already shipped declarative `combatResolved`,
`startCombat`, `receiveFame`, and `removeCompanion` boundaries. Combat start is
the final non-save effect in every group. No content callback, state import,
runtime service, guessed portrait ID, or legacy quest key was added.

The journal now places the current M2 action first, preparation second, and
completed M1/M2 history below. A completed M1 chapter makes its achieved
milestones historical even after Domingo leaves. M2 completion shows a
non-actionable future chapter note rather than exposing an unimplemented M3
objective.

## Event table

All times use runtime minutes and all building/port values are the verified
catalog IDs.

| Event suffix | Trigger and scene | Terminal behavior |
| --- | --- | --- |
| `domingo-missing` | M1 chapter complete, Domingo aboard, Ceuta `27` Pub `2`, 08:00 inclusive to 16:00 exclusive | Completes the event |
| `lodge-search` | `domingo-missing`, Ceuta Lodge `5` | Completes the event |
| `kahn-shipyard-start` | `lodge-search`, Ceuta Shipyard `3` | Completes marker, then starts `joao.m2.kahn-shipyard` |
| `identity-revealed` | Shipyard result is victory, defeat, or draw; Ceuta Harbor `4` | Reveals Alberto and completes the event |
| `kahn-house-start` | Identity revealed; Lisbon `1` House `8` | Completes marker, then starts `joao.m2.kahn-house` |
| `kahn-house-rematch` | House result is draw; Lisbon House | Repeatable dialogue, then restarts the house duel |
| `father-cleared` | House result is victory or defeat; Lisbon Palace `6` | Grants adventure fame 1000 and pirate fame 1000 with one completion marker |
| `domingo-farewell` | Father cleared; Lisbon House; Flamberge `13` absent | Gives one Flamberge, removes Domingo with captain continuity, completes canonical farewell |
| `domingo-farewell-flamberge-owned` | Father cleared; Lisbon House; Flamberge already owned; canonical farewell incomplete | Removes Domingo without another item, records variant and canonical farewell |
| `katarina-warning` | Farewell complete; Seville `2` Pub | Repeatable Yes/No offer; Yes completes acceptance, No leaves the visible journal route open |
| `pursuit-first-sea` | Warning accepted; world stage; at least one consecutive sea day | Rocco directs a harbor visit and completes the first leg |
| `pursuit-first-port` | First leg complete; any Harbor `4` | Rocco directs another departure and completes the dock step |
| `katarina-battle-start` | Dock step complete; world stage; at least one new consecutive sea day | Katarina/João introduction, then marker and `joao.m2.katarina` start |
| `katarina-retry` | Naval defeat; Lisbon Harbor | Repeatable Yes/No offer; Yes starts the battle immediately, No leaves preparation available |
| `ali-request` | Naval victory or successful retreat; any non-Lisbon Pub | Ali acknowledges Lucia's kidnapping, asks for Sasha news, and completes the event |
| `lisbon-inquiry` | Ali request; Lisbon Pub | Carlotta points to Basra and completes the event |
| `sasha-found` | Lisbon inquiry; Basra `77` Pub | Sasha identifies Ali as her brother and completes the event |
| `chapter-complete` | Sasha found; Istanbul `3` Lodge | Saves only the M2 completion marker; no reward and no M3 marker |

Priorities are unique for every conservatively overlapping scene pattern. M2
events use lower scene priorities than persistent Lisbon ambient dialogue, so
the chapter action wins when both are available.

## Files and APIs

### New production files

- `src/story/content/arcs/joao/conflict-and-growth/index.ts` exports the arc,
  events, dialogue, IDs, and chapter bundle.
- `src/story/content/arcs/joao/conflict-and-growth/events.ts` owns all 18 event
  IDs and declarative triggers/effects.
- `src/story/content/arcs/joao/conflict-and-growth/dialogue.ts` owns the English
  chapter transcript.
- `src/localization/dialogue/joaoConflictAndGrowth.ts` owns approved Chinese
  names, transcript, journal actions, coordinates, and route guidance.
- `src/story/conflictAndGrowthJournal.ts` exports
  `getConflictAndGrowthJournal(state)`.
- `src/story/content/characters/{kahn,katarina,ali,sasha}.ts` register
  portraitless canonical characters.
- `src/story/content/relationships/joao-conflict-and-growth.ts` declares the
  Kahn rivalry, Katarina enmity, Ali acquaintance, and reciprocal Ali/Sasha
  sibling edge.

### Extended existing APIs and registration

- `RelationshipType` gained the narrowly scoped `sibling` value.
- `JournalEntry` gained optional `current` and `kind` presentation metadata;
  existing first-voyage callers remain compatible.
- Story content, character, relationship, and localization indexes explicitly
  register the new records. The compiled report now contains 14 characters, 12
  relationships, 3 arcs, and 70 events.
- `QuestJournal` switches to M2 after the M1 completion marker, marks advice and
  future information distinctly, and retains completed M1 history below it.
- `getFirstVoyageJournal` treats M1 chapter completion as authoritative for
  historical milestones, so Domingo's later departure cannot reopen M1.

### Test files

- `conflictAndGrowth.test.ts`: registration, topology, semantic-only IDs,
  choices, terminal combat effect ordering.
- `conflictAndGrowthResolver.test.ts`: location/time entry, all duel outcomes,
  draw rematch, pursuit legs, naval success/defeat separation, Ali route.
- `conflictAndGrowthEffects.test.ts`: one-time fame, item guard, Domingo
  departure, combat starts/deferrals, completion-only Istanbul closure.
- `conflictAndGrowthTranscript.test.ts`: identity, Katarina, Lucia/Ali/Sasha,
  exact defer prompts, concise message-box copy.
- `conflictAndGrowthJournal.test.ts`: current actions, preparation limits,
  combat help, docking reset, retry, coordinates, long route, M2/M3 boundary.
- Existing character, manifest, localization, first-voyage journal, and journal
  UI tests were updated for explicit registration and integration.

## TDD evidence

Every command used Node 22 and locked dependencies through:

```text
PATH=/Users/qsircaine/uncharted-waters-2/.worktrees/.tools/bin:/Users/qsircaine/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin:$PATH
```

### RED

Command:

```text
npm test -- --runInBand src/story/content/arcs/joao/conflict-and-growth/conflictAndGrowth.test.ts src/story/conflictAndGrowthResolver.test.ts src/story/conflictAndGrowthEffects.test.ts src/story/conflictAndGrowthTranscript.test.ts src/story/conflictAndGrowthJournal.test.ts src/story/firstVoyageJournal.test.ts src/interface/QuestJournal.test.tsx src/localization/localization.test.ts src/story/content/characters/characters.test.ts
```

Before production content, the expected failures included missing chapter and
journal modules, missing event resolution, absent M2 journal UI, missing
translations and characters, and M1 milestones reopening after Domingo left.

```text
Test Suites: 9 failed, 9 total
Tests:       13 failed, 4 passed, 17 total
Snapshots:   0 total
exit 1
```

### GREEN

The same focused command after implementation and self-review:

```text
Test Suites: 9 passed, 9 total
Tests:       42 passed, 42 total
Snapshots:   0 total
exit 0
```

## Final verification

```text
npm test -- --runInBand
Test Suites: 86 passed, 86 total
Tests:       654 passed, 654 total
Snapshots:   0 total
exit 0

npm run story:validate
Test Suites: 1 passed, 1 total
Tests:       1 passed, 3 skipped, 4 total
exit 0

npm run story:report
Story content: 14 characters, 12 relationships, 3 arcs, 70 events
Validation: 0 error(s), 0 warning(s)
Legacy compatibility: 10/10 once events mapped (complete)
exit 0

npm run typecheck
tsc --noEmit
exit 0

npm run lint
eslint src/ --ext .ts --ext .tsx
exit 0

npm run build
Verified 38 PNG/OGG/MP3 assets.
webpack 5.74.0 compiled with 3 performance warnings in 2822 ms
exit 0

npx cypress run --spec tests/e2e/conflictAndGrowth.cy.ts
10 passing
0 failing, 0 pending, 0 skipped
17 seconds
exit 0
```

The webpack warnings are the existing asset/entrypoint size recommendations;
there are no compilation errors.

The corrected controller-owned browser log is
`/tmp/uw2-m2-chapter-entry-browser-corrected.log`. It verifies version-5 save
migration and unknown-progress preservation, the Chinese M2 journal, the real
Ceuta Pub/Lodge/Shipyard entry, an actual duel defeat with no XP, and the Harbor
identity reveal. The initial browser attempt exposed only a controller helper
that queried the building before it mounted; changing the helper to wait for a
visible building made all ten scenarios pass without a product-code change.

## Browser fixture and dialogue entry guidance

- Begin with a real version-5 M1-complete save containing the M1 semantic
  completion marker, Domingo (`sailorId: 34`), João's Hermes II, item 4, and no
  M2 combat result. Loading must migrate it through the production save path.
- For long travel, explicitly label location fixtures. Verified port IDs and
  safe anchors are Lisbon `1` `(838,358)`, Seville `2` `(862,374)`, Istanbul
  `3` `(1072,342)`, Ceuta `27` `(864,382)`, and Basra `77` `(1192,426)`.
- The first playable entry is Ceuta Pub `2` at a normalized daytime value,
  followed by Ceuta Lodge `5`, Shipyard `3`, real duel controls, and Harbor `4`.
  Advance visible vendor/character boxes until the expected semantic marker is
  actually saved; never inject that marker.
- Canonical Kahn, Katarina, Ali, and Sasha dialogue uses
  `CharacterMessageBox` initials placeholders. Browser assertions should check
  the localized name/body and must not expect or add an asset portrait.
- At the shipyard and Franco house, wait until the dialogue effect starts the
  real duel, earn the requested result with attack/defense controls, and confirm
  it through the combat result button before visiting the next building.
- At Seville Pub, test both No (warning remains available and journal points
  back to Seville) and Yes. Fulfil one sea day, visit a real Harbor building,
  then fulfil a new sea day. The world dialogue must appear before the naval
  overlay.
- Naval retreat must be earned by withdrawing to range 3 and pressing Retreat.
  Defeat must use real combat and return to Lisbon Harbor, where No leaves the
  retry available and Yes begins `joao.m2.katarina` without paid sailing.
- After victory/retreat, enter any non-Lisbon Pub, then Lisbon Pub, Basra Pub,
  and Istanbul Lodge. These long legs may use the explicit facility fixtures;
  assertions must describe them as location fixtures, not fully sailed routes.

## Self-review and limitations

- Re-read every Task 5 brief and preflight bullet against the event table and
  focused tests.
- Confirmed the two reward-bearing scenes put rewards and their completion
  marker in one final effect group. The pre-owned Flamberge branch cannot add a
  second item, and both farewell branches complete the canonical marker.
- Confirmed all three combat results are read from persisted combat state. A
  shipyard loss advances, a house draw alone rematches, house victory/defeat
  advance, Katarina defeat cannot open Ali, and victory/retreat can.
- Confirmed the only refusal scenes are visible building offers. There is no
  incomplete repeatable world refusal capable of reopening every frame.
- Confirmed preparation says pubs top up only each ship's minimum crew and does
  not direct the player to buy unavailable Leather Armor in Lisbon.
- Confirmed journal coordinates are identified as approximate game-map
  positions, Basra requires the route around southern Africa, and no Suez or
  teleport feature is claimed.
- Confirmed Kahn, Katarina, Ali, and Sasha have no `portraitId`, `sailorId`, or
  invented legacy ID. Existing legacy character mappings remain unchanged.
- Confirmed the chapter stops at the Istanbul report. Lucia, Massawa, the Saint
  Staff, Japan, South America, and later resolution remain outside Task 5.
- The browser acceptance route uses explicit location fixtures for distant
  ports; it does not claim to validate a complete manually sailed world route.
- Root-owned Task 6 documentation and browser preparation files were read only
  where needed and are excluded from Task 5 staging.

## Review fix round 1: localization guard coverage

The review found that the original M2 localization test walked the semantic
`conflictAndGrowthDialogue` object and recognized only properties literally
named `body`, `prompt`, `label`, or `title`. Most dialogue properties instead
use semantic names such as `lead`, `threat`, and `reveal`, so only two prompts
were collected. It also evaluated only the initial M2 journal state.

The revised test walks the `StoryStep` trees of all 18 registered
`conflictAndGrowthEvents`, including recursively nested choice-option steps.
It records 35 visible event-source occurrences and 32 unique event sources;
the three intentional repeats are the shared Domingo departure line and the
Yes/No labels used by both choices. A 27-state journal matrix covers every
milestone plus shipyard victory/defeat/draw, house draw/victory/defeat, active
combat, and Katarina defeat/victory/retreat. That matrix yields 63 unique
journal sources and 95 unique event-plus-journal sources.

Every unique source must produce a nonempty, distinct Chinese translation.
The guard also compares interpolation placeholder inventories and renders with
sample values, rejecting any placeholder left unresolved. A negative-control
regression temporarily deletes the real opening-dialogue entry from
`chineseCatalog`, asserts that the same guard throws, and restores the entry in
a `finally` block. This demonstrates that removing an actual M2 translation is
detected without adding a production API for testing.

Exact focused verification (Node 22 and the locked dependency PATH):

```text
npm test -- --runInBand src/localization/localization.test.ts src/story/conflictAndGrowthJournal.test.ts src/story/conflictAndGrowthTranscript.test.ts src/story/content/arcs/joao/conflict-and-growth/conflictAndGrowth.test.ts
PASS src/localization/localization.test.ts
PASS src/story/content/arcs/joao/conflict-and-growth/conflictAndGrowth.test.ts
PASS src/story/conflictAndGrowthTranscript.test.ts
PASS src/story/conflictAndGrowthJournal.test.ts
Test Suites: 4 passed, 4 total
Tests:       25 passed, 25 total
Snapshots:   0 total
exit 0

npm run typecheck
tsc --noEmit
exit 0

npm run lint
eslint src/ --ext .ts --ext .tsx
exit 0

git diff --check
exit 0
```

The negative-control test appears in the focused output as
`the conflict-and-growth localization guard rejects an absent translation`.
The change is limited to the localization test and this report, so no
production build was required for the fix round.
