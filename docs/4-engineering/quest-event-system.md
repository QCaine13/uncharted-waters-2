# Proposal: Event-Driven Quest & Story System

**Status**: Revised — design decisions locked (declarative effects; pure-migration first slice)  
**Author**: Grok (original draft) + revised against current code 2026-06-13  
**Date**: 2026-06-13  

> **Revision note**: Five decisions were locked during review and are now baked into this doc:
> 1. Side effects are **declarative effect descriptions** interpreted by the engine, *not*
>    raw `() => void` callbacks in data (keeps events serializable / editor- and AI-authorable).
> 2. The first slice is a **pure migration** of the existing Joao Lisbon arc — behaviour must
>    be byte-for-byte identical, no new features.
> 3. Time conditions distinguish **time-of-day windows** from **elapsed game-days** (the
>    current code already uses both notions; the data model must too).
> 4. **The condition/effect model converges on the `StoryHooks` schema the user already
>    designed in [`docs/3-narrative/samples/staff-of-the-saint.md`](../3-narrative/samples/staff-of-the-saint.md) §6.**
>    Grok's original draft reinvented a weaker version of a trigger/reward model that already
>    exists, with more maturity, in the lore sample. We adopt the sample's `triggers` /
>    `rewards` / `crossLinks` vocabulary and treat **quest events, legend events, and relic
>    discoveries as three content types served by one trigger engine** (per
>    [`world-overview.md`](../3-narrative/world-overview.md) §4.5.1).
> 5. The data model **reserves a place for conditional text layers** (`rumor` / `record` /
>    `archive`, per the content methodology) from the start, because that content is actively
>    being authored (NotebookLM). Slice 1 does not *implement* layered text — Joao's tutorial
>    is linear dialogue — but the schema must not preclude it.
**Related Docs**:
- `docs/1-baseline/story-outline.md`
- `docs/roadmap.md`
- `docs/1-baseline/systems.md`
- `docs/5-data-governance/`

## 1. Background & Problem

### Current Implementation (as of code review)
- Quest logic lives in two main files:
  - `src/interface/quest/questData.ts`: Hard-coded arrays of `Message` objects (dialog + inline `action`, `completeQuest`, `exitBuilding`, `confirm`, etc.).
  - `src/interface/quest/getAvailableQuest.ts`: ~165 lines of nested `if` / `buildingId` / `finishedQuest` checks. Extremely procedural and Lisbon-centric.
- Story progress is stored as a flat `quests: QuestId[]` array in State.
- Only Joao's opening tutorial arc is implemented (house → pub → shipyard → church → harbor sequence).
- No concept of:
  - Multiple protagonists
  - Fame gates (Adventure / Pirate / Trade)
  - Time windows, companion requirements, or cross-route triggers
  - Data-driven events

### User's Vision (from docs)
From `story-outline.md` and `world-overview.md`:
- 6 interlocking protagonists with shared world events.
- 5-layer escalating conspiracy (L1 surface villain → L5 civilizational truth).
- Events gated by fame, port, elapsed time, companions, items, previous choices.
- Relationship web (亲密度) that can alter other protagonists' story branches.
- "信标会" (Beacon Order) as a cross-cutting L4-L5 organization.

The current code cannot express any of the above without massive if-else growth.

## 2. Goals for This Proposal

- Enable **data-driven story authoring** so that new events from the story bible can be added by editing data files (or a future editor) instead of core logic.
- Support the **small vertical slices** philosophy from `roadmap.md`.
- Provide a clean migration path from the existing hardcoded Joao arc.
- Lay foundation for fame, relationships, and multi-protagonist stories.
- Keep the change small enough to be a "one small step" (1-3 focused sessions).

## 3. Proposed Design

> **Design principle (decision 4)**: we do **not** invent a new condition/effect model. We
> adopt the `StoryHooks` shape already designed and validated in
> [`staff-of-the-saint.md`](../3-narrative/samples/staff-of-the-saint.md) §6, and we treat **quest
> events, legend events, and relic discoveries as three content types served by one trigger
> engine**. The quest engine is just the first consumer of that shared engine.

### 3.1 One engine, three content types

`world-overview.md` §4.5.1 already separates content into three buckets. They are
**structurally identical**: each is *gated content* of the form
**`triggers → text → rewards/effects`**.

| Content type | File | One-time? | Text shape | Drives |
|---|---|---|---|---|
| Quest event  | `questData` → `storyEventData` | yes | linear `Message[]` dialogue | story progression |
| Legend event | `legendData` (new) | **repeatable** | layered (`rumor`/`record`/`archive`) | rumors, atmosphere |
| Relic / discovery | `relicData` (new) | yes | layered (`rumor`/`record`/`archive`) | adventure fame, L4 dark line |

The mistake to avoid is writing `getAvailableQuest`, `getAvailableLegend`,
`getAvailableRelic` as three parallel procedures. Instead: **one `evaluateTriggers(ctx)`
engine**, three data tables, one `applyRewards` interpreter.

### 3.2 Core Concepts

| Concept        | Description                                                          | Current Equivalent     |
|----------------|---------------------------------------------------------------------|------------------------|
| `Trigger`      | One declarative gating condition (shared with `StoryHooks.triggers`) | Hard if-else in `getAvailableQuest` |
| `Reward`/`Effect` | Declarative state change applied on completion (shared with `StoryHooks.rewards`) | inline `() => void` in `Message` |
| `StoryEvent`   | Quest content: `triggers` + linear `messages` + `rewards`            | One `QuestId` array    |
| `QuestLog`     | Completed event IDs (persistence & gating)                          | `state.quests`         |
| `StoryContext` | Runtime context (protagonist, fame, relationships, port, time)     | Scattered in State     |

### 3.3 Shared model — converged on `StoryHooks`

The trigger/reward primitives below are lifted **directly** from the lore sample (§6 of
`staff-of-the-saint.md`), not reinvented. They are the single source of truth that all three
content types share.

```ts
// src/data/storyHooks.ts  — the shared vocabulary (promoted from the lore sample)
export type FameType = 'adventure' | 'pirate' | 'trade';
export type DarkLineLayer = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
export type ProtagonistId = 'joao' | 'catalina' | 'otto' | 'pietro' | 'ernst' | 'ali';

// One gating condition. An event is available when ALL of its triggers match.
// (The sample stored some triggers as strings like "fame.adventure>=1000 AND …";
//  we keep ONLY the structured form — strings are not evaluable.)
export interface Trigger {
  location?: string;                 // portId / region
  buildingId?: string;               // current building (the `buildingId === '8'` branches)
  item?: ItemId;                     // required item held
  companions?: string[];             // required sailorIds
  fame?: { type: FameType; min: number };
  timeOfDay?: { min?: number; max?: number };   // minutes within a day [0,1440); church 22:00–24:00
  daysElapsed?: { min?: number; max?: number };  // whole game-days since start (sample's `daysElapsed`)
  previousEvents?: string[];         // replaces the finishedQuest(...) chains
  blockedByEvents?: string[];        // mutual exclusion
}

// Declarative reward/effect — interpreted by the engine, never a raw function.
// Superset of the sample's `rewards` (fame / unlock) plus the effects the Joao arc needs.
export type Reward =
  | { type: 'fame'; fame: FameType; amount: number }       // sample shape
  | { type: 'unlock'; target: string }                     // sample shape (building/port/archive)
  | { type: 'receiveGold'; amount: number }
  | { type: 'receiveItem'; itemId: ItemId }
  | { type: 'recruitSailor'; sailorId: string }
  | { type: 'exitBuilding' };
// …grow this union only when a concrete event needs a new reward.
```

```ts
// src/interface/quest/storyEventData.ts  (location locked in slice 1 — see data-architecture §5)
import { Trigger, Reward, DarkLineLayer, ProtagonistId } from '../../data/storyHooks';

// Reserve a place for layered text now (decision 5) WITHOUT implementing it in slice 1.
// Quest dialogue is linear; legends/relics will use the layered form. A StoryEvent carries
// exactly one of these.
export type EventText =
  | { kind: 'dialogue'; messages: Message[] }                 // quest — linear, slice 1 uses this
  | { kind: 'layered'; rumor: string; record?: string; archive?: string }; // legend/relic — later

export interface StoryEvent {
  id: string;
  protagonist?: ProtagonistId;       // optional: shared/world events have none
  triggers: Trigger[];               // ALL must match (see §3.4 for the `oneOf` group case)
  text: EventText;
  rewards?: Reward[];                // applied in order on completion
  repeatable?: boolean;              // false = one-time (default); true = legend/rumor
  darkLineLayer?: DarkLineLayer;     // metadata for the 5-layer conspiracy; unused by slice-1 engine
}
```

This structure maps directly onto the fields in `story-outline.md` ("required fame
type/value, port/building, elapsed days, companion/item…") **and** onto the `StoryHooks`
`triggers`/`rewards` already in the lore sample. The `rewards` array replaces the original
`onComplete` / `fameRewards` / `unlocks` fields with one uniform, serializable mechanism that
the relic/legend tables reuse verbatim.

> **Open during migration**: the *existing* `Message` type still carries imperative
> `action?: () => void` / `confirm` callbacks. For the pure-migration slice we keep those
> as-is (behaviour must not change). Converting in-message actions to declarative rewards is
> a *later* slice, not part of slice 1.

### 3.4 Runtime Engine (shared by all three content types)

The engine is **content-type-agnostic**: it evaluates `Trigger[]` against a `StoryContext`
and applies `Reward[]`. `getAvailableQuest` becomes one caller that filters the result to the
current building/port. Legend and relic tables are later callers of the *same* functions.

```ts
// src/data/triggerEngine.ts — shared; knows nothing about quests specifically
import { Trigger, Reward } from './storyHooks';

export function matchesTriggers(triggers: Trigger[], ctx: StoryContext): boolean {
  return triggers.every(t => matchesOne(t, ctx));   // ALL triggers must hold
}

// one place to map each Reward → existing action functions; never a raw callback from data
export function applyReward(reward: Reward): void {
  switch (reward.type) {
    case 'fame':          return grantFame(reward.fame, reward.amount);
    case 'unlock':        return unlock(reward.target);
    case 'receiveGold':   return receiveGold(reward.amount);
    case 'recruitSailor': return recruitSailor(reward.sailorId);
    case 'exitBuilding':  return exitBuildingIfNotLodge();
    // …one case per reward type
  }
}
```

```ts
// src/interface/quest/eventEngine.ts — the quest-specific caller
import { matchesTriggers, applyReward } from '../../data/triggerEngine';
import { storyEvents } from './storyEventData';   // Record<string, StoryEvent>

export function getAvailableStoryEvents(ctx: StoryContext): StoryEvent[] {
  return Object.values(storyEvents)
    .filter(e => e.repeatable || !ctx.completedEvents.includes(e.id))
    .filter(e => matchesTriggers(e.triggers, ctx))
    .sort(byDeterministicOrder);   // stable order; first match wins, mirrors current behaviour
}

export function advanceStory(eventId: string): void {
  const event = storyEvents[eventId];
  if (!event) return;
  for (const reward of event.rewards ?? []) applyReward(reward);
  if (!event.repeatable) state.quests.push(eventId);   // reuse existing completed-events array
  save();
}
```

Crucially, `completedEvents` reuses the **existing `state.quests` array** — no new persisted
field is needed for slice 1, so Save/Load needs no change to migrate the Joao arc.

### 3.5 Migration Path (small slices)

**Slice 1 — PURE MIGRATION, behaviour byte-for-byte identical** (locked scope):
- Extract the current `questData` entries into `StoryEvent`s with `text.kind: 'dialogue'`.
  No new content, no layered text.
- Implement `matchesTriggers` supporting **only the `Trigger` fields already in use today**:
  - `previousEvents` (replaces the `finishedQuest(...)` chains in `getAvailableQuest.ts`),
  - `buildingId` / `location` (the `buildingId === '8'` style branches),
  - `timeOfDay` (the existing `between22and24` church window — already `timePassed % 1440`),
  - the random-pick branches (lodge/bank/guild use `sample([...])`) — model as a small
    `oneOf` group of events rather than inventing a generic system now.
- Leave the other `Trigger` fields (`fame`, `item`, `companions`, `daysElapsed`) **defined but
  unused** — they exist for slices 2-3, the relic table, and the legend table.
- `completedEvents` **reuses `state.quests`** — no Save/Load change, no migration needed.
- Keep `getAvailableQuest` as a thin wrapper that delegates to `getAvailableStoryEvents`
  during transition, then delete it once parity is proven.
- **Acceptance = parity**: a test asserts that for every `(buildingId, completed-quests, time)`
  combination the engine returns the *same* event id the old `getAvailableQuest` returned.
  Cypress + manual Joao playthrough unchanged.
- Do **not** implement fame, multi-protagonist, items, companions, or layered text in this
  slice (those fields are defined in §3.3 for *later* slices).

**Slice 2**: Add `fame` to State (and to Save/Load via the migration step in the persistence
proposal). Activate the `fame` and `daysElapsed` triggers in `matchesTriggers`. Wire the first
"Domingo stowaway" beat from the story outline.

**Slice 3**: Activate `item` / `companions` triggers; convert the first in-`Message` `action`
callback to a declarative `Reward`. Stand up the `legendData` table as the second caller of
the shared engine (first repeatable, layered-text content).

This approach lets the user keep shipping visible story progress while the engine matures, and
each slice brings the engine closer to fully serving the relic/legend content already being
authored.

## 4. Data Management (see companion proposal)

File location and centralized-vs-decentralized strategy are covered in
[`data-architecture.md`](data-architecture.md) and are **not** re-decided here. Summary of
what applies to this engine:

- **Slice 1**: keep story events in one centralized table under `src/interface/quest/`
  (lowest churn, matches where quest data lives today).
- The **shared** `Trigger`/`Reward` vocabulary lives in `src/data/storyHooks.ts` so quest,
  legend, and relic tables all import the same types.
- Promote story data to `src/data/story/{protagonist}/…` only once the engine is decoupled
  from the interface and a 2nd protagonist exists (> ~80 events, or parallel authoring).
- Governance: record the schema + ID convention (`{protagonist}-{seq}-{slug}`, e.g.
  `joao-001-lisbon-departure`) in `docs/5-data-governance/story-events.md`, and align it with
  the `Relic`/`StoryHooks` schema already drafted in the lore sample so the two never diverge.

## 5. Risks & Mitigations

- Risk: Over-engineering the condition system too early.  
  Mitigation: Start with the exact conditions already used in the current Joao arc + the ones explicitly listed for the next 2–3 beats in `story-outline.md`. Add new condition types only when a concrete story requires them.

- Risk: Breaking the existing tutorial flow.  
  Mitigation: Keep the current hardcoded path behind a feature flag or temporary `legacyQuestMode` until the data-driven version passes the same Cypress + manual tests.

- Risk: Performance (if we naively scan hundreds of events every frame).  
  Mitigation: Build an index at load time (by port, by building, by protagonist). The engine only evaluates the relevant subset.

## 6. Success Criteria for the First Slice (pure migration)

- All current Joao Lisbon dialog works **exactly** as before (parity test, see §3.4).
- The old `getAvailableQuest` if-else is gone, replaced by data + engine.
- Adding a *new* event would be possible by editing only the data file + (if needed) one new
  declarative `Reward` case in the interpreter — no change to `getAvailableQuest`-style logic.
- Tests cover the engine: condition matching, deterministic ordering, completion recording.
- Schema + ID convention recorded in `docs/5-data-governance/story-events.md`.
- **Out of scope for this slice**: fame, companions, items, multi-protagonist (deferred to
  slices 2–3 once parity is proven).

## 7. Open Questions / Next Review Items

- ~~One-time vs repeatable events?~~ **Resolved**: `repeatable` flag in the model (default
  one-time). Slice 1 only uses one-time; the `sample([...])` lodge/bank lines become a
  `oneOf` group, which is orthogonal to `repeatable`.
- ~~Raw `onComplete` vs declarative effects?~~ **Resolved**: declarative `Reward[]`
  interpreted by the engine.
- Localization of story text — still open (current messages are English-only with `$firstName`
  style interpolation). Not needed for slice 1.
- Do we need a visual "story progress" indicator in the UI for slice 1? Probably no — parity
  means the player sees no difference.

---

**Recommended first action**: Review this proposal together with `story-outline.md` and the
`StoryHooks` schema in [`staff-of-the-saint.md`](../3-narrative/samples/staff-of-the-saint.md) §6.
Once we confirm the shared `Trigger`/`Reward` shape, I can provide the initial TypeScript
interfaces (`storyHooks.ts` + `storyEventData.ts`) + the migration sketch for the existing
Joao data.

This small step gives you a foundation that makes all the rich storytelling work you've already done actually playable, one event at a time.
