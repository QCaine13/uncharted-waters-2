# Structured Story Authoring Guide

This guide covers the typed story system under `src/story`. The registered content includes the behavior-preserving João Lisbon opening and the first-voyage commission with Domingo recruitment. The [Chinese release plan](../superpowers/specs/2026-09-06-chinese-playable-release-design.md) schedules later chapters and expansion content. Their runtime dependencies must be implemented and verified before registering them as playable content.

## Stable IDs

IDs are semantic, lowercase ASCII, and permanent after release. Use lowercase kebab-case within each dot-separated segment:

- Character: `joao`, `duke-franco`.
- Arc: `<protagonist>.<chapter>`, for example `joao.lisbon-opening`.
- Event: `<arc>.<event>`, for example `joao.lisbon-opening.house-introduction`.
- Relationship: a globally unique dotted description such as `joao.rocco.mentor`. The `from`, `to`, and `type` fields, not the spelling of the ID, define direction.

Create branded IDs with `characterId`, `relationshipId`, `storyArcId`, `storyEventId`, and, only at the Save v2 boundary, `legacyQuestId` from `src/story/core/types.ts`. Display names, translated copy, portraits, colors, and titles may change without renaming an ID. Never rename a persisted or cross-referenced ID without an explicit migration.

## Directory ownership and registration

- `content/characters/` owns canonical narrative identities. Sailor combat/navigation data remains in the sailor domain and is linked with `sailorId`.
- `content/relationships/` owns global, static, directed relationship facts.
- `content/arcs/<protagonist>/<chapter>/` owns that chapter's dialogue, events, choices, and effects.
- `legacy/` is the only Save v2 completion-key compatibility boundary.
- `core/` must remain content-agnostic. It must not import João, Lisbon, or any future arc.

There is no directory discovery. Export a new character or relationship from its directory `index.ts`, export an arc as `{ arc, events }`, and add all three collections explicitly to `src/story/content/index.ts`. An arc may refer to another arc by public event ID, but must not import another arc's internal arrays.

## Characters and relationships

A character module is a typed record. The ID factory supplies the branded identity:

```ts
import { characterId, type StoryCharacter } from '../../core/types';

const example: StoryCharacter = {
  id: characterId('example-sailor'),
  names: { en: 'Example Sailor' },
  role: 'companion',
  dialogueStyle: { color: 'text-blue-600' },
  sailorId: 'existing-sailor-id',
};

export default example;
```

Do not duplicate sailor statistics. `legacyCharacterId` is compatibility metadata for the old dialogue lookup, not the story identity.

Relationships are declared once. A small local factory keeps repeated ID conversion mechanical; the compiler materializes a declared reciprocal edge for queries:

```ts
const relationship = (
  id: string,
  from: string,
  to: string,
  type: RelationshipType,
  reciprocal: RelationshipType,
): CharacterRelationship => ({
  id: relationshipId(id),
  from: characterId(from),
  to: characterId(to),
  type,
  reciprocal,
});
```

Relationships are static in this architecture slice. Do not save affinity, mutate edges, or separately declare a reverse edge unless it exactly agrees with `reciprocal`. Use `sourceArc` only when a relationship fact belongs to a particular registered arc.

## Arc, event, condition, and effect shape

An arc lists every event it owns. Registration is explicit:

```ts
export const chapterArc: StoryArc = {
  id: storyArcId('joao.example-chapter'),
  protagonist: characterId('joao'),
  title: 'João: Example Chapter',
  eventIds: chapterEvents.map(({ id }) => id),
};

export const joaoExampleChapter = { arc: chapterArc, events: chapterEvents };
```

Compose triggers from declarative conditions. `all`, `any`, and `not` may nest; leaf conditions cover event completion, port, building, stage, time, elapsed days, consecutive days at sea, fame, items, companions, discoveries, and discovery reports:

```ts
trigger: {
  type: 'all',
  conditions: [
    { type: 'stage', stage: 'building' },
    { type: 'atPort', portId: '1' },
    { type: 'atBuilding', buildingId: '4' },
    {
      type: 'eventCompleted',
      eventId: storyEventId('joao.lisbon-opening.shipyard-hermes-ii'),
    },
  ],
}
```

Time bounds must be expressed as finite minutes in `[0, 1440)`. Runtime clock values are normalized before evaluation. `max` is exclusive for a normal window; `min > max` wraps across midnight. Day and fame thresholds must be finite and non-negative.

Dialogue and choices contain display copy and ordered follow-up steps. State changes belong in declarative effect steps:

```ts
{
  type: 'effect',
  effects: [
    { type: 'receiveGold', amount: 1000 },
    { type: 'addCompanion', characterId: characterId('rocco') },
    { type: 'completeEvent', eventId: storyEventId('joao.example-chapter.departure') },
    { type: 'save' },
  ],
}
```

The runtime preflights an effect group before applying it and coalesces redundant save intent. Use the existing effect vocabulary; adding a new effect requires core validation, interpreter, runtime adapter, and state-transition tests.

## Priority and random groups

Lower numeric priority resolves first. Event ID is the deterministic tie-breaker. Two candidates whose indexed scenes overlap may not share a priority unless they are members of the same non-empty `randomGroup`.

Priority accepts finite nonnegative numbers, including fractions. M3 uses unique values below 1 to supersede eligible legacy repeatable scenes at priorities 1–70: Massawa progression starts at 0.100, finale progression at 0.200, Massawa advice/retries at 0.300, and finale advice/retries at 0.400. Check actual eligible fallback scenes before choosing a new range; merely choosing a unique number above an old fallback does not make the new scene reachable. Use explicit progress exclusions instead of changing unrelated legacy scenes.

For `repeat: 'random-ambient'`, give every member of one candidate set the same `randomGroup`, priority, and scene conditions. Do not sample in content. The resolver receives the selector, which keeps production random and tests deterministic. Members of one random group must not use different priorities.

## Validation and reports

Run these before review:

```bash
npm run story:validate
npm run story:report
```

Validation aggregates errors instead of stopping at the first one. Every diagnostic contains a code, owner when available, and an exact field path such as `events[3].steps[1].speaker`. Repair the field at that path; do not suppress the validator. Typical messages cover duplicate IDs, missing references, arc ownership, empty dialogue/choices/effects, invalid numeric bounds, priority conflicts, reciprocal conflicts, and missing or duplicate Save v2 keys.

The report prints registered counts, entry and terminal events, cross-arc dependencies, unreferenced characters and relationships, and legacy-key coverage. Entry/terminal topology and cross-arc dependencies use positive `eventCompleted` and calendar-condition event references; a negated reference is not a prerequisite, while a double negation is. `crossArcDependencies` contains sorted public arc IDs whose events are prerequisites. `npm run verify` runs asset checks, then story validation, before the complete Jest/type/lint/build gate. The project-owned `baseline.yml` workflow invokes `verify:full`, so it inherits this check.

## Required tests

- Add focused validator, registry, resolver, effect, and session tests for new vocabulary or behavior.
- For a migrated legacy event, add resolver parity across gating states, transcript parity for dialogue and every choice branch, and state-transition parity for ordered effects and final state.
- Test random ambient candidate sets, not a nondeterministic sampled result.
- For persisted behavior, test both directions of the Save v2 adapter and preservation of unknown legacy quest keys.
- Keep content reports JSON-serializable so CI and future tooling can consume them.

The Lisbon examples are in `src/story/lisbonResolver.parity.test.ts`, `src/story/lisbonTranscript.parity.test.ts`, `src/story/lisbonEffects.parity.test.ts`, and `src/story/saveV2Compatibility.test.ts`.

## StoryHooks and lore links

`src/data/storyHooks.ts` is the canonical shared lore schema for protagonist, faction, dark-line, trigger, reward, and cross-link metadata. It is data-only and is not wired into the running story resolver. Keep lore provenance in the relevant `docs/3-narrative/` source and use stable public IDs in `crossLinks`. Do not duplicate lore prose into runtime triggers or pretend a `StoryHooks` link executes an event. Connecting the schemas requires a separate design change.

## Persistence and presentation

The current save format is v7. `state.storyEvents` persists completed semantic event IDs; `state.quests` preserves the original Lisbon keys. Completing a registered event writes its semantic ID once and also writes its legacy key where mapped. The independent migrated-event inventory requires every migrated once-only event to retain its mapping. New chapters use semantic IDs without adding legacy keys. Unknown semantic IDs and legacy keys survive save/load.

The v4→v5 migration maps known Lisbon keys to semantic IDs and marks existing discoveries as reported because v4 already paid their gold. New discoveries grant fame when sighted and gold only through `reportDiscoveries()` at Lisbon Guild. `reportedDiscoveries` prevents a second payout, including after reload. Do not bump `SAVE_VERSION` or add persistent fields in an authoring-only change.

The v5→v6 migration adds equipment, battle experience, durable combat results,
and resumable combat snapshots. See the [current persistence contract](../4-engineering/save-load-persistence.md).
Story completion and combat completion are different records: completing a
start event does not imply that the player won its encounter.

The v6→v7 migration adds `storyEventTimes`, storing each event’s first completion in game minutes. Missing or invalid clocks for completed events are conservatively anchored to the loaded save’s valid current time, or zero. Valid unknown timestamp IDs survive; no new completion markers are inferred. `completeEvent` preserves a valid first stamp across repeats and load.

Use `calendarMonthsAfterEvent { eventId, minMonths, minDay }` for a later-month/day gate and `calendarDaysAfterEvent { eventId, minDays }` for crossed calendar dates. Both require a completed reference with a valid clock no later than now. A month gate compares year/month indices and also requires the current day to reach `minDay`, including in subsequent months. Share `getCalendarParts` with the HUD and guide text; do not turn a date-boundary rule into an elapsed 24-hour timer. Clock references participate in validation and dependency/cycle reporting. `withinWorldArea { minX, maxX, minY, maxY }` checks inclusive nonwrapping bounds against the player fleet position; pair it with an explicit world-stage condition for sea encounters.

`consumeItem { itemId }` removes one owned copy. Effect preflight simulates ordered receives/consumes, so a missing item or duplicate overconsumption rejects the whole group before rewards or markers change. Consuming the last equipped copy clears its slot. Put consumption, reward and completion in the same group; protected quest items also need item metadata plus action/UI sale guards.

Use `{ type: 'daysAtSea', min: 3 }` for consecutive sailing days; elapsed calendar days are a different condition. `{ type: 'hasDiscovery', discoveryId }` and `{ type: 'hasReportedDiscovery', discoveryId }` reference the registered discovery catalog. Sea scenes resolve through the subscribed controller before simulation advances. Active dialogues and sidebar overlays pause simulation, and successful loads discard transient cursors.

Put completion, recruitment and reward in one terminal effect group. Reloading an unfinished dialogue restarts that unpaid conversation; reloading a committed event cannot repeat its rewards. Offers that may be refused should remain retryable via a visible action. A terminal effect never assumes it can refresh the current building UI: the Guild explicitly re-resolves after reports and exposes Job Assignment for subsequent available events.

Names, translated body text, dialogue color, portrait, title, speaker position, fade hints, and the active session cursor are presentation/runtime fields rather than Save v2 story progress. Stable IDs and legacy completion mappings are compatibility contracts even when they are not stored as new fields.

## 中文内容与后续扩充

按 D16，新章节与中文文本一起交付。沿用以上稳定 ID 和显式注册方式；角色姓名、港口译名和章节标题不能充当进度键。

- 通用界面文案放在 `src/localization/ui.ts`，专名放在 `terms.ts`，章节对白分别放在 `src/localization/dialogue/` 下，由 `dialogue.ts` 汇总。英文剧情仍是现有运行时的原始文本，显示时才翻译。
- 使用准确的原文键及命名参数；保持 `$firstName`、`$lastName` 等占位符。玩家自定船名原样显示，不能经过专名翻译。相同原文不能在不同词典中对应冲突译文；将共用选择词统一为通用界面文案。
- 新增第二个对白章节时，先通过能检测冲突的合并器逐章汇总，再交给顶层词典。不能先用多个对象展开合并章节：那会在检查前丢失重复原文。需要时将合并器独立到无环依赖模块，并加入跨章节冲突回归。现有里斯本和首次航海词典通过无环模块 `localization/catalogs.ts` 的 `mergeCatalogs` 逐章合并。
- 为每章检查正文、提示和每个选择分支的翻译覆盖，以及参数完整性。结构校验通过后仍需人工审校中文，检查人物称谓、线索、金额、时段和实际对话框排版。
- 新剧情状态必须经过存档迁移，并验证旧存档进入新章、章节中途读取、奖励只领取一次。新章节写入 `storyEvents`，不能通过添加里斯本旧任务键绕过语义进度。
- 新增触发类型需要同时实现条件、校验、运行时入口和测试。海上事件还需要暂停移动、维持单个对话会话、处理结束与拒绝；只注册事件数据不足以让它在海上运行。
- 新伙伴或船型要检查船员面板、头像、舰队容量和所有引用；新名声门槛要核算现有内容实际可获得的收入。每章都要有可到达的入口、可完成的出口和失败/拒绝后的继续路径。

M0 建立中文显示边界；M1 将首次航海、工会委托、发现上报和多明戈加入连成一章。后续沿这个边界增加完整主线、其他主角和扩展支线。具体顺序见[路线图](../roadmap.md)。

## Content safety boundary

Story content is TypeScript data, but it must remain declarative. Never put a function callback in a step, choice, condition, or effect. Content modules must not import global state, mutable actions, save functions, UI stores, or runtime services. The interpreter receives explicit operations at the runtime boundary; tests supply an in-memory runtime.

## First-voyage chapter layout

The registered first-voyage chapter is organized as:

```text
src/story/content/
├── characters/
│   └── domingo.ts
├── relationships/
│   └── joao-first-voyage.ts
└── arcs/
    └── joao/
        └── first-voyage/
            ├── dialogue.ts
            ├── events.ts
            └── index.ts
```

These modules are explicitly registered in `src/story/content/index.ts`. The commission reward is original project balance (500g); the Gibraltar sighting grants 30 adventure fame and reporting grants 300g. Domingo’s later identity reveal and conflict belong to M2.

## Combat and companion departure

Use the encounter catalog's stable IDs when starting a battle. The event marker
and battle snapshot belong in the same effect group:

```ts
{
  type: 'effect',
  effects: [
    {
      type: 'completeEvent',
      eventId: storyEventId('joao.conflict-and-growth.kahn-house-start'),
    },
    { type: 'startCombat', encounterId: 'joao.m2.kahn-house' },
  ],
}
```

`startCombat` must be the group's last non-save effect. Content validation and
runtime preflight both enforce this. The runtime checks the whole group before
changing state, calls the non-saving combat entry point, then saves once. No
content callback, UI mutation, or manually inserted victory belongs here.

Resume later scenes using the actual confirmed result:

```ts
{
  type: 'combatResolved',
  encounterId: 'joao.m2.kahn-house',
  outcomes: ['victory', 'defeat'],
}
```

A house-duel draw needs its rematch scene. For Katarina, successful `retreat`
and `victory` open the next story step; `defeat` opens recovery/retry. Conditions
must not treat all recorded outcomes as success. Scene remount after result
confirmation re-resolves these conditions; ordinary combat actions do not
advance the story cursor.

Use `{ type: 'receiveFame', fame: 'adventure', amount: 1000 }` for a validated
non-negative fame reward, with its one-time completion marker in the same
terminal group. Guard already-owned story gifts in the event graph when a gift
should not duplicate; `receiveItem` itself also serves ordinary item acquisition.

`{ type: 'removeCompanion', characterId: characterId('domingo') }` uses the
canonical character ID. The runtime plans departure before applying it and
retains the fleet. An existing free companion takes over the departing captain's
ship; otherwise the registered project-original `m2-relief-captain` is created.
The protagonist cannot be removed. Test both role replacement paths, four-ship
ownership, save/load, and valid captain selectors when adding departure content.

New story-only characters may omit `sailorId`, `portraitId`, and
`legacyCharacterId`. Supply canonical names and a dialogue color. The shared
portrait renderer uses a neutral initials placeholder; never guess original
sprite IDs. A real companion still requires a registered sailor profile.
