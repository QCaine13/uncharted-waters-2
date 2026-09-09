# M3 João Finale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Complete João's Chinese playable route from the M2 Istanbul report through Massawa, Japan, the Amazon battle and the Lisbon home ending, including a real fresh-game acceptance journey.

**Architecture:** Extend declarative conditions and inventory effects, retain event timestamps in additive save v7, and drive encounter behavior from a shared pure catalog. Two new story arcs use those interfaces; the journal presents current gates and the durable ending. Root validates the integrated player flow.

**Tech Stack:** React 18, TypeScript 4.8, Jest 29, Cypress 10, Node.js 22, existing Canvas and local save architecture.

**Spec:** ../specs/2026-09-07-m3-joao-finale-design.md

## Global Constraints

- Work in `/Users/qsircaine/uncharted-waters-2/.worktrees/m3-joao-finale`, branch `codex/m3-joao-finale`, base `1002d9eb2f3338cd5e4dfc6fc0f17546eb6a4ed6`. Do not merge or push this implementation.
- Use Node.js 22. Set PATH to `/Users/qsircaine/uncharted-waters-2/.worktrees/.tools/bin:/Users/qsircaine/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin:$PATH`. Keep locked dependencies unchanged.
- Default Simplified Chinese with English switch. Every new visible text has both languages. Preserve legacy IDs, existing semantic IDs and unknown saved progress. Do not invent original portrait or item-sprite coordinates.
- Story content stays declarative. Preflight every stateful effect group before any mutation; each successful group autosaves once. Battle confirmation, rewards, item delivery and companion departure must not repeat after load.
- Follow TDD for behavior. Run focused tests during iteration, full Jest and typecheck before the task commit; reviewers use recorded evidence instead of repeating those commands.
- One implementation subagent at a time, Sol as previously authorized. Workers never spawn subagents. Root owns coordination, independent browser validation and final integration. Preserve this and the earlier worktrees and the ignored execution evidence.
- Original source behavior and project adaptations must be distinguished. M3 completion requires a real fresh-game journey; location fixtures and calculated map paths are supplemental evidence only.

## Shared scope decisions

Implement in seven independently reviewed gates. The standing release authorization and current M3 start cover internal implementation choices; record material rulings in this plan's execution ledger and proceed continuously. No new dependency, map artwork, protagonist, campaign deadline or political-combat system is included.

`StoryContext` additions may be optional to keep existing standalone contexts compatible; `createStoryContext` always populates them. All new save fields are copied on save/load. No migration may import compiled story content.

### Task 1: Durable story clocks and geographic predicates

**Files:** Create `src/time/calendar.ts`, `src/time/calendar.test.ts`, `src/story/storyClock.test.ts`. Modify `src/state/{state,saveMigrations,saveLoad}.ts` and related tests; `src/story/core/{types,resolver,validator}.ts`, `src/story/{storyRuntimeActions,contentManifest}.ts` and focused tests; `src/interface/interfaceUtils.ts` and date tests. Inspect existing validator reference visitors and manifest dependency visitors explicitly. No new chapter or combat policy yet.

**Interfaces:** Add `State.storyEventTimes: Record<string,number>` and save v7. Add `StoryContext.storyEventTimes?: Readonly<Record<string,number>>` and `worldPosition?: {x:number;y:number}` populated from `state.fleets['1'].position`. Export `getCalendarParts(timePassed:number): {year:number;month:number;day:number;dayIndex:number;monthIndex:number}` from `src/time/calendar.ts`; month is 1-based, dayIndex is `Math.floor(timePassed/1440)`, monthIndex is `year*12+month-1`, and epoch is 1522-05-17 UTC. `getDate` uses the same parts, preserving its public signature and displayed language.

New condition types:

```ts
| {type:'calendarMonthsAfterEvent';eventId:StoryEventId;minMonths:number;minDay:number}
| {type:'calendarDaysAfterEvent';eventId:StoryEventId;minDays:number}
| {type:'withinWorldArea';minX:number;maxX:number;minY:number;maxY:number}
```

Month match requires the referenced event be completed, a finite nonnegative anchor no later than now, `now.monthIndex-anchor.monthIndex >= minMonths`, and `now.day >= minDay`. Day match requires the same completed/valid anchor and `now.dayIndex-anchor.dayIndex >= minDays`. Require nonnegative integer minimum months/days, day 1–31, and a known event reference. World bounds require finite ordered numbers, X within 0–2159 and Y within 0–1079. Match inclusive bounds with a finite position; the condition itself does not substitute for a `stage:'world'` gate.

- [x] Add failing calendar/condition tests, including these boundaries (test helper `minutesAt` converts UTC dates relative to the epoch):

```ts
expect(getCalendarParts(0)).toMatchObject({year:1522,month:5,day:17,dayIndex:0});
// Anchor June 28: June 30 fails; July 10 fails; July 11 passes;
// August 1 fails, August 11 passes; December -> January increments monthIndex.
// A 23:50 appointment permits the next date at 09:00 despite <24 elapsed hours.
// Missing/uncompleted/future/NaN anchors and missing/NaN positions fail.
// Area [594,602]x[641,649] includes all four corners and excludes each outside edge.
```

- [x] Run `npm test -- --runInBand src/time/calendar.test.ts src/story/storyClock.test.ts` and record RED. Implement the pure helper and resolver branches; update all reference, validation and manifest dependency traversals. Add meaningful validator tests for unknown clock event IDs, invalid minimum/day/bounds and chronological dependency extraction.
- [x] Add v6→v7 migration and final normalization without changing v1–v6 semantics. Retain valid unknown timestamp IDs; discard invalid timestamps and assign completed IDs with missing/invalid clocks the save's finite nonnegative current time (otherwise zero). Do not invent completion markers. Test v6 with a valid active M2 duel/naval snapshot, unknown outcome/event IDs, possessions and equipment; test malformed v7 clocks, deep-copy independence, failed-load nonmutation and bootstrap/load parity.
- [x] `completeEvent` stamps first completion and never overwrites a valid existing stamp. Test two completions at different times, a load roundtrip, and a multi-effect group that saves membership and timestamp once. Context creation must not mutate state.
- [x] Run focused tests, then full Jest, `npm run typecheck`, `npm run story:validate`, and `git diff --check`. Commit `feat: add durable story clocks and world-area conditions`. Report exact APIs, RED/GREEN commands and counts.

### Task 2: Quest-item transactions and a second companion departure

**Files:** Modify `src/data/itemData.ts`, `src/state/actionsPort.ts`, `src/story/core/{types,effects,validator}.ts`, `src/story/{storyRuntimeActions,companionDeparture}.ts`; inspect `src/story/contentManifest.ts` and modify character registration/manifest tests as needed; modify item/effect/departure tests, `src/interface/{Items,ItemShopItemBox}.tsx` only as required, `src/interface/common/ItemInfo.tsx`, `src/interface/port/ItemShop.tsx` and UI tests, `src/data/sailorData.ts`, and localization. Create `src/story/content/characters/second-relief-captain.ts` and a focused quest-item test file.

**Interfaces:** Add effect `{type:'consumeItem';itemId:ItemId}` and item metadata `sellable?: boolean` (default true); `Item.imageSlice` becomes `number|null`. Staff stable ID is `m3-staff-of-the-saint`, name `Staff of the Saint` / `圣者之杖`, description `The Staff entrusted to João for the ruler of Massawa.` / `皮耶德托付给约翰、须交还马沙华统治者的圣杖。`, category11, rating0, price0, imageSlice null, sellable false. Existing numeric items and Crown45 are unchanged. The null-image display is a neutral CSS/text emblem, no generated/borrowed original-looking sprite.

Keep `m2-relief-captain` stable. Add `m3-relief-captain`, canonical English name `Second Relief Captain`, Chinese `第二代理船长`, portraitless companion sailor age30/all attributes50/navigation level1/battle level1/no skills. `planCompanionDeparture` first uses an existing unassigned mate, then the first unused member of the two-ID relief pool. Never create an unused relief unnecessarily or duplicate an existing one. Refuse removing João or malformed captain slots; retain every ship and a valid captain for every occupied ship.

- [x] Write RED tests for prospective inventory groups:

```ts
// receive Staff -> consume Staff -> complete marker: success, no Staff, one save.
// receive gold -> consume missing Staff -> complete marker: zero mutations/saves.
// one owned Staff consumed twice in one group: reject before the first effect.
// consuming one of two copies leaves equipment; consuming the last clears its slot.
// sellItem(staffIndex) returns false and leaves gold/items/save count unchanged.
```

- [x] Extend static effect validation and every effect visitor. Simulate inventory counts in the existing ordered group preflight alongside mates/ships/combat; execution removes exactly one copy with no internal save. Give sale UI an explicit disabled protected-item reason while retaining original inventory indices. Render null-image item details and both locales without an `Assets.items(null)` call. Test Crown sale still pays its existing 150000 quote and ordinary duplicate items still sell correctly.
- [x] Write the four-ship sequential-departure regression: João/Domingo/Rocco/Enrico start as captains, Domingo's exit needs relief1, Enrico's later exit needs relief2; all four ship identities survive, all captain slots remain unique and valid, no departing actor remains. Cover unassigned-mate and officer exits, repeated absent actor refusal, and prospective add/remove effects in the same transaction.
- [x] Implement the bounded pool and register the new canonical character/sailor and localized names; reuse existing portraitless presentation. Run focused tests then full Jest, typecheck and diff check. Commit `feat: support protected quest items and sequential companion farewells`. Report any public inventory helper used by subsequent tasks.

### Task 3: Catalog-driven M3 combat and local recovery

**Files:** Modify `src/combat/{encounters,naval}.ts`, relevant pure tests; `src/state/actionsCombat.ts`, action/save tests; `src/interface/combat/Combat.tsx`, combat presentation helpers and UI tests; `src/localization/combat.ts`. No chapter events yet.

**Interfaces:** Each encounter includes `nameKey:string`, optional `captainNameKey:string`, `replayOutcomes:readonly CombatOutcome[]`, `experience:Partial<Record<CombatOutcome,{joao:number;others:number}>>`, and optional `recoveryPortId:string`. Export `getEncounterExperience(encounterId:string,outcome:CombatOutcome):{joao:number;others:number}` returning zeros for absent/unknown policy. `canReplayEncounter` uses the same catalog policy at start, load and finish. The UI's displayed XP/recovery consumes these values. A stored historical replayable outcome may be replaced only by a new actual result; paid success cannot be replayed or confirmed twice.

Preserve all M2 definitions exactly: Kahn shipyard any result0XP/no replay; house draw replay/victory João100; Katarina defeat replay/victory João100 others50/retreat everyone25/recovery Lisbon1. Existing battle log, range, damage and M2 snapshots remain unchanged.

New definitions (original project balance; every enemy weaponCategory null):

| ID | Kind / force | Enemy or captain swordplay,level,weapon,armor | Replay outcomes | XP on victory (João/others), retreat | Defeat recovery |
| --- | --- | --- | --- | --- | --- |
| `joao.m3.ottoman-one` | naval hull/maxHull46,crew18,guns8 | 76,4,20,10 | defeat | 100/50;25/25 | Massawa75 |
| `joao.m3.ottoman-two` | naval hull/maxHull52,crew20,guns8 | 80,5,25,15 | defeat | 100/50;25/25 | Massawa75 |
| `joao.m3.rudolph` | duel | 86,5,30,15 | none | 100/0; no retreat | none |
| `joao.m3.amazon` | naval hull/maxHull64,crew22,guns10 | 90,6,35,20 | defeat,retreat,draw | 150/75;0/0 | Cayenne57 |

Visible names: `Ottoman Vanguard`/`奥斯曼先遣舰队`, `Ottoman Main Fleet`/`奥斯曼主力舰队`, `Rudolph`/`鲁道夫`, `Neo-Atlantis Fleet`/`新亚特兰蒂斯舰队`. Naval captain names respectively `Ottoman Vanguard Captain`/`奥斯曼先遣舰长`, `Ottoman Fleet Captain`/`奥斯曼舰长`, `Martinez's Captain`/`马丁内斯的舰长`.

- [x] Write RED tests proving each constructor copies its own force, nested challenge uses its own ID/captain, JSON reload validates those stats, and invalid/duel IDs cannot construct naval state. Initialize hull0 or crew0 as defeat at revision0 with unchanged resources; do not charge an action to recognize it.
- [x] Generalize constructors and nested challenges without importing state/content into pure combat. Keep unknown catalog lookups safe at state/UI boundaries; direct invalid constructor input may throw a clear RangeError. Add shared policy metadata and XP helper; remove additional hardcoded Kahn/Katarina display/recovery branches where the new definitions consume them.
- [x] Add action tests for local defeat recovery to the exact safe anchors Massawa `(1148,528)` and Cayenne `(558,642)`, real half-max-hull/minimum-crew restoration, preserved other ships/cargo/gold/progress and no minted shot/lumber. M2 still returns Lisbon `(838,358)`. Retry uses actual current ship resources. Final retreat stays where it occurred, pays no XP, leaves ending locked, and permits retry; Ottoman retreat pays once and locks that encounter. Test stale terminal confirmation and contradictory paid-active save guards for new IDs.
- [x] Test result previews equal the actual XP policy and recovery name for each outcome, including zero-XP repeatable final retreat and the distinct nested captain. Run focused tests then full Jest, typecheck, lint and build. Commit `feat: add M3 encounters with catalog-driven rewards and recovery`.

### Task 4: Massawa, the Staff and reconciliation

**Files:** Create `src/story/content/arcs/joao/massawa/{index,events,dialogue}.ts`, `src/localization/dialogue/joaoMassawa.ts`, focused `massawaResolver.test.ts`, `massawaEffects.test.ts`, `massawaTranscript.test.ts`; character files `pietro.ts`, `taphiel.ts`, relationships `joao-massawa.ts`; modify explicit content/character/relationship/localization registration. Read `docs/story/authoring-guide.md`. Add no original portrait IDs and no sailor entries for the two NPCs. Keep the previous arcs intact.

**Interfaces:** Arc `joao.massawa`, export `MASSAWA_COMPLETE_EVENT_ID = storyEventId('joao.massawa.chapter-complete')`. Export each named event constant in uppercase snake case with `_EVENT_ID`, plus `MASSAWA_WAITING_EVENT_ID` as the canonical alias of `waiting-for-pietro`. Export `MASSAWA_BATTLE_AREA={minX:1152,maxX:1156,minY:527,maxY:533}`. Events use existing stage/port/building/all/not/combat/item conditions and Tasks1–2's additions. Characters are IDs `pietro` (Pietro/皮耶德) and `taphiel` (Taphiel/塔菲尔), NPCs with canonical neutral dialogue styles. NPCs never join the roster.

All IDs below have `joao.massawa.` prefix. Triggers listed in order also require the preceding applicable marker; each once event completes its own marker in its final effect group. Exclude already-completed later gates in repeatable advice/retry scenes so they cannot shadow progression. Assign unique stable priorities in table order: [0.100, 0.200) for actionable progression (including readiness choices), [0.300, 0.400) for repeatable advice/retry scenes, increasing by 0.001 within each range. Lower numbers resolve first; preserve the existing deterministic ID tie-breaker. The existing validator treats overlapping indexed scenes as a conflict at equal priority even when their completion gates are exclusive. Keep prior arc priorities and validator semantics unchanged, and do not add random groups to ordered story scenes. Do not use hard fame thresholds.

| Event suffix | Trigger / result |
| --- | --- |
| `five-day-voyage` | M2 complete, world, daysAtSea>=5; latch before docking, Rocco directs next facility. |
| `ali-massawa-lead` | latched voyage, any building; Ali points to Massawa religious facility. |
| `religious-lead` | Massawa75 logical11 after Ali; directs southwest residence8. |
| `staff-request` | Massawa75 residence8; Taphiel requests Staff and directs Lisbon house. |
| `pietro-commissioned` | Lisbon1 residence8; Pietro agrees to deliver at Massawa, gives no item. |
| `waiting-for-pietro` | Massawa75 residence8 after commission; first establishes wait and clock. |
| `waiting-advice` | repeatable Massawa residence8 while invasion gate not eligible/complete; explains later-month day11 rule. |
| `invasion-authorized` | Massawa75 residence8, calendarMonthsAfterEvent waiting/minMonths1/minDay11; resistance begins. |
| `first-sortie-ready` | Massawa75 harbor4 after authorization; Katarina appears, Yes records readiness, No leaves preparation available. Repeatable until accepted. |
| `ottoman-one-start` | world, first readiness, inside MASSAWA_BATTLE_AREA; completes marker then starts ottoman-one as final effect. |
| `ottoman-one-retry` | repeatable Massawa harbor4 after actual ottoman-one defeat; Yes starts same encounter immediately, No returns to preparation. |
| `second-sortie-ready` | Massawa75 harbor4 after ottoman-one victory/retreat; offers next sortie with Yes/No, separate preparation checkpoint. |
| `ottoman-two-start` | world, second readiness, MASSAWA_BATTLE_AREA; starts ottoman-two. |
| `ottoman-two-retry` | repeatable Massawa harbor4 after actual ottoman-two defeat; same retry/defer contract. |
| `defense-reported` | Massawa75 residence8 after both distinct Ottoman victory/retreat results. |
| `staff-received` | Massawa75 pub2 after report; receive one protected Staff and complete marker together. |
| `staff-returned` | Massawa75 residence8, staff-received and has Staff; consume Staff, receive Crown45, adventure fame5000, complete marker together. |
| `chapter-complete` | Massawa75 harbor4 after hand-in; Enrico/Pietro settle chronology and Katarina reconciles; durable completion. |

Each readiness choice's affirmative branch ends normally and leaves the regular harbor Sail option reachable by normal scene exit/re-entry. Start events occur only in the specified navigable water. Retry scenes explicitly state the local immediate encounter adaptation. No repeated world decline can trap movement. Source dialogue may be condensed into 1–3 short lines per scene, but every line must identify the cause, next real facility, or the important character change. New lines have both languages.

- [x] Write RED resolver tests for every row and forbidden out-of-order/wrong-port/wrong-building triggers. Include world sea-day latch then dock reset; Massawa logical11 versus portrait13; commission month not being the wait anchor; same month, later day10/day11, subsequent-month day1, year rollover; both Ottoman result combinations and defeat/retry.
- [x] Author the declarative graph and bilingual character dialogue. Ensure normal building fallback remains usable after each scene; change shared building code only if a concrete test proves logical11 cannot supersede the mosque's fallback refusal.
- [x] Execute effects through the real runtime in tests: no Staff at commission, one pickup, one consume/Crown/fame payout after reload; invalid hand-in preflight has no partial rewards; reconciliation only after consumption; no new companions. Validate content manifest, dependencies, localization coverage and transcripts, using representative assertions rather than duplicating the entire implementation in tests.
- [x] Full Jest, typecheck, `npm run story:validate` and diff check. Commit `feat: implement the Massawa and Staff story chapter`. Report milestone constants and browser entry sequences for Task6/7.

### Task 5: Japan, Lucia and the Amazon victory

**Files:** Create `src/story/content/arcs/joao/finale/{index,events,dialogue}.ts`, `src/localization/dialogue/joaoFinale.ts`, character `rudolph.ts`, `ezequiel.ts`, `martinez.ts`, relationship `joao-finale.ts`, `finaleResolver.test.ts`, `finaleEffects.test.ts`, `finaleTranscript.test.ts`; modify explicit content/character/relationship/localization registration. No new map door or sailor roster entry.

**Interfaces:** Arc `joao.finale`. Export `JOAO_ENDING_EVENT_ID=storyEventId('joao.finale.homecoming')`, event constants with `_EVENT_ID`, `SOUTH_AMERICAN_PORT_IDS=['43','44','46','53','54','55','57'] as const`, and `AMAZON_BATTLE_AREA={minX:594,maxX:602,minY:641,maxY:649}`. Derive outside-Far-East tavern conditions from current regular ports with regionId other than8 using declarative `any atPort`; no new region callback. South America membership matches market8 and is tested against the data. Unknown/missing port IDs do not qualify.

Actor names: Rudolph/鲁道夫, Ezequiel/艾泽格, Martinez/马丁内斯, all story-only without invented portraits. Enrico uses his existing canonical character even after leaving; he does not rejoin. Katarina and Lucia remain NPCs, Rocco remains a companion. Martinez can speak only through an attributed message/report; no unsupported mandatory duel with him.

All suffixes below use `joao.finale.`. Once events complete their own marker; prerequisites follow the rows. Assign unique stable priorities in table order: [0.200, 0.300) for ordinary progression (including the Japan choice), [0.400, 0.500) for repeatable recovery/advice, increasing by 0.001 within each range, with explicit exclusions. These fractional ranges (accepted by the finite nonnegative priority contract) keep all M3 actionable scenes ahead of M3 advice and all eligible M3 scenes ahead of legacy repeatable fallbacks at priorities 1–70, distinct from Massawa and existing arc priorities, satisfying the existing overlapping-scene validator without random groups or validator changes.

| Event suffix | Trigger / result |
| --- | --- |
| `japan-request` | Massawa complete, Enrico aboard, pub2 outside Far East; Yes accepts Japan mission, No defers. Repeatable until accepted. |
| `enrico-farewell` | Nagasaki100 harbor4 after request; safely remove Enrico, give adventure1000, complete marker in one group. |
| `letter-notice` | Lisbon1 any building after farewell; direct guild7. |
| `enrico-letter` | Lisbon1 guild7 after notice; letter gives Sakai guild destination, no item. |
| `sakai-lead` | Sakai99 guild7 after letter; Enrico explains South American great-river lead and remains in Sakai. |
| `south-america-arrival` | eligible South American port, any building except pub2 after Sakai; direct its pub. |
| `rudolph-start` | eligible South American pub2 after arrival; completes marker then starts Rudolph duel. |
| `lucia-rescued` | eligible South American pub2 after Rudolph victory/defeat/draw; Katarina intervenes, Lucia free. |
| `martinez-exposed` | eligible South American harbor4 after rescue; explains plot, agree next-morning window, timestamp marker. |
| `rendezvous-wait` | repeatable eligible harbor4 before alliance and outside qualifying day/time; explain lodge and next 09:00–14:59 window, no mutation of original appointment. |
| `spanish-alliance` | eligible harbor4, calendarDaysAfterEvent exposed/minDays1, timeWindow540–900; formal alliance with Ezequiel, directs the Amazon mouth east of Cayenne near0.5°S,50.0°W. |
| `amazon-start` | world inside AMAZON_BATTLE_AREA after alliance; complete marker then start final fleet. |
| `amazon-retry` | repeatable Cayenne57 harbor4 after final defeat/retreat/draw; explicit Yes immediate retry/No preparation. |
| `amazon-victory` | world or any port/building after actual tagged Amazon victory; Katarina/Rocco confirm conflict resolved and direct Lisbon residence. |
| `homecoming` | Lisbon1 residence8 after amazon-victory; family reunion, João route complete, save. No Crown/Staff possession requirement and no destructive reset. |

The rendezvous is a rolling daily window with a saved first appointment date: `dayIndex >= exposedDayIndex+1` and 540<=minute<900. This explicitly handles a missed appointment without changing a write-once event clock. Same-day 10:00, next-day08:59 and15:00 cannot form alliance. Next-day09:00 and a later-day14:59 can. It is not an elapsed24-hour wait.

- [x] Write RED tests for every ordered gate, Japan decline/re-entry, Far East exclusion, Enrico's second captain departure, Lisbon notice and guild, Sakai guild rather than absent church, South America membership/non-pub latch and deterministic pub trigger.
- [x] Author events and concise bilingual dialogue. Treat all Rudolph outcomes as progression and only Amazon victory as completion. Require the world area on first final encounter, use the existing local-harbor retry adaptation and no XP on repeatable final retreat. Do not add an obligatory Marco visit or require an item for the letter/ending.
- [x] Add effect/roundtrip tests for Enrico absent at farewell reload and present only as later speaker, single fame reward, unchanged ship roster, all Rudolph results, appointment boundaries across month/year, missed-day recovery, final retreat/defeat preventing homecoming, victory outside Lisbon directing home, and sold Crown not blocking ending. Test an existing M2 save through the event/runtime chain as supplemental integration evidence, not browser travel.
- [x] Validate content/transcripts/localization. Full Jest, typecheck and diff check; commit `feat: complete Joao's Japan and Amazon finale`.

### Task 6: Bilingual guidance, Axum display and durable ending

**Files:** Create `src/story/joaoFinaleJournal.ts`, its tests, `src/story/portStoryNames.ts` and tests, `src/interface/JoaoEnding.tsx` and tests; modify `src/interface/QuestJournal.tsx`, its tests, M2 journal future stub and tests, registered localization, and current port-name UI consumers found by a bounded search (not raw port data). Inspect existing UI notification/overlay/load boundaries; only change them for a concrete stale-display or lifecycle bug demonstrated by the new ending or story-name behavior.

**Interfaces:** `getJoaoFinaleJournal(state:State):JournalEntry[]` uses current Task4/5 event constants and actual battle outcomes; display M3 before historical M2/M1 only after M2 completion. `getStoryPortName(portId:string,completedEvents:readonly string[]):string` returns `Axum` for75 after `joao.massawa.staff-returned`, otherwise current data name. Do not mutate port IDs, market membership or static map data. Use this name in visible port info (`src/interface/port/PortInfo.tsx`) and any existing port heading. Verify that the real Staff hand-in refreshes that visible heading immediately, even when portId, buildingId, timePassed and gold stay unchanged. Existing Interface scalar setters may otherwise bail out; make the smallest transient render/notification adjustment supported by this regression, without adding a save field. The journal can say `Axum (Massawa)` / `阿克苏姆（马沙华）` to preserve wayfinding.

`JoaoEnding` is a reusable bilingual summary rendered inside the journal only when `JOAO_ENDING_EVENT_ID` is completed, `data-test="joaoEnding"`. It gives the homecoming result, resolved family accusation/Lucia rescue/alliance and “The main story is complete. You can continue exploring.” / “约翰主线已完成，仍可继续自由探索。” Opening the journal revisits it; ordinary overlay close returns to the game. No automatic reset, new save slot, reward or permanent input suspension.

- [x] Write RED journal assertions at M2 completion, five-day latch, commissioning/wait/date-ineligible/date-eligible, first/second battle defeat, Staff held/consumed, Japan request/departure/letter/Sakai, rescued/appointment missed, final retreat/defeat/victory and homecoming. Current actionable entry must win over historical and future entries; M1 stays completed after both companions depart. Rephrase the completed M2 summary as chapter-bounded history so it cannot claim Lucia remains kidnapped after M3 rescue.
- [x] Implement concise journal entries with exact port/facility names and preparation guidance. Massawa uses religious11/residence8, Sakai guild7, final retry Cayenne harbor4. Give player-facing geographic directions: Massawa's fleet is east and slightly south of the harbor near15.2°N,42.7°E; Amazon is east of Cayenne at the river mouth near0.5°S,50.0°W. Keep internal tile rectangles out of dialogue/journal because the UI has no tile-coordinate readout. Advise stocking food/water, filling minimum crew, repairing and buying ammunition; the starter ship cannot recruit above its minimum through the current UI. Mention Crown can be sold to fund long travel; do not require it. Explain the true month/day gate and rolling appointment window, with current/next date derived from Task1 helper instead of an unconditional “come tomorrow”. Feed dynamic dates through registered bilingual templates and the existing interpolation contract, rather than composing an unregistered English source sentence.
- [x] Render a completed ending summary without an endless future M3 objective. Test both locales, max-height scrolling within the 720×560 journal, no overflowing text controls, and load from a completed save into an incomplete one removing the ending. Port75 shows Axum only after hand-in, and old saves before it still show Massawa.
- [x] Run focused UI/journal tests then full Jest, typecheck, lint and build. Commit `feat: guide the finale and preserve Joao's home ending`. Report exactly how root can inspect long Chinese entries and the ending in a browser.

### Task 7: Browser branch coverage and honest fresh-game acceptance

**Files:** Create `tests/e2e/m3Massawa.cy.ts`, `tests/e2e/m3Finale.cy.ts`, `tests/e2e/joaoFullJourney.cy.ts`, and focused shared journey helpers under `tests/` if required. Modify `tests/e2e/conflictAndGrowthChapter.cy.ts` for the intentionally replaced M2 journal copy; modify finale events/dialogue/localization and focused resolver/transcript tests for the post-ending residence continuity fix below. Reuse `tests/firstVoyageUtils.ts` and current fixtures. If reusing the opening route from `tests/e2e/storyArchitecture.cy.ts`, extract its helpers/body into a shared non-spec module rather than importing a `.cy.ts` or duplicating hundreds of route lines. Modify `cypress.config.ts` only for explicit long-journey execution/logging, retaining existing suite defaults. Root updates `HANDOFF.md`, `docs/DECISIONS.md` and the approved Chinese release spec's milestone progress only after observing results; the worker must not claim an unrun fresh journey.

**Interfaces and evidence:** Ordinary browser input drives events and travel. Test helpers may read snapshots created by the visible System→Save action and use the raw map for planning, but the full fresh journey must never grant progress, resources, time, position or combat outcomes through state/localStorage edits. It starts without a savedState. If a leg needs restart, only restore the byte-identical previously earned save, label this checkpoint recovery and retain its hash/provenance. Fixture specs are explicitly separate and may position controlled saves for boundary coverage. Keep records in this plan's ignored scratch, not new production debug globals or cheats. Use an isolated test browser on M3 port8083 so the user's earlier previews and storage remain untouched. Keep the full journey enabled in the default complete Cypress suite; use explicit --spec selection for fixture iteration, without adding a default-skip flag or development early return. Coordinate the first complete suite with root so its fresh journey can supply the release proof without a duplicate voyage.

- [x] Build targeted browser cases for Massawa logical11/residence8, correct first clock anchor, day10 blocked/day11 available/later-month day1 blocked, Staff receive/inspect/sale protection/consume/Crown sale, Enrico's four-ship second departure, notice/letter/Sakai guild, all Rudolph results, appointment early/valid/late/missed-day states, Amazon retreat/defeat/retry/victory, ending reload and locale switching. Validate the actions and visible consequences rather than merely seed completed markers and screenshot a result.
- [x] Update the existing M2 final-journal browser assertions to completed M2 history plus the new M3 current objective, retaining the save/version/combat/layout checks. Add an actual post-homecoming exit/re-entry regression and a small declarative repeatable `joao.finale.home-revisited` scene: priority0.402, Lisbon1 residence8, only after `JOAO_ENDING_EVENT_ID`, existing canonical Duke or mother, concise registered bilingual welcome/free-exploration dialogue, no effects, new completion marker, rewards, reset or mandatory visit. It must supersede the legacy opening farewell only after the ending. Update finale registration/count/resolver/transcript expectations as required.
- [x] Run new fixture specs first and record any true regressions. Follow systematic debugging for failures; a production fix found here belongs in the worker's reviewed diff with a meaningful regression test. Do not weaken assertions, alter time speed, skip a required gate or turn earned journeys into fixtures to make the suite pass.
- [x] Implement a traceable full journey using the existing M0/M1 UI route, continue M2 through Istanbul, then sail M3: five-day voyage/next facility → Massawa → Lisbon commission → Massawa wait/Staff/reconciliation → Nagasaki → Lisbon letter → Sakai guild → Cayenne rescue/alliance → Amazon target → Lisbon home. Use legitimate provision stops, sleep/port time and preparation. A calculated path is a route plan; assert actual docked port IDs and earned markers after each leg. Record important saves, battle outcomes, total game date, screenshots and final ending.
- [x] The full journey test must execute the real route and retain its evidence. Example gate:

```ts
// After ordinary UI play through every preceding milestone:
saveFromSystem().then((save) => {
  expect(save.storyEvents).to.include('joao.finale.homecoming');
  expect(save.combatResults['joao.m3.amazon']).to.equal('victory');
  expect(save.portId).to.equal('1');
  expect(save.items).not.to.include('m3-staff-of-the-saint');
});
// Reload via System, reopen Journal, assert the visible Chinese ending and no replayed reward.
```

- [x] Root independently inspects representative Massawa, ship/crew preservation, rendezvous and ending screens, and checks ordinary input after closing/loading overlays. Run `npm run verify` and the full Cypress suite on the final production code; a full suite's journey case can be the release journey, so do not rerun it solely to duplicate evidence. Capture commands/counts/commit and do not report passed when pending or failed.
- [x] Commit reviewed test/harness work as `test: verify the full Joao finale journey`. After the final whole-branch review and any scoped fix wave, root updates durable handoff/release status with actual results, known Pernambuco/Sakai adaptations, save v7 migration, preview8083, branch/HEAD and next M4 scope. Commit `docs: hand off the completed M3 Joao route` only once the completion evidence exists. Preserve the branch and all worktrees; no merge/push.

## Controller completion gates

- [x] Plan self-review and per-task/shared-interface preflight matrix recorded in this plan's progress ledger before Task1 dispatch.
- [x] Every task has a task review for spec compliance and quality; important findings were resolved through the bounded reviewed fix loop. Task6 scoped rereview reused a prior seat after an environment thread cap; this limitation is disclosed. Task7 and the final whole-branch review used fresh independent reviewers.
- [x] One strongest-model whole-branch review against base1002d9e after implementation and acceptance, with at most one final fix wave and one scoped re-review.
- [x] Durable handoff contains actual validation, limitations and all material rulings; final user response links it and states the concrete result without implying a merge or push.

## Completion evidence — 2026-09-08

Code HEAD `0ad24ed6dd1622a0e0d311fb04b1400efe8cfc46`; stacked M2 base `1002d9eb2f3338cd5e4dfc6fc0f17546eb6a4ed6`. All seven implementation tasks and task-review gates are complete. Fresh Sol Task7 review closed its lifecycle finding after one fix; fresh Astra whole-branch review closed its sole future-clock finding after one final fix and one scoped rereview. Final controller documentation is committed with this plan update; no merge or push.

The full Edge acceptance at `9d41336` passed21specs/99tests in3:56:52, including uninterrupted Chinese New Game→M0/M1→actual M2 Basra/Istanbul→M3→homecoming→ordinary Load/locales/revisit in3:42:16, with30 original recovery-null checkpoints. Later helper-only cleanup at `6e54d2e` passed lifecycle2/2, firstVoyage9/9 and unchanged-helper storyArchitecture6/6. Final production clock normalization repair at `0ad24ed` passed focused66/66, unfiltered Massawa5/5+Finale12/12 browser cases, and full `npm run verify`102suites/899tests plus assets/story/type/lint/build. Tests TypeScript passed. All396 final inputs matched before/after browser and commit.

Controller validation ruling: the final clock repair only changes invalid-future-clock recovery; old/new actual normalizers produced identical clock maps for all30 original earned saves after independent byte/SHA checks. The final reviewer accepted this scoped evidence. The original complete voyage and later repair checks are distinct; no full102-case rerun is claimed. The default full journey remains enabled. See [verification](../verification/2026-09-07-m3-joao-finale.md), [rulings](../verification/2026-09-07-m3-joao-finale-rulings.md), [handoff](../../../HANDOFF.md), and D18 for exact evidence and limitations. M4/M5 remain pending.
