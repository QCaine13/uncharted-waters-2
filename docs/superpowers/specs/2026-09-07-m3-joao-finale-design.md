# M3 João Finale Design

Date: 2026-09-07. Authority: the approved Chinese playable release design, D15–D17, and the user's request “m3开始”. M3 continues the completed M2 branch at `1002d9e`; this document specifies the next chapter without reopening the already approved project scope or execution workflow.

## Outcome and boundary

A fresh Simplified Chinese game must reach João's home ending through playable travel, facilities, decisions and combat. An existing M2 save must continue into the same route. The ending is durable, survives load, can be revisited in the journal, and leaves free exploration available. M3 includes Massawa and the Staff, reconciliation with Katarina, Enrico's Japan departure, the Lisbon letter and Sakai lead, Lucia's rescue, the Spanish alliance, the Amazon victory, and the Lisbon homecoming. The other five protagonists remain M4 work.

This is an architectural chapter extension using the existing declarative story system and deterministic combat, not a new engine. A generic callback, narrative auto-win, direct save-state shortcut, or a fixture-only demonstration cannot satisfy the release target.

## Global Constraints

- Work in `/Users/qsircaine/uncharted-waters-2/.worktrees/m3-joao-finale`, branch `codex/m3-joao-finale`, base `1002d9eb2f3338cd5e4dfc6fc0f17546eb6a4ed6`. Do not merge or push this implementation.
- Use Node.js 22. Set PATH to `/Users/qsircaine/uncharted-waters-2/.worktrees/.tools/bin:/Users/qsircaine/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin:$PATH`. Keep locked dependencies unchanged.
- Default Simplified Chinese with English switch. Every new visible text has both languages. Preserve legacy IDs, existing semantic IDs and unknown saved progress. Do not invent original portrait or item-sprite coordinates.
- Story content stays declarative. Preflight every stateful effect group before any mutation; each successful group autosaves once. Battle confirmation, rewards, item delivery and companion departure must not repeat after load.
- Follow TDD for behavior. Run focused tests during iteration, full Jest and typecheck before the task commit; reviewers use recorded evidence instead of repeating those commands.
- One implementation subagent at a time, Sol as previously authorized. Workers never spawn subagents. Root owns coordination, independent browser validation and final integration. Preserve this and the earlier worktrees and the ignored execution evidence.
- Original source behavior and project adaptations must be distinguished. M3 completion requires a real fresh-game journey; location fixtures and calculated map paths are supplemental evidence only.

## Source-grounded sequence

The primary route evidence is the [2025 PC playthrough guide](https://gamefaqs.gamespot.com/pc/564431-new-horizons/faqs/82274/new-horizons-storylines-guide), [PTT PC complete route](https://www.ptt.cc/bbs/Koei/M.1618752726.A.50B.html) and [Japanese flag investigation](https://w.atwiki.jp/offlinedaikoukai/pages/47.html). PTT refers to the Japanese source, so they are not fully independent. The [official SNES manual](https://www.videogamemanual.com/snes/New%20Horizons%20%28USA%29.pdf) documents general mechanics rather than hidden PC flags. New dialogue is an original concise paraphrase, not a copied walkthrough or game script.

1. After M2's Istanbul report, a voyage crosses five consecutive day boundaries at sea; a world event latches that fact before docking resets `dayAtSea`. Ali gives the Massawa lead at the next facility.
2. Massawa's religious facility points to the southwest residence. The ruler requests the Staff. João commissions Pietro at the Lisbon residence; Pietro is an NPC and never joins the fleet.
3. Returning to Massawa's residence establishes that Pietro has not arrived. This event, rather than the Lisbon commission, anchors the wait. The invasion can start only in a strictly later calendar month and on days 11 through the end of that month. A later month's days 1–10 remain ineligible even after a previous eligible window was missed.
4. Katarina appears at the harbor. Two distinct Ottoman encounters must each end in victory or voluntary retreat. Defeat does not count. The project provides a harbor preparation stop between the two authored sorties.
5. After the two fights, João reports at the residence, meets Pietro at the pub, receives the real Staff item, and returns it to the ruler. The Staff is consumed. Royal Crown item `45` and 5,000 adventure fame are awarded once. The port's story name becomes Axum while its ID remains `75`. Katarina reconciles at the harbor.
6. Enrico asks for passage to Japan at a tavern outside the Far East. At Nagasaki harbor he leaves permanently and grants 1,000 adventure fame. His ship or office is reassigned safely. Rocco remains; Pietro, Katarina and Lucia do not join the roster.
7. Back at Lisbon, the guild holds Enrico's letter. João returns to Sakai to meet him and receives the South American river lead. No additional time, item or fame grind gates these steps in the project.
8. Enter a non-tavern facility in an eligible South American port, then its tavern. Rudolph's duel ends in victory, defeat or draw; all three lead to Katarina's intervention and Lucia's rescue. The harbor scene exposes Martinez and arranges the next morning's expedition.
9. The alliance requires at least the next calendar day and a harbor meeting during 09:00–14:59. Missing that day rolls the same appointment window to each following morning. The original appointment event timestamp remains the durable lower date bound. Earlier hours and late arrival give recoverable, actionable guidance.
10. After the alliance, sail to the authored Amazon-mouth target region. Only victory over the tagged final fleet unlocks the Lisbon residence home ending. Retreat and defeat permit retry without completing the story.

## Chosen adaptations and rationale

- Replace the original 16,000 / 30,000 / 40,000 adventure fame gates with the preceding chapter milestones, continuing D17's reachable-story policy. Japan ports remain geographically visible. The original campaign deadline is not added.
- Use fixed authored fleets and the M2 four-range naval rules. No friendly-fire or political-contribution subsystem is introduced. The first and second Ottoman sortie each depart from Massawa after a separate harbor preparation choice. These are project encounter placement and balance decisions.
- Recover Ottoman defeats at Massawa and final-fleet defeats at Cayenne, using the established half-hull/minimum-crew recovery and safe world anchor. No gold, cargo or invented ammunition is granted. A local harbor offers free immediate retry so an exhausted fleet does not have to finance another voyage. A final retreat awards no XP, because it can be repeated.
- The Staff uses a new semantic ID and a neutral text emblem because no verified Staff sprite exists. It is protected from sale and consumed only by the hand-in. Preserve the existing unbounded inventory instead of reproducing the original forced overwrite. The Crown remains a normal sellable item; no later event requires possession.
- The current Sakai map has no church entrance. Meet Enrico at the existing guild, clearly called the Sakai guild reception in both languages. Do not place a fictional door on an arbitrary road cell. Massawa uses the real logical religious building `11` and southwest residence `8`; mosque portrait `13` is presentation only.
- The South American tavern encounter is deterministic. Eligibility uses the data's South America market membership, not the larger New World region. This resolves the PC guide's broader region/chance-roll difference in favor of a clear route.
- Enrico's departure extends the existing bounded relief-captain pool. Existing `m2-relief-captain` remains unchanged; a second registered portraitless relief can captain a retained fourth ship.
- The ending appears through the final home scene and a durable journal summary. The player can continue exploration and save; completion neither resets the world nor prevents loading another save.

## Durable state and declarative interfaces

Add save v7 field `storyEventTimes: Record<string, number>` measured in existing game minutes. `completeEvent` stamps an event once; repeated completion preserves its existing timestamp. Migration and normalization preserve finite nonnegative timestamps no later than the save's time, including unknown event IDs. A completed event lacking a valid timestamp receives the loaded save's current valid time (or zero if its time is invalid); it may wait longer, but cannot skip a calendar gate. Defaults for ordinary old v6 saves are empty. Existing possessions, unknown progress, equipment, growth, outcomes and valid active M2 combats survive.

Add pure, timezone-independent calendar helpers based on 1522-05-17 and use the same calendar parts in the HUD and story predicates. New conditions are `calendarMonthsAfterEvent {eventId,minMonths,minDay}`, `calendarDaysAfterEvent {eventId,minDays}`, and `withinWorldArea {minX,maxX,minY,maxY}`. Calendar days are crossed date boundaries, not elapsed 24-hour periods; month predicates compare year/month indices and the current day independently. Missing anchors and invalid/missing positions fail closed. World coordinates use the existing fleet `1` position. Bounds are inclusive, nonwrapping and validated within the world coordinate range.

Add `consumeItem {itemId}`. The effect-group preflight simulates inventory in order, allowing receive-then-consume and rejecting missing or repeated overconsumption before any reward or marker changes. Consumption removes one copy; if its final copy was equipped, clear that slot. The group still persists exactly once. Sale protection is item metadata checked by both the UI and the state action.

Combat definitions supply the enemy, visible name keys, replay outcomes, per-outcome João/other-mate XP, and recovery port. Constructors and nested challenges use the actual encounter ID. The same definition governs active-save validation, start/finish replay guards and result preview. A zero-hull or zero-crew initial flagship starts in actual defeat without paying an action cost. M2 results, balance and snapshots remain compatible.

## Navigation and facilities

Verified ports: Lisbon `1`, Istanbul `3`, Massawa `75`, Nagasaki `100`, Sakai `99`, Cayenne `57`. Their selected collision-safe anchors respectively are `(838,358)`, `(1072,342)`, `(1148,528)`, `(1674,402)`, `(1714,390)`, `(558,642)`. These anchors belong to the same main ocean component. There is no Suez shortcut; African provision stops are essential. Cape Town supply port `103` and Tamatave `105` are on a shortest Lisbon–Massawa path. The journal must give actual port/facility names and practical supply/preparation guidance.

The collision-checked battle rectangles are Massawa X1152–1156/Y527–533 and Amazon X594–602/Y641–649, inclusive. The player receives geographic directions rather than these internal tile numbers: east/slightly south from Massawa near15.2°N,42.7°E, and east of Cayenne toward the Amazon mouth near0.5°S,50.0°W. The current crew recruitment action fills the ship model's minimum only; journal preparation must not promise extra starter-ship sailors for a captain challenge.

Pernambuco `53` has an existing isolated 10-cell docking pocket. M3 does not require that port and the acceptance route uses Cayenne. Retain this as an explicit map issue for M5; do not pretend a teleported fixture proves its reachability. All route calculations are planning evidence until normal player travel validates them.

## Acceptance and delivery

Unit/integration tests cover calendar boundaries, missing clocks, v1–v7 migration, world-area edges, inventory atomicity, two sequential captain departures, all four M3 encounters and load/retry/reward guards, ordered chapter dependencies, localization, journal guidance and completion. Browser fixtures exercise significant branch exits and save points, including partial Staff delivery and active battles.

The release gate is one traceable fresh Chinese game from the initial state through M1, M2 and M3 using ordinary UI input, travel, supplies and combat. Read-only observations of UI-created saves are allowed for navigation and evidence. No writes that grant progress, move the fleet, alter the clock, change resources or alter outcomes are allowed in that journey. Checkpoint restoration is allowed only for the exact previously earned save and must be identified in the report. Browser fixture cases must be separately named and cannot substitute for this gate.

Run `npm run verify` and the full browser suite on the final implementation, plus a final whole-branch review. Record commands, commit IDs, counts and limitations in a durable M3 handoff, update the release progress and decision log, and commit the branch. Leave main and the remote untouched unless the user separately requests integration.
