# M1 First Voyage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** A Chinese player can follow the Lisbon opening into a first voyage, meet Domingo, chart Gibraltar, report the discovery, and finish the chapter with durable progress and one-time rewards.

**Architecture:** Extend the existing declarative story resolver and save boundary. Keep semantic event completion separate from legacy quest keys; use a transient sea session controller to pause simulation and present story frames. Put the first commission and its journal in a chapter module; reporting is a reusable state action exposed by the Lisbon guild.

**Tech Stack:** React 18, TypeScript 4.8, existing Canvas loop, Jest 29, Cypress 10, Node.js 22.

**Spec:** ../specs/2026-09-06-chinese-playable-release-design.md (M1 and expansion constraints); ../../1-baseline/chinese-reference-baseline.md (three consecutive sea days).

## Global Constraints

- 使用 Node.js 22，保留锁文件与现有依赖版本。
- 默认简体中文（zh-CN），可切换英文（en），语言偏好存储于独立的 `uw2.locale`。
- 既有ID保持稳定，新内容不能靠改写旧章节或到处新增特殊分支推进。
- 内容继续使用声明式条件和效果，禁止把任意回调放进剧情数据。
- 新章节必须验证旧存档进入新章、章节中途读取、奖励只领取一次，以及已有章节回归。
- 原创首次航海委托与奖励是本项目的玩法设计，不宣称原版剧情或数值。多明戈身份揭晓与决斗属于 M2。
- Work in `.worktrees/m1-first-voyage`, branch `codex/m1-first-voyage`, base `87e3319`. No shared-branch merge or push in this implementation.

## Implementation rulings

- Save v5 adds `storyEvents: string[]` and `reportedDiscoveries: string[]`. Migrate v4 known Lisbon keys to semantic IDs, preserve unknown legacy keys, and mark all previously discovered landmarks reported because v4 already paid their gold. New saves start with both arrays empty. Old saves can complete the new commission using an already reported Gibraltar observation, but cannot collect landmark gold again.
- Add conditions `daysAtSea` with min/max, `hasDiscovery` and `hasReportedDiscovery` with `discoveryId`. The sea-day condition reads `dayAtSea`, which resets on docking/adrift, never calendar elapsed time. No M1 fame gate.
- First commission targets existing `strait-of-gibraltar` (30 fame on discovery; 300g only on report), Lisbon port `1`, Guild building `7`. Commission completion grants 500g once. A report of any pending known discovery can be filed at the Lisbon guild; its existing gold value is paid once, no extra fame is invented.
- Domingo is met after the opening's `harbor-final` and `dayAtSea >= 3`. Accept recruits him once. Decline means defer the decision until Lisbon guild, with a clearly available reconsideration path; no repeat interruption at sea and no permanent mainline lockout. His identity remains concealed.
- The journal lists the opening's current concrete instruction, the guild commission, Domingo status, exploration target (coast route and coordinates), return/report/reward and completed chapter. Completing the chapter requires Domingo recruited, commission accepted, and Gibraltar reported. Refusal of commission remains retryable in the guild.
- New scene effects are at terminal steps, with completion and reward in one effect group. Reloading mid-dialogue restarts its uncommitted dialogue; committed rewards and recruitment never replay. Active session cursor is transient.

### Task 1: Save v5 and extensible story conditions

**Files:** Modify `src/state/state.ts`, `saveMigrations.ts`, `saveLoad.ts`; `src/story/storyRuntimeActions.ts`, `core/types.ts`, `core/resolver.ts`, `core/validator.ts`, `content/catalogs.ts`; corresponding existing tests and new `src/story/storyProgress.test.ts`.

**Interfaces:** Produces `State.storyEvents: string[]`, `State.reportedDiscoveries: string[]`; StoryContext adds `dayAtSea: number`, `discoveries: ReadonlySet<string>`, `reportedDiscoveries: ReadonlySet<string>`. New conditions have `{type:'daysAtSea',min?:number,max?:number}`, `{type:'hasDiscovery',discoveryId:string}`, `{type:'hasReportedDiscovery',discoveryId:string}`. Add optional discovery catalog for test fixture compatibility and provide production catalog. Existing callers without newly added fields must default safely.

- [ ] Write behavior tests before implementation. Core examples (incorporate into existing fixture helpers):

```ts
const old = { version: 4, quests: ['houseBeforeQuest', 'future-old-key'], discoveries: ['strait-of-gibraltar'], gold: 900 };
const upgraded = migrate(old);
expect(upgraded?.storyEvents).toEqual(['joao.lisbon-opening.house-introduction']);
expect(upgraded?.reportedDiscoveries).toEqual(['strait-of-gibraltar']);
expect(upgraded?.quests).toEqual(old.quests);
expect(upgraded?.gold).toBe(900);
```

Test save/load roundtrip of a nonlegacy semantic event and unknown semantic IDs; new event completion with no legacy key; existing Lisbon completion still writes its legacy key exactly once; resolver excludes completed once events; three sea days matches while 30 elapsed calendar days with zero sea days does not; invalid numeric range and unknown discovery ID diagnostics remain strict.
- [ ] Run `npm test -- --runInBand src/state/saveMigrations.test.ts src/story/storyProgress.test.ts` and record the expected missing-feature failures.
- [ ] Implement pure v4→v5 mapping without importing compiled runtime into state initialization. Union semantic events with mapped legacy events in `createStoryContext`. `completeEvent` accepts any registered event and records semantic completion idempotently plus a legacy key where defined. Replace universal once/legacy requirement with the legacy parity manifest's requirement so migrated events cannot silently lose their mapping. Preserve unknown IDs and original v4 fields.

```ts
const completedEvents = new Set([
  ...(state.storyEvents ?? []).map(storyEventId),
  ...getCompletedStoryEvents(state.quests, content),
]);
```

- [ ] Run all Jest tests and typecheck. Update tests that intentionally asserted the old legacy-only restriction, retain migrated-key missing/mismatch tests.
- [ ] Commit only task files as `feat: persist semantic story progress and discovery reports` and write the task report with commands/results and compatibility decisions.

### Task 2: Sea story sessions and simulation pause

**Files:** Create `src/story/seaStory.ts`, `src/story/seaStory.test.ts`, `src/interface/world/SeaStory.tsx`; modify `src/app.ts`, `src/interface/Interface.tsx`; extract shared advancement from `src/interface/quest/useQuestStep.ts` to `src/story/advanceSession.ts` if needed. Add focused hook/UI tests. Do not own Task 1 files while its implementer is working.

**Interfaces:** Consumes `createStoryContext`, `resolveStoryEvent`, `storyRuntimeActions` and Task 1 fields. Exposes a transient subscribed store: `getSeaStorySession(): StorySession|null`, `subscribeSeaStory(listener):()=>void`, `startSeaStory():boolean`, `advanceSeaStory(choiceId?:string):void`, `clearSeaStory():void`. Store is the single session authority. Root integrates these interfaces; names may be simplified with a recorded ruling before handoff.

- [ ] Add a test using a real compiled synthetic world event and production session advancement boundary: one active session, pause before any clock movement, valid yes/no branches, duplicate/stale acknowledgements cannot repeat effects, completion clears state, reload can re-resolve unfinished event and cannot replay finished event.

```ts
expect(startSeaStory()).toBe(true);
const before = state.timePassed;
// The application must skip world.update while this session is active.
expect(getSeaStorySession()).not.toBeNull();
expect(state.timePassed).toBe(before);
```

- [ ] Run the focused tests and observe failures before writing implementation.
- [ ] Implement the controller using immutable StorySession frames and the existing effect executor. Check sea scene only, resolve once per loop when idle, clear input on entry/exit; expose snapshot subscriptions for React. In `app.ts`, create/draw world normally but resolve/hold a sea story before `world.update`. Never let world clock, provisions, docking or movement progress while the session is open. Prevent choice keys leaking to the sailing input after dismissal.
- [ ] Render character/vendor frames, yes/no and acknowledgement controls above the camera, retain language switching, and provide ordinary readable modal dimensions. Use actual dialogue controls, not test-only runtime globals.
- [ ] Run sea session, advancement and world regression tests plus typecheck; commit `feat: run sea story sessions with paused navigation` and record evidence.

### Task 3: First voyage content, reporting and journal

**Files:** Create `src/story/content/arcs/joao/first-voyage/{index,events,dialogue}.ts`, `src/story/content/characters/domingo.ts`, relevant relationship module; update explicit content registration. Create `src/story/firstVoyageJournal.ts`, `src/interface/QuestJournal.tsx`, `src/state/actionsDiscovery.ts`, `src/interface/port/Guild.tsx`; update `Building.tsx`, `Left.tsx`, `Discoveries.tsx`, `world/DiscoveryBanner.tsx`, `src/state/actionsWorld.ts`, presentation data and tests. Create `src/localization/dialogue/joaoFirstVoyage.ts` and cycle-free `src/localization/catalogs.ts` merger, update catalogs and translation coverage tests.

**Interfaces:** Stable events use arc `joao.first-voyage` with `commission-accepted`, `domingo-met`, `domingo-recruited`, `chapter-complete`. Register every completion target as an actual event; use a repeatable offer and terminal acceptance/rejection branches where appropriate. Export ID constants and `getFirstVoyageJournal(state): JournalEntry[]`, where entries have `{id:string,title:string,body:string,completed:boolean}`. `reportDiscoveries(): {ids:string[],gold:number}` runs only at Lisbon guild, filters to known discovered/unreported IDs, updates state and saves once, returns empty result otherwise.

- [ ] Write/report tests first for zero gold at sighting, 300g at Gibraltar report, repeat report/reload pays zero, wrong building cannot report, v4 discovered Gibraltar grants zero. Use hand-derived expected amounts. Write chapter behavior tests for initial offer, decline/reoffer, sea three-day gating, accept/decline/reconsider, chapter reward once and all prerequisites.

```ts
state.portId = '1'; state.buildingId = '7';
state.discoveries = ['strait-of-gibraltar']; state.reportedDiscoveries = [];
state.gold = 100;
expect(reportDiscoveries()).toEqual({ ids: ['strait-of-gibraltar'], gold: 300 });
expect(state.gold).toBe(400);
expect(reportDiscoveries()).toEqual({ ids: [], gold: 0 });
```

- [ ] Observe red focused tests, then implement chapter and reusable report action. Guild exposes commission, report and reconsideration actions through existing story sessions; after reporting, refresh story resolution so final chapter conversation is available immediately or after an explicit visible continue action. Preserve Lisbon ambient parity.
- [ ] Make journal readable from port and sea with current next steps and completed progress. Ensure display refreshes after reporting/finishing without reload. Clearly distinguish already reported discoveries from pending gold in both discoveries panel and sighting banner.
- [ ] Bind Domingo to the verified existing sailor/portrait, provide safe mate-panel presentation for all recruited sailors, add no new ships. New dialogue must be short enough for existing boxes, Chinese names use approved terminology. Merge chapter dictionaries with conflict detection before flattening and test every branch's translation/parameters.
- [ ] Run chapter/report/journal/translation focused tests, full Jest, typecheck and lint; commit `feat: add first voyage commission and Chinese quest journal` and report evidence.

### Task 4: Whole chapter integration and playable acceptance

**Files:** Create `tests/e2e/firstVoyage.cy.ts`, update discovery e2e expectations and docs `roadmap.md`, `story/authoring-guide.md`, `README.md`, `superpowers/verification/2026-09-06-m1-first-voyage.md`.

- [ ] Build and serve M1 at `http://127.0.0.1:8081`, keep existing M0 preview on 8080. Add browser tests for Chinese commission→sea encounter→discovery→guild report→chapter reward; assert saved v5 progress and no repeated rewards after reload. Include decline/reconsider and English display branches. Use save fixtures only for long travel positioning; at least one acceptance journey must start fresh and perform actual opening, supplies, navigation and report.
- [ ] Verify live DOM states and screenshots, readable overlays, four-member roster, HUD height and no console errors. Run `npm run verify` and Cypress suite against the M1 build; investigate failures before claiming completion.
- [ ] Request independent broad review of the branch and address critical/important findings. Record exact test evidence, screenshot paths, original-design balance choices, tested old-save migration and remaining M2 scope.
- [ ] Commit validated integration/docs, retain feature branch/worktree and open the playable M1 preview for the user.
