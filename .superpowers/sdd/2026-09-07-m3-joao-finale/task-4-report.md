# Task 4 implementation report

## Status

DONE

Implemented and registered the declarative `joao.massawa` chapter from the five-day sea latch through the Staff hand-in and Katarina reconciliation. The chapter uses the existing event timestamp, calendar, world-area, combat-result, protected-item and atomic effect runtime without adding state fields, callbacks, portraits, sailors or shared UI/runtime changes.

## What changed

- Added 18 ordered Massawa story events with semantic completion markers, two explicit harbor preparation choices, local immediate retry choices for both Ottoman defeats, and distinct victory/retreat success checks for both battles.
- Anchored the later-month/day-11 gate to `waiting-for-pietro`; the earlier Lisbon commission timestamp is not consulted.
- Added the protected Staff pickup and atomic Staff consumption / Royal Crown `45` / 5,000 adventure fame hand-in.
- Added Pietro and Taphiel as story-only NPCs with bilingual names, neutral `text-slate-600` styles, and no `portraitId`, `sailorId` or legacy identity.
- Added the João/Pietro and João/Taphiel acquaintance relationships.
- Added complete Simplified Chinese dialogue coverage and explicit catalog registration.
- Updated the story content manifest and canonical character/relationship expectations for 17 characters, 14 relationships, 4 arcs and 88 events.
- Preserved all earlier arc content and the shared building fallback. The focused resolver proves Massawa logical building `11` is the event gate while portrait building `13` is rejected, so no fallback modification was needed.
- Included the controller's corrected priority ruling in `docs/superpowers/plans/2026-09-07-m3-joao-finale.md`. The final ranges are `[0.100, 0.200)` for Massawa actionable events and `[0.300, 0.400)` for its advice/retry events, increasing by `0.001` in table order. This keeps M3 events ahead of existing priorities 1–70 while satisfying the unchanged equal-priority overlap validator.

## Exported milestone interfaces

From `src/story/content/arcs/joao/massawa/events.ts`:

- `MASSAWA_ARC_ID = storyArcId('joao.massawa')`
- `FIVE_DAY_VOYAGE_EVENT_ID = storyEventId('joao.massawa.five-day-voyage')`
- `ALI_MASSAWA_LEAD_EVENT_ID = storyEventId('joao.massawa.ali-massawa-lead')`
- `RELIGIOUS_LEAD_EVENT_ID = storyEventId('joao.massawa.religious-lead')`
- `STAFF_REQUEST_EVENT_ID = storyEventId('joao.massawa.staff-request')`
- `PIETRO_COMMISSIONED_EVENT_ID = storyEventId('joao.massawa.pietro-commissioned')`
- `WAITING_FOR_PIETRO_EVENT_ID = storyEventId('joao.massawa.waiting-for-pietro')`
- `MASSAWA_WAITING_EVENT_ID = WAITING_FOR_PIETRO_EVENT_ID`
- `WAITING_ADVICE_EVENT_ID = storyEventId('joao.massawa.waiting-advice')`
- `INVASION_AUTHORIZED_EVENT_ID = storyEventId('joao.massawa.invasion-authorized')`
- `FIRST_SORTIE_READY_EVENT_ID = storyEventId('joao.massawa.first-sortie-ready')`
- `OTTOMAN_ONE_START_EVENT_ID = storyEventId('joao.massawa.ottoman-one-start')`
- `OTTOMAN_ONE_RETRY_EVENT_ID = storyEventId('joao.massawa.ottoman-one-retry')`
- `SECOND_SORTIE_READY_EVENT_ID = storyEventId('joao.massawa.second-sortie-ready')`
- `OTTOMAN_TWO_START_EVENT_ID = storyEventId('joao.massawa.ottoman-two-start')`
- `OTTOMAN_TWO_RETRY_EVENT_ID = storyEventId('joao.massawa.ottoman-two-retry')`
- `DEFENSE_REPORTED_EVENT_ID = storyEventId('joao.massawa.defense-reported')`
- `STAFF_RECEIVED_EVENT_ID = storyEventId('joao.massawa.staff-received')`
- `STAFF_RETURNED_EVENT_ID = storyEventId('joao.massawa.staff-returned')`
- `MASSAWA_COMPLETE_EVENT_ID = storyEventId('joao.massawa.chapter-complete')`
- `MASSAWA_BATTLE_AREA = { minX: 1152, maxX: 1156, minY: 527, maxY: 533 }`
- `massawaEvents`

From `src/story/content/arcs/joao/massawa/index.ts`:

- `massawaArc`
- `joaoMassawa = { arc: massawaArc, events: massawaEvents }`
- re-exports of the dialogue and event interfaces above

## Browser entry sequence for Tasks 6 and 7

1. Begin with `joao.conflict-and-growth.chapter-complete` saved. Sail continuously across five sea-day boundaries. The world scene `five-day-voyage` must appear before docking resets `dayAtSea`.
2. Dock at any port and enter any facility. `ali-massawa-lead` must supersede ordinary legacy fallback dialogue and direct the player to Massawa's religious house.
3. At Massawa port `75`, enter the visible religious facility backed by logical building `11` (the mosque portrait is presentation only), then enter the southwest residence `8`.
4. Sail to Lisbon port `1`, enter residence `8`, and commission Pietro. Verify no Staff appears and neither Pietro nor Taphiel joins the roster.
5. Return to Massawa residence `8` to complete `waiting-for-pietro`. This completion time is the wait anchor.
6. Use the Lodge's normal Check In flow, which advances to the next day at 08:00, and ordinary facility exits as needed. Re-enter residence `8`: before a later month's day 11, `waiting-advice` remains available; on or after day 11 of a strictly later month, `invasion-authorized` appears. Do not assume a fixed number of sleeps.
7. Enter Massawa harbor `4`. Declining `first-sortie-ready` must leave the choice available. Accepting it must finish normally and reveal the regular Sail option on normal exit/re-entry.
8. Sail east and slightly south of Massawa near 15.2°N, 42.7°E. Entering the battle water starts `joao.m3.ottoman-one`. Victory or voluntary retreat advances; defeat recovers locally to Massawa, where harbor `4` offers an immediate same-encounter retry or defer choice.
9. After first-battle victory/retreat, return to Massawa harbor `4`. The separate `second-sortie-ready` choice behaves like the first. Sail to the same waters for `joao.m3.ottoman-two`; victory/retreat advances and defeat uses its own local retry.
10. After both distinct success results, enter Massawa residence `8`, then pub `2` to receive exactly one Staff, then residence `8` to consume it and receive Royal Crown `45` plus 5,000 adventure fame.
11. Enter Massawa harbor `4`. Pietro and Enrico settle the Staff chronology before Katarina reconciles, and `MASSAWA_COMPLETE_EVENT_ID` is saved. Reloading must not repeat the Staff, Crown, fame or reconciliation.

## TDD evidence

### RED

Command:

```text
PATH=/Users/qsircaine/uncharted-waters-2/.worktrees/.tools/bin:/Users/qsircaine/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin:$PATH npm test -- --runInBand src/story/massawaResolver.test.ts
```

Result before production implementation: 1 suite failed, 15 tests failed, 1 passed. Representative failures expected `joao.massawa.five-day-voyage`, `joao.massawa.invasion-authorized`, `joao.massawa.ottoman-one-start` and `joao.massawa.staff-received`, but the unimplemented content resolved `null` or an earlier Lisbon fallback.

Expanded RED command:

```text
PATH=... npm test -- --runInBand src/story/massawaResolver.test.ts src/story/massawaEffects.test.ts src/story/massawaTranscript.test.ts
```

Result before production implementation: 3 suites failed, 25 tests failed, 1 passed. Effects reported missing Massawa events and the transcript contained zero Massawa events, as expected.

The first implementation exposed a real priority defect: priorities `100+` passed the validator but allowed the unconditional Lisbon residence fallback at priority `40` to shadow `pietro-commissioned`. The controller corrected the task range; the focused resolver then proved the fractional priority contract through the actual compiled resolver.

### GREEN

Command:

```text
PATH=/Users/qsircaine/uncharted-waters-2/.worktrees/.tools/bin:/Users/qsircaine/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin:$PATH npm test -- --runInBand src/story/massawaResolver.test.ts src/story/massawaEffects.test.ts src/story/massawaTranscript.test.ts src/story/contentManifest.test.ts src/story/content/characters/characters.test.ts
```

Result: 5 suites passed, 39 tests passed, 0 failed.

Coverage includes every event row, forbidden order/port/building cases, world latch/dock reset, logical building 11 versus portrait 13, calendar boundaries and rollover, all four two-battle victory/retreat combinations, both defeats/retries, both readiness choices, real runtime save/load and atomic item/reward behavior, localization, manifest/dependencies, public interfaces and NPC roster safety.

## Full verification evidence

- `npm test -- --runInBand`: 93 suites passed, 817 tests passed, 0 failed; 10.36 seconds.
- `npm run typecheck`: exit 0, `tsc --noEmit` clean.
- `npm run story:validate`: exit 0, content validation test passed with no diagnostics.
- `npm run lint`: exit 0, ESLint clean.
- `git diff --check`: exit 0, no whitespace errors. A staged diff check is also required immediately before commit so new files are included.

All npm and git invocations used the required Node 22/tool PATH.

## Files changed

- `.superpowers/sdd/2026-09-07-m3-joao-finale/task-4-report.md`
- `docs/superpowers/plans/2026-09-07-m3-joao-finale.md`
- `src/story/content/arcs/joao/massawa/index.ts`
- `src/story/content/arcs/joao/massawa/events.ts`
- `src/story/content/arcs/joao/massawa/dialogue.ts`
- `src/localization/dialogue/joaoMassawa.ts`
- `src/localization/catalogs.ts`
- `src/story/content/characters/pietro.ts`
- `src/story/content/characters/taphiel.ts`
- `src/story/content/characters/index.ts`
- `src/story/content/characters/characters.test.ts`
- `src/story/content/relationships/joao-massawa.ts`
- `src/story/content/relationships/index.ts`
- `src/story/content/index.ts`
- `src/story/contentManifest.test.ts`
- `src/story/massawaResolver.test.ts`
- `src/story/massawaEffects.test.ts`
- `src/story/massawaTranscript.test.ts`

## Self-review

- Re-read the Task 4 brief and all 18 rows against the final event graph.
- Confirmed all 13 once events complete their own marker in their final effect group and both combat starts are the final non-save effect.
- Confirmed the five repeatable scenes either complete only on affirmative readiness or are advice/retry scenes with later-completion exclusions.
- Confirmed no event adds a companion, no new character has a sailor or portrait link, and no shared building/runtime code changed.
- Corrected the chapter-complete Pietro line to first person and made the defense report state the completed result and direct the next real facility.
- Conceptual mutation-coverage review (no production mutations were executed or restored): the resolver assertions cover wrong port/building, wrong calendar anchor/boundary, wrong battle rectangle/outcome and out-of-order markers; the effects assertions cover missing Staff preflight, duplicate rewards, missing save durability, combat start timing and roster mutation; the transcript assertions cover missing localization, internal tile directions, invalid choices and missing final self-completion. This is test-intent reasoning, not additional executed RED evidence.

Review clarification: this wording correction changed only this ignored evidence report. Per controller instruction, no test suite was rerun for the documentation-only clarification; the executed commands and outputs remain those recorded above.

## Concerns

No implementation concerns. The controller still owns independent browser validation and the later fresh-game M3 journey; those were intentionally not inferred from automated tests.
