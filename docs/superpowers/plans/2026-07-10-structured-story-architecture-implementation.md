# Structured Story Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a typed, validated story runtime and prove it by migrating the complete existing João Lisbon opening without changing player-visible behavior or Save v2 compatibility.

**Architecture:** Story content is organized by arc and compiled through one explicit registry into immutable lookup indexes. A pure resolver chooses events, a session projects steps into the existing MessageBox UI, and a declarative effect interpreter updates the existing state/action boundary; legacy completion keys remain isolated behind a Save v2 adapter until a separately designed Save v3.

**Tech Stack:** TypeScript 4.8, React 18, Jest 29 with jsdom and SWC, Webpack 5, Cypress 10 / Chrome, existing npm scripts and project-owned GitHub Actions workflow.

## Global Constraints

- Execute in a worktree created with `superpowers:using-git-worktrees`, branched from design commit `87c31ea7829f5a51a7c6da2ea0307f322875534f` or a descendant.
- Preserve the user's untracked `docs/Chatlog copy.rtf`; never stage, modify, move, copy, or delete it.
- Do not add npm dependencies, JSON/YAML content loaders, a database, a CMS, or an external editor.
- Keep `SAVE_VERSION = 2`; `state.quests` remains the persisted completion-key array.
- Do not add Domingo, Catalina, Massawa, Zipangu, final-conspiracy, or any other new story content.
- Do not add dynamic affinity, relationship scores, a relationship state machine, or multi-protagonist selection.
- Do not redesign the MessageBox UI or change dialogue copy, speaker positions, trigger order, choices, rewards, fades, exits, or existing side-effect timing.
- Resolver, transcript, and final-state parity are authoritative. If migration exposes an existing gameplay bug, including `assignFirstRoles()` behavior, do not fix it inside this plan; preserve the characterized result and open a separate bugfix design.
- Story content must be TypeScript data and must not contain arbitrary function callbacks or import mutable global state.
- Development, Jest, `npm run story:validate`, `npm run verify`, and CI fail on invalid content; production excludes invalid events and emits diagnostics without crashing.
- Use explicit registration only; do not add filesystem auto-discovery.
- Keep `.github/workflows/baseline.yml` as the only workflow and extend only its existing `npm run verify:full` path through npm scripts.
- Follow TDD for every behavior change: focused RED, minimal GREEN, focused/full verification, then commit.
- Existing non-fatal Browserslist, Webpack performance, Cypress `term-size`, `tsconfig-paths`, and Node deprecation notices remain warnings, not reasons to modify dependencies.

---

## File Map

### New core runtime

- `src/story/core/types.ts`: branded IDs, characters, relationships, arcs, events, conditions, steps, choices, effects, diagnostics, and compiled-content interfaces.
- `src/story/core/registry.ts`: explicit compilation, immutable indexes, reciprocal relationship materialization, and production filtering.
- `src/story/core/validator.ts`: aggregated content diagnostics and strict assertion entry point.
- `src/story/core/resolver.ts`: context construction, pure condition evaluation, deterministic priority/tie-breaking, and injected random selection.
- `src/story/core/effects.ts`: effect preflight and execution through injected operations.
- `src/story/core/runtime.ts`: story-session cursor, choice handling, effect progression, and UI-facing frame projection.
- `src/story/index.ts`: application-facing compiled content, resolver, and runtime exports.

### New content

- `src/story/content/characters/*.ts`: canonical Lisbon-opening story identities.
- `src/story/content/characters/index.ts`: explicit character list.
- `src/story/content/relationships/joao-lisbon.ts`: static directed relationship definitions.
- `src/story/content/relationships/index.ts`: explicit relationship list.
- `src/story/content/arcs/joao/lisbon-opening/dialogue.ts`: migrated dialogue and choices, with no callbacks.
- `src/story/content/arcs/joao/lisbon-opening/events.ts`: semantic events, priorities, triggers, repeat policy, and legacy completion keys.
- `src/story/content/arcs/joao/lisbon-opening/index.ts`: arc assembly.
- `src/story/content/index.ts`: explicit global content registration.
- `src/story/legacy/lisbonCompletionKeys.ts`: semantic event ↔ Save v2 completion-key mapping only.

### New tools and docs

- `scripts/story-content.js`: Node entry for validation and reports using the compiled TypeScript/Jest-compatible manifest described in Task 9.
- `docs/story/authoring-guide.md`: author rules and examples.
- `tests/e2e/storyArchitecture.cy.ts`: new-game and Save v2 continuation acceptance.
- `docs/superpowers/verification/2026-07-10-structured-story-architecture-verification.md`: durable final evidence.

### Existing files migrated or adapted

- `src/data/characterData.ts`: temporary compatibility adapter, then generated from canonical characters.
- `src/data/sailorData.ts`: retains sailor stats; links remain through `sailorId`.
- `src/interface/quest/getAvailableQuest.ts`: shadow comparison, then new resolver delegation.
- `src/interface/quest/getMessageBoxes.ts`: accepts story frames without mutating source dialogue.
- `src/interface/quest/useQuestStep.ts`: becomes a thin `StorySession` React adapter.
- `src/interface/quest/questData.ts`: temporary re-export during migration, then deleted.
- `src/interface/quest/questEvents.ts`: legacy shadow reference during parity, then deleted.
- `src/state/actionsPort.ts`: exports an idempotent legacy-completion helper and remains the production effect operation boundary.
- `src/state/state.ts`: updates the completion-key type import only; serialized shape is unchanged.
- `package.json`: adds `story:validate`, `story:report`, and includes validation in `verify`.
- `docs/README.md`, `docs/roadmap.md`, and `docs/DECISIONS.md`: record the completed architecture without claiming new story content.

---

### Task 1: Core Story Contracts and Stable IDs

**Files:**

- Create: `src/story/core/types.ts`
- Create: `src/story/core/types.test.ts`

**Interfaces:**

- Produces: branded `CharacterId`, `RelationshipId`, `StoryArcId`, `StoryEventId`, and `LegacyQuestId` constructors.
- Produces: `StoryCharacter`, `CharacterRelationship`, `StoryArc`, `StoryEvent`, `StoryCondition`, `StoryStep`, `StoryChoice`, `StoryEffect`, `StoryContext`, `StoryDiagnostic`, `StoryContentSource`, and `CompiledStoryContent`.
- Preserves: current `Stage`, `Role`, `FameType`, and `ItemId` types through type-only imports.

- [ ] **Step 1: Write the failing contract smoke test**

Create `src/story/core/types.test.ts`:

```ts
import {
  characterId,
  legacyQuestId,
  relationshipId,
  storyArcId,
  storyEventId,
} from './types';

describe('story identifiers', () => {
  test('retain stable serialized string values', () => {
    expect(characterId('joao')).toBe('joao');
    expect(relationshipId('joao.rocco.mentor')).toBe('joao.rocco.mentor');
    expect(storyArcId('joao.lisbon-opening')).toBe('joao.lisbon-opening');
    expect(storyEventId('joao.lisbon-opening.house-introduction')).toBe(
      'joao.lisbon-opening.house-introduction',
    );
    expect(legacyQuestId('houseBeforeQuest')).toBe('houseBeforeQuest');
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npx jest src/story/core/types.test.ts --runInBand
```

Expected: FAIL because `src/story/core/types.ts` does not exist.

- [ ] **Step 3: Implement the complete contracts**

Create `src/story/core/types.ts` with these public shapes:

```ts
import type { ItemId } from '../../data/itemData';
import type { Role, Stage, FameType } from '../../state/state';

declare const storyIdBrand: unique symbol;
type StoryId<Kind extends string> = string & {
  readonly [storyIdBrand]: Kind;
};

export type CharacterId = StoryId<'character'>;
export type RelationshipId = StoryId<'relationship'>;
export type StoryArcId = StoryId<'arc'>;
export type StoryEventId = StoryId<'event'>;
export type LegacyQuestId = StoryId<'legacy-quest'>;

const id = <Kind extends string>(value: string): StoryId<Kind> =>
  value as StoryId<Kind>;

export const characterId = (value: string): CharacterId => id(value);
export const relationshipId = (value: string): RelationshipId => id(value);
export const storyArcId = (value: string): StoryArcId => id(value);
export const storyEventId = (value: string): StoryEventId => id(value);
export const legacyQuestId = (value: string): LegacyQuestId => id(value);

export type RelationshipType =
  | 'parent'
  | 'child'
  | 'spouse'
  | 'mentor'
  | 'student'
  | 'companion'
  | 'friend'
  | 'acquaintance'
  | 'rival'
  | 'enemy'
  | 'employer'
  | 'employee';

export interface StoryCharacter {
  id: CharacterId;
  names: { en: string; zh?: string; ja?: string };
  role: 'protagonist' | 'companion' | 'family' | 'npc' | 'antagonist';
  portraitId?: string;
  dialogueStyle: { color: string };
  sailorId?: string;
  legacyCharacterId?: string;
}

export interface CharacterRelationship {
  id: RelationshipId;
  from: CharacterId;
  to: CharacterId;
  type: RelationshipType;
  reciprocal?: RelationshipType;
  description?: string;
  sourceArc?: StoryArcId;
}

export type StoryCondition =
  | { type: 'all'; conditions: StoryCondition[] }
  | { type: 'any'; conditions: StoryCondition[] }
  | { type: 'not'; condition: StoryCondition }
  | { type: 'eventCompleted'; eventId: StoryEventId }
  | { type: 'atPort'; portId: string }
  | { type: 'atBuilding'; buildingId: string }
  | { type: 'stage'; stage: Stage }
  | { type: 'timeWindow'; min: number; max: number }
  | { type: 'daysElapsed'; min?: number; max?: number }
  | { type: 'fameAtLeast'; fame: FameType; value: number }
  | { type: 'hasItem'; itemId: ItemId }
  | { type: 'hasCompanion'; characterId: CharacterId };

export type StoryEffect =
  | { type: 'completeEvent'; eventId: StoryEventId }
  | { type: 'receiveGold'; amount: number }
  | { type: 'receiveItem'; itemId: ItemId }
  | { type: 'receiveShip'; shipId: string; name: string }
  | { type: 'addCompanion'; characterId: CharacterId }
  | { type: 'assignMate'; characterId: CharacterId; role: Role }
  | { type: 'exitBuilding' }
  | { type: 'setPort'; portId: string | null }
  | { type: 'save' };

export interface DialogueStep {
  type: 'dialogue';
  body: string;
  position: 0 | 1 | 2;
  speaker?: CharacterId;
  fadeBeforeNext?: true;
}

export interface EffectStep {
  type: 'effect';
  effects: StoryEffect[];
}

export interface StoryChoice {
  id: string;
  label: string;
  steps: StoryStep[];
}

export interface ChoiceStep {
  type: 'choice';
  prompt: string;
  options: StoryChoice[];
}

export type StoryStep = DialogueStep | EffectStep | ChoiceStep;

export interface StoryEvent {
  id: StoryEventId;
  arcId: StoryArcId;
  priority: number;
  trigger: StoryCondition;
  repeat: 'once' | 'repeatable' | 'random-ambient';
  steps: StoryStep[];
  legacyCompletionKey?: LegacyQuestId;
  randomGroup?: string;
}

export interface StoryArc {
  id: StoryArcId;
  protagonist: CharacterId;
  title: string;
  eventIds: StoryEventId[];
}

export interface StoryContext {
  stage: Stage;
  portId: string | null;
  buildingId: string | null;
  timePassed: number;
  completedEvents: ReadonlySet<StoryEventId>;
  fame: Record<FameType, number>;
  items: ReadonlySet<ItemId>;
  companions: ReadonlySet<CharacterId>;
}

export interface StoryContentSource {
  characters: StoryCharacter[];
  relationships: CharacterRelationship[];
  arcs: StoryArc[];
  events: StoryEvent[];
}

export interface StoryDiagnostic {
  severity: 'error' | 'warning';
  code: string;
  owner?: string;
  path: string;
  message: string;
}

export interface CompiledStoryContent {
  charactersById: ReadonlyMap<CharacterId, StoryCharacter>;
  relationshipsByCharacter: ReadonlyMap<
    CharacterId,
    readonly CharacterRelationship[]
  >;
  arcsById: ReadonlyMap<StoryArcId, StoryArc>;
  eventsById: ReadonlyMap<StoryEventId, StoryEvent>;
  candidatesByScene: ReadonlyMap<string, readonly StoryEvent[]>;
  eventByLegacyCompletionKey: ReadonlyMap<LegacyQuestId, StoryEventId>;
  legacyCompletionKeyByEvent: ReadonlyMap<StoryEventId, LegacyQuestId>;
  diagnostics: readonly StoryDiagnostic[];
}
```

- [ ] **Step 4: Run focused and type checks**

```bash
npx jest src/story/core/types.test.ts --runInBand
npm run typecheck
```

Expected: 1 focused suite PASS and TypeScript exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/story/core/types.ts src/story/core/types.test.ts
git diff --cached --check
git commit -m "feat: define structured story contracts"
```

---

### Task 2: Content Registry, Relationships, and Validation

**Files:**

- Create: `src/story/core/registry.ts`
- Create: `src/story/core/registry.test.ts`
- Create: `src/story/core/validator.ts`
- Create: `src/story/core/validator.test.ts`

**Interfaces:**

- Consumes: all contracts from Task 1.
- Produces: `validateStoryContent(source): StoryDiagnostic[]`.
- Produces: `assertValidStoryContent(source): void`.
- Produces: `compileStoryContent(source, mode): CompiledStoryContent`, where mode is `'strict' | 'production'`.
- Produces: `sceneKey(stage, portId, buildingId): string`.

- [ ] **Step 1: Write failing registry tests**

Create `src/story/core/registry.test.ts` with a fixture containing João, Rocco, one mentor relationship with `student` reciprocal, one arc, and one once-only event. Assert:

```ts
const compiled = compileStoryContent(validSource, 'strict');

expect(compiled.charactersById.get(characterId('joao'))?.names.en).toBe('João');
expect(
  compiled.relationshipsByCharacter
    .get(characterId('rocco'))
    ?.map(({ type, to }) => [type, to]),
).toContainEqual(['mentor', characterId('joao')]);
expect(
  compiled.relationshipsByCharacter
    .get(characterId('joao'))
    ?.map(({ type, to }) => [type, to]),
).toContainEqual(['student', characterId('rocco')]);
expect(compiled.eventsById.size).toBe(1);
expect(compiled.diagnostics).toEqual([]);
```

Also assert that production mode excludes an invalid event while preserving a valid event, and strict mode throws the aggregated diagnostics.

- [ ] **Step 2: Write failing validator matrix**

Create table-driven cases in `src/story/core/validator.test.ts` for these codes:

```ts
const expectedCodes = [
  'duplicate-character',
  'duplicate-relationship',
  'duplicate-arc',
  'duplicate-event',
  'missing-relationship-character',
  'missing-arc-protagonist',
  'missing-arc-event',
  'event-arc-mismatch',
  'missing-dialogue-speaker',
  'empty-dialogue',
  'empty-choice',
  'empty-effects',
  'invalid-time-window',
  'invalid-days-range',
  'invalid-fame-value',
  'once-without-legacy-key',
  'duplicate-legacy-key',
  'conflicting-reciprocal',
  'priority-conflict',
] as const;
```

Each case builds one invalid fixture and expects its exact code and field path. Add one test proving all independent diagnostics are returned together.

- [ ] **Step 3: Verify RED**

```bash
npx jest src/story/core/registry.test.ts src/story/core/validator.test.ts --runInBand
```

Expected: FAIL because registry and validator modules do not exist.

- [ ] **Step 4: Implement validation and compilation**

Implement `sceneKey()` as a stable three-field key:

```ts
export const sceneKey = (
  stage: Stage,
  portId: string | null,
  buildingId: string | null,
): string => `${stage}:${portId ?? '-'}:${buildingId ?? '-'}`;
```

Use small validation visitors for character references, event references, conditions, steps, choices, and effects. `assertValidStoryContent()` must format all errors in one thrown message. `compileStoryContent()` must:

1. Validate before indexing.
2. Throw in strict mode when any error exists.
3. In production mode, exclude events named by event-owned error diagnostics.
4. Materialize reciprocal relationship edges without mutating source arrays.
5. Build immutable-by-contract Maps and frozen candidate arrays.
6. Index candidate scenes from every `atPort`, `atBuilding`, and `stage` predicate found inside an `all` tree; events lacking one of those predicates use the `-` wildcard slot.
7. Build both legacy completion maps.

The `priority-conflict` validator excludes events that intentionally share the same non-empty `randomGroup`; those candidates must share priority so the injected selector receives the whole group.

- [ ] **Step 5: Run focused and full non-browser checks**

```bash
npx jest src/story/core/registry.test.ts src/story/core/validator.test.ts --runInBand
npm test -- --runInBand
npm run typecheck
npm run lint
```

Expected: registry/validator suites and all existing suites PASS; TypeScript and ESLint exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/story/core/registry.ts src/story/core/registry.test.ts src/story/core/validator.ts src/story/core/validator.test.ts
git diff --cached --check
git commit -m "feat: compile and validate story content"
```

---

### Task 3: Pure Conditions, Resolver, and Save v2 Completion Adapter

**Files:**

- Create: `src/story/core/resolver.ts`
- Create: `src/story/core/resolver.test.ts`
- Create: `src/story/legacy/lisbonCompletionKeys.ts`
- Create: `src/story/legacy/lisbonCompletionKeys.test.ts`

**Interfaces:**

- Produces: `conditionSatisfied(condition, context): boolean`.
- Produces: `resolveStoryEvent(context, content, chooseRandom): StoryEvent | null`.
- Produces: `createStoryContext(state, content): StoryContext`.
- Produces: `getCompletedStoryEvents(legacyKeys, content): Set<StoryEventId>`.
- Produces: `getLegacyCompletionKey(eventId, content): LegacyQuestId | null`.

- [ ] **Step 1: Write failing condition boundary tests**

Cover all variants with exact boundaries:

```ts
expect(
  conditionSatisfied({ type: 'timeWindow', min: 1320, max: 0 }, at(1320)),
).toBe(true);
expect(
  conditionSatisfied({ type: 'timeWindow', min: 1320, max: 0 }, at(0)),
).toBe(true);
expect(
  conditionSatisfied({ type: 'timeWindow', min: 1320, max: 0 }, at(600)),
).toBe(false);
expect(conditionSatisfied({ type: 'daysElapsed', min: 3 }, at(3 * 1440))).toBe(
  true,
);
expect(
  conditionSatisfied(
    { type: 'fameAtLeast', fame: 'adventure', value: 1000 },
    famous(999),
  ),
).toBe(false);
```

Add `all`, `any`, `not`, event completion, port, building, stage, item, and companion cases.

- [ ] **Step 2: Write failing resolver ordering tests**

Assert:

- Unmatched scenes return `null`.
- Lower numeric priority wins.
- Event ID is the stable tie-breaker.
- Completed once-only events are excluded.
- Repeatable events remain eligible.
- A `random-ambient` group passes the stable candidate array to injected `chooseRandom`.
- Resolver does not mutate context or compiled content.

- [ ] **Step 3: Write failing completion adapter tests**

Build a compiled fixture with semantic ID `joao.lisbon-opening.house-introduction` mapped to `houseBeforeQuest`. Assert recognized legacy keys become completed semantic IDs, unknown keys are ignored by resolution, and reverse lookup returns the exact legacy key.

- [ ] **Step 4: Verify RED**

```bash
npx jest src/story/core/resolver.test.ts src/story/legacy/lisbonCompletionKeys.test.ts --runInBand
```

Expected: FAIL because both modules are missing.

- [ ] **Step 5: Implement pure evaluation and resolution**

Normalize time with:

```ts
const minutesToday = ((context.timePassed % 1440) + 1440) % 1440;
```

Use exclusive `max` for ordinary windows and inclusive midnight for `max === 0`, preserving the current 22:00–00:00 Lisbon rule. Resolver candidate collection must combine the exact scene key and wildcard candidates, de-duplicate by event ID, filter conditions, then sort.

`createStoryContext()` derives:

- stage from `buildingId`, `portId`, and the current application convention;
- completed semantic events through the compiled legacy map;
- item IDs from `state.items`;
- companions by mapping `state.mates[].sailorId` through canonical character `sailorId` links;
- fame and time directly from State.

- [ ] **Step 6: Run focused and full checks**

```bash
npx jest src/story/core/resolver.test.ts src/story/legacy/lisbonCompletionKeys.test.ts --runInBand
npm test -- --runInBand
npm run typecheck
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/story/core/resolver.ts src/story/core/resolver.test.ts src/story/legacy/lisbonCompletionKeys.ts src/story/legacy/lisbonCompletionKeys.test.ts
git diff --cached --check
git commit -m "feat: resolve typed story events"
```

---

### Task 4: Declarative Effect Interpreter

**Files:**

- Create: `src/story/core/effects.ts`
- Create: `src/story/core/effects.test.ts`
- Modify: `src/state/actionsPort.ts`
- Modify: `src/state/actionsPort.test.ts`

**Interfaces:**

- Produces: `StoryEffectRuntime` with preflight and operation methods.
- Produces: `preflightStoryEffects(effects, runtime): StoryDiagnostic[]`.
- Produces: `executeStoryEffects(effects, runtime): StoryEffectExecution`.
- Produces: `completeLegacyQuestOnce(id): void` in `actionsPort.ts`.
- Guarantees: invalid groups perform no mutation; valid groups save at most once.

- [ ] **Step 1: Write failing in-memory interpreter tests**

Use a fake runtime that records operations. Cover every effect, exact order, and these invariants:

```ts
expect(executeStoryEffects(validEffects, runtime)).toEqual({
  ok: true,
  executed: validEffects.length,
});
expect(runtime.operations).toEqual([
  ['receiveGold', 1000],
  ['receiveItem', '4'],
  ['completeEvent', eventId],
  ['save'],
]);
```

Add a group containing an invalid companion or ship reference and assert `operations` remains empty. Add redundant explicit save effects and assert one save operation.

- [ ] **Step 2: Write failing idempotent completion test**

Extend `src/state/actionsPort.test.ts`:

```ts
completeLegacyQuestOnce('houseBeforeQuest');
completeLegacyQuestOnce('houseBeforeQuest');

expect(state.quests).toEqual(['houseBeforeQuest']);
```

This removes the current possibility of duplicate completion markers while preserving the serialized value.

- [ ] **Step 3: Verify RED**

```bash
npx jest src/story/core/effects.test.ts src/state/actionsPort.test.ts --runInBand
```

Expected: FAIL because the interpreter and idempotent action do not exist.

- [ ] **Step 4: Implement preflight and execution**

Define runtime operations without exposing State to content:

```ts
export interface StoryEffectRuntime {
  canExecute(effect: StoryEffect): StoryDiagnostic[];
  completeEvent(eventId: StoryEventId): void;
  receiveGold(amount: number): void;
  receiveItem(itemId: ItemId): void;
  receiveShip(shipId: string, name: string): void;
  addCompanion(characterId: CharacterId): void;
  assignMate(characterId: CharacterId, role: Role): void;
  exitBuilding(): void;
  setPort(portId: string | null): void;
  save(): void;
}
```

Preflight all effects first. Execute non-save effects in source order. Treat any mutating effect or `completeEvent` as persistence-requiring, and call `runtime.save()` once after the group. An `exitBuilding` that already persists through the existing action adapter must be wired through a non-saving primitive or the production adapter must mark persistence handled; tests must prove one storage write for each migrated step.

- [ ] **Step 5: Implement idempotent completion**

Add:

```ts
export const completeLegacyQuestOnce = (id: QuestId) => {
  if (!state.quests.includes(id)) {
    state.quests.push(id);
  }
};
```

Keep the existing `completeQuest()` export until runtime cutover; do not alter current callers in this task.

- [ ] **Step 6: Run focused and full checks**

```bash
npx jest src/story/core/effects.test.ts src/state/actionsPort.test.ts --runInBand
npm test -- --runInBand
npm run typecheck
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/story/core/effects.ts src/story/core/effects.test.ts src/state/actionsPort.ts src/state/actionsPort.test.ts
git diff --cached --check
git commit -m "feat: execute declarative story effects"
```

---

### Task 5: Story Session and MessageBox Projection

**Files:**

- Create: `src/story/core/runtime.ts`
- Create: `src/story/core/runtime.test.ts`
- Modify: `src/interface/quest/getMessageBoxes.ts`
- Modify: `src/interface/quest/getMessageBoxes.test.ts`

**Interfaces:**

- Produces: `StorySession { eventId, steps, stepIndex }`.
- Produces: `createStorySession(event): StorySession`.
- Produces: `getStoryFrame(session): StoryFrame | null`.
- Produces: `advanceStorySession(session, choiceId?): StoryAdvanceResult`.
- Produces: `getMessageBoxesFromFrame(history, frame): MessageBoxes`.

- [ ] **Step 1: Write failing pure-session tests**

Cover:

- Dialogue advances one step without mutation.
- Effect steps are returned for orchestration and then skipped after successful execution.
- Choice cannot advance without a valid option ID.
- Yes/no branches expand to their own immutable steps.
- Fade metadata survives projection.
- End of steps returns a completed result.

Use the harbor-final shape to prove the yes branch includes `assignMate` effects and both branches include `completeEvent`.

- [ ] **Step 2: Write failing immutable projection tests**

Current `getMessageBoxes()` mutates `message.body`. Replace the test expectation with a frozen dialogue fixture and prove `$firstName` / `$lastName` interpolation does not modify source content:

```ts
const frozen = Object.freeze({
  type: 'dialogue' as const,
  body: 'Hello, $firstName $lastName!',
  position: 2 as const,
  speaker: characterId('joao'),
});

expect(getMessageBoxesFromFrame([], frozen)[2]).toMatchObject({
  body: 'Hello, João Franco!',
});
expect(frozen.body).toBe('Hello, $firstName $lastName!');
```

- [ ] **Step 3: Verify RED**

```bash
npx jest src/story/core/runtime.test.ts src/interface/quest/getMessageBoxes.test.ts --runInBand
```

Expected: FAIL because session and frame projection APIs are missing.

- [ ] **Step 4: Implement immutable session operations**

Use copy-on-advance arrays and objects. `StoryFrame` contains only UI data and metadata required by the React hook:

```ts
export type StoryFrame =
  | DialogueStep
  | {
      type: 'choice';
      prompt: string;
      options: Array<{ id: string; label: string }>;
    }
  | EffectStep;
```

Keep the legacy `getMessageBoxes(messages, step)` export temporarily as a wrapper for old tests and runtime. Add the new projection export beside it. Do not switch `useQuestStep()` yet.

- [ ] **Step 5: Run focused/full checks**

```bash
npx jest src/story/core/runtime.test.ts src/interface/quest/getMessageBoxes.test.ts --runInBand
npm test -- --runInBand
npm run typecheck
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/story/core/runtime.ts src/story/core/runtime.test.ts src/interface/quest/getMessageBoxes.ts src/interface/quest/getMessageBoxes.test.ts
git diff --cached --check
git commit -m "feat: add story sessions and frames"
```

---

### Task 6: Canonical Lisbon Characters and Static Relationships

**Files:**

- Create: `src/story/content/characters/joao.ts`
- Create: `src/story/content/characters/duke-franco.ts`
- Create: `src/story/content/characters/duchess-christiana.ts`
- Create: `src/story/content/characters/butler-marco.ts`
- Create: `src/story/content/characters/rocco.ts`
- Create: `src/story/content/characters/enrico.ts`
- Create: `src/story/content/characters/carlotta.ts`
- Create: `src/story/content/characters/lucia.ts`
- Create: `src/story/content/characters/index.ts`
- Create: `src/story/content/relationships/joao-lisbon.ts`
- Create: `src/story/content/relationships/index.ts`
- Create: `src/story/content/characters/characters.test.ts`
- Modify: `src/data/characterData.ts`

**Interfaces:**

- Produces: `storyCharacters: StoryCharacter[]`.
- Produces: `storyRelationships: CharacterRelationship[]`.
- Preserves: legacy character IDs `1`, `7`, `19`, `20`, `32`, `33`, `98`, and `99` and existing display colors/names.
- Preserves: sailor IDs and all sailor stats.

- [ ] **Step 1: Write failing canonical registry tests**

Assert the exact legacy mappings and sailor links:

```ts
expect(byId('joao')).toMatchObject({
  names: { en: 'João' },
  role: 'protagonist',
  sailorId: '1',
  legacyCharacterId: '1',
});
expect(byId('rocco')).toMatchObject({
  sailorId: '32',
  legacyCharacterId: '32',
});
expect(byId('enrico')).toMatchObject({
  sailorId: '33',
  legacyCharacterId: '33',
});
expect(new Set(storyCharacters.map(({ id }) => id)).size).toBe(8);
```

Assert all approved parent/child, mentor/student, companion, and acquaintance edges appear after compilation, with no conflicting reverse declarations.

- [ ] **Step 2: Verify RED**

```bash
npx jest src/story/content/characters/characters.test.ts --runInBand
```

Expected: FAIL because canonical content does not exist.

- [ ] **Step 3: Create exact character records**

Move the existing English names and Tailwind color classes without copy changes. Add João/Rocco/Enrico sailor links. Use `role: 'family'` for Duke Franco and Duchess Christiana, `companion` for Rocco and Enrico, and `npc` for Butler Marco, Carlotta, and Lucia.

- [ ] **Step 4: Create exact relationship definitions**

Declare:

```ts
export const joaoLisbonRelationships: CharacterRelationship[] = [
  relationship(
    'joao.duke-franco.parent',
    'duke-franco',
    'joao',
    'parent',
    'child',
  ),
  relationship(
    'joao.duchess-christiana.parent',
    'duchess-christiana',
    'joao',
    'parent',
    'child',
  ),
  relationship('joao.rocco.mentor', 'rocco', 'joao', 'mentor', 'student'),
  relationship(
    'joao.rocco.companion',
    'rocco',
    'joao',
    'companion',
    'companion',
  ),
  relationship(
    'joao.enrico.companion',
    'enrico',
    'joao',
    'companion',
    'companion',
  ),
  relationship(
    'joao.carlotta.acquaintance',
    'carlotta',
    'joao',
    'acquaintance',
    'acquaintance',
  ),
  relationship(
    'joao.lucia.acquaintance',
    'lucia',
    'joao',
    'acquaintance',
    'acquaintance',
  ),
];
```

The local `relationship()` factory converts strings to branded IDs and prevents accidental argument reordering.

- [ ] **Step 5: Adapt legacy character lookup without behavior change**

Generate `characterData` from canonical records that have `legacyCharacterId`, preserving its current exported shape. The canonical `StoryCharacter.sailorId` field is the only story-to-sailor link in this phase; do not modify `sailorData.ts`, its stats, skills, or the `getSailor(id)` API.

- [ ] **Step 6: Run focused/full checks**

```bash
npx jest src/story/content/characters/characters.test.ts src/interface/quest/getMessageBoxes.test.ts --runInBand
npm test -- --runInBand
npm run typecheck
npm run lint
```

Expected: all commands exit 0 and legacy dialogue rendering tests retain the same character IDs/colors.

- [ ] **Step 7: Commit**

```bash
git add src/story/content/characters src/story/content/relationships src/data/characterData.ts
git diff --cached --check
git commit -m "feat: structure story characters and relationships"
```

---

### Task 7: Migrate the João Lisbon Arc as Declarative Content

**Files:**

- Create: `src/story/content/arcs/joao/lisbon-opening/dialogue.ts`
- Create: `src/story/content/arcs/joao/lisbon-opening/events.ts`
- Create: `src/story/content/arcs/joao/lisbon-opening/index.ts`
- Create: `src/story/content/arcs/joao/lisbon-opening/lisbonOpening.test.ts`
- Create: `src/story/__fixtures__/legacyLisbonSnapshot.ts`
- Create: `src/story/content/index.ts`
- Create: `src/story/index.ts`
- Modify: `src/interface/quest/questData.ts`
- Modify: `src/interface/quest/questEvents.ts`

**Interfaces:**

- Produces: `joaoLisbonOpening: { arc, events }`.
- Produces: `storyContentSource` and strict `compiledStoryContent`.
- Preserves: every legacy quest key, transcript, trigger result, random candidate set, choice branch, and action effect.
- Transitional: legacy files remain authoritative and importable for parity until Task 8 cutover.

- [ ] **Step 1: Relocate legacy source without semantic changes**

Use `git mv` so text history remains traceable:

```bash
mkdir -p src/story/content/arcs/joao/lisbon-opening
git mv src/interface/quest/questData.ts src/story/content/arcs/joao/lisbon-opening/dialogue.ts
git mv src/interface/quest/questEvents.ts src/story/content/arcs/joao/lisbon-opening/events.ts
```

Immediately recreate temporary compatibility files at the old paths:

```ts
// src/interface/quest/questData.ts
export * from '../../story/content/arcs/joao/lisbon-opening/dialogue';
export { default } from '../../story/content/arcs/joao/lisbon-opening/dialogue';
```

```ts
// src/interface/quest/questEvents.ts
export * from '../../story/content/arcs/joao/lisbon-opening/events';
```

Fix relocated relative imports only. Run the existing parity suite and full Jest before transforming content; both must remain green.

Before transforming either relocated module, create `src/story/__fixtures__/legacyLisbonSnapshot.ts` as a test-only immutable oracle containing:

- the normalized transcript of every legacy key listed in Step 2, including positions, legacy speaker IDs, fades, completion, exits, and both `harborFinal` branches;
- the ordered legacy rule table with building, `blockedBy`, `requires`, time window, and random candidate sets;
- the expected legacy state-operation manifest for each callback position.

Build the snapshot directly from the still-unmodified relocated exports in a one-time focused test, paste the printed TypeScript literal into the fixture with `apply_patch`, then disable output and assert the live legacy normalization equals the committed snapshot. The fixture must export data only, import no state action, and contain no callback.

- [ ] **Step 2: Write the failing migrated-content tests**

The new test must enumerate every current key:

```ts
const legacyKeys = [
  'houseBeforeQuest',
  'houseAfterQuest',
  'houseAfterQuestAndPub',
  'houseAfterQuestAndPub2',
  'pubBeforeQuest',
  'pubBeforeQuest2',
  'pubAfterQuest',
  'pubAfterQuest2',
  'lodgeBankGuildBeforeQuestRandom1',
  'lodgeBankGuildBeforeQuestRandom2',
  'lodgeBankGuildBeforeQuestRandom3',
  'lodgeBankGuildAfterQuestRandom1',
  'lodgeBankGuildAfterQuestRandom2',
  'lodgeBankGuildAfterQuestRandom3',
  'palaceBeforeQuest',
  'palaceAfterQuest',
  'itemShopBeforeQuest',
  'itemShopAfterQuest',
  'itemShopAfterQuest2',
  'shipyardBeforeQuest',
  'shipyardAfterQuest',
  'churchBeforeQuest',
  'churchBeforeQuest2',
  'churchAfterQuest',
  'churchAfterEnrico',
  'churchAfterEnricoAfterGift',
  'harborBeforeQuest',
  'harborBeforeShip',
  'harborBeforeEnrico',
  'harborAfterEnrico',
  'harborAfterEnrico2',
  'harborAfterEnricoBeforeMother',
  'harborFinal',
  'marketBeforeQuest',
  'marketAfterQuestBeforeShip',
  'pubCarlottaGreeting',
] as const;
```

Use this exact semantic mapping; it is the only mapping accepted by the legacy adapter and validator:

```ts
export const legacyToSemanticEvent = {
  houseBeforeQuest: 'joao.lisbon-opening.house-introduction',
  houseAfterQuest: 'joao.lisbon-opening.house-guard-after-introduction',
  houseAfterQuestAndPub: 'joao.lisbon-opening.house-mother-farewell',
  houseAfterQuestAndPub2: 'joao.lisbon-opening.house-guard-after-farewell',
  pubBeforeQuest: 'joao.lisbon-opening.pub-before-introduction',
  pubBeforeQuest2: 'joao.lisbon-opening.pub-before-departure',
  pubAfterQuest: 'joao.lisbon-opening.pub-farewell',
  pubAfterQuest2: 'joao.lisbon-opening.pub-after-farewell',
  lodgeBankGuildBeforeQuestRandom1: 'joao.lisbon-opening.ambient-before-1',
  lodgeBankGuildBeforeQuestRandom2: 'joao.lisbon-opening.ambient-before-2',
  lodgeBankGuildBeforeQuestRandom3: 'joao.lisbon-opening.ambient-before-3',
  lodgeBankGuildAfterQuestRandom1: 'joao.lisbon-opening.ambient-after-1',
  lodgeBankGuildAfterQuestRandom2: 'joao.lisbon-opening.ambient-after-2',
  lodgeBankGuildAfterQuestRandom3: 'joao.lisbon-opening.ambient-after-3',
  palaceBeforeQuest: 'joao.lisbon-opening.palace-before-introduction',
  palaceAfterQuest: 'joao.lisbon-opening.palace-after-introduction',
  itemShopBeforeQuest: 'joao.lisbon-opening.item-shop-before-introduction',
  itemShopAfterQuest: 'joao.lisbon-opening.item-shop-rapier',
  itemShopAfterQuest2: 'joao.lisbon-opening.item-shop-after-rapier',
  shipyardBeforeQuest: 'joao.lisbon-opening.shipyard-before-introduction',
  shipyardAfterQuest: 'joao.lisbon-opening.shipyard-hermes-ii',
  churchBeforeQuest: 'joao.lisbon-opening.church-before-introduction',
  churchBeforeQuest2: 'joao.lisbon-opening.church-before-departure',
  churchAfterQuest: 'joao.lisbon-opening.church-recruit-enrico',
  churchAfterEnrico: 'joao.lisbon-opening.church-enrico-gift',
  churchAfterEnricoAfterGift: 'joao.lisbon-opening.church-after-gift',
  harborBeforeQuest: 'joao.lisbon-opening.harbor-before-introduction',
  harborBeforeShip: 'joao.lisbon-opening.harbor-before-ship',
  harborBeforeEnrico: 'joao.lisbon-opening.harbor-before-enrico',
  harborAfterEnrico: 'joao.lisbon-opening.harbor-enrico-arrival',
  harborAfterEnrico2: 'joao.lisbon-opening.harbor-after-enrico-arrival',
  harborAfterEnricoBeforeMother:
    'joao.lisbon-opening.harbor-before-mother-farewell',
  harborFinal: 'joao.lisbon-opening.harbor-final',
  marketBeforeQuest: 'joao.lisbon-opening.market-before-introduction',
  marketAfterQuestBeforeShip: 'joao.lisbon-opening.market-before-ship',
  pubCarlottaGreeting: 'joao.lisbon-opening.pub-carlotta-greeting',
} as const;
```

Assert each key has exactly one semantic mapping, each once-only event has one legacy completion key, all dialogue speakers resolve, all source text appears byte-for-byte after normalizing only the legacy `$firstName`/`$lastName` tokens, and no step contains a function.

- [ ] **Step 3: Verify RED**

```bash
npx jest src/story/content/arcs/joao/lisbon-opening/lisbonOpening.test.ts --runInBand
```

Expected: FAIL because the relocated modules still export legacy `Message[]` and rules.

- [ ] **Step 4: Convert dialogue arrays mechanically**

Preserve every body string and convert fields using this exact mapping:

| Legacy field                      | New step                                           |
| --------------------------------- | -------------------------------------------------- |
| `body`, `position`, `characterId` | `dialogue` with canonical `speaker`                |
| `fadeBeforeNext`                  | `dialogue.fadeBeforeNext`                          |
| `completeQuest`                   | following `effect: completeEvent`                  |
| `exitBuilding`                    | following `effect: exitBuilding`                   |
| `action`                          | one of the explicit effect mappings below          |
| `confirm`                         | one `choice` with stable `yes` and `no` option IDs |

Use this complete action/effect manifest:

| Legacy event                           | Declarative effects                                                                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `houseBeforeQuest`                     | add Rocco; complete event; exit building                                                                                                                                       |
| `houseAfterQuestAndPub`                | receive item `53`; complete event; exit building                                                                                                                               |
| `pubAfterQuest`                        | receive 1000 gold at the same step; complete event; exit building                                                                                                              |
| `lodgeBankGuildBeforeQuestRandom1/2/3` | exit only for bank/guild variants; lodge remains open                                                                                                                          |
| `itemShopAfterQuest`                   | receive item `4`; complete event                                                                                                                                               |
| `shipyardAfterQuest`                   | receive ship `6`, name `Hermes II`; complete event; exit building                                                                                                              |
| `churchAfterQuest`                     | complete event; add Enrico at the same terminal step                                                                                                                           |
| `churchAfterEnrico`                    | receive 1000 gold; complete event                                                                                                                                              |
| `harborFinal` yes                      | emit explicit Rocco `firstMate` and Enrico `bookKeeper` intent, but reproduce the characterized legacy final state exactly; append the existing yes transcript; complete event |
| `harborFinal` no                       | append the existing no transcript; complete event                                                                                                                              |

All other `completeQuest`, `exitBuilding`, and `fadeBeforeNext` flags convert directly at their original step boundary. Split shared random greetings into per-building event definitions when an exit effect differs; share immutable dialogue step arrays, not behavior callbacks.

- [ ] **Step 5: Convert the ordered trigger table**

For every legacy rule:

- Add `atPort('1')`, `stage('building')`, and the exact `atBuilding()` predicate.
- Convert `blockedBy` to `not(eventCompleted(...))` for each key.
- Convert `requires` to `eventCompleted(...)`.
- Preserve the 22:00–00:00 time window.
- Assign priority `10`, `20`, `30`, and so on in the current rule order within each building.
- Model the three before/after lodge-bank-guild greetings as `random-ambient` candidates with stable group IDs.
- Map each semantic ID to the exact legacy key listed above.

Do not add live fame/day triggers to this arc; those variants remain core capability tests only.

- [ ] **Step 6: Assemble and strictly compile content**

`src/story/content/index.ts` explicitly combines canonical characters, relationships, the Lisbon arc, and its events. `src/story/index.ts` exports `compiledStoryContent`, created with strict mode in non-production and production mode only when `process.env.NODE_ENV === 'production'`.

- [ ] **Step 7: Run migration checks**

```bash
npx jest src/story/content/arcs/joao/lisbon-opening/lisbonOpening.test.ts --runInBand
npx jest src/interface/quest/getAvailableQuest.parity.test.ts --runInBand
npm test -- --runInBand
npm run typecheck
npm run lint
```

Expected: content, legacy parity, all Jest, TypeScript, and ESLint PASS. The live runtime is still legacy at this commit.

- [ ] **Step 8: Commit**

```bash
git add src/story src/interface/quest/questData.ts src/interface/quest/questEvents.ts
git diff --cached --check
git commit -m "feat: migrate Lisbon opening content"
```

---

### Task 8: Shadow Parity, Runtime Cutover, and Legacy Removal

**Files:**

- Create: `src/story/lisbonResolver.parity.test.ts`
- Create: `src/story/lisbonTranscript.parity.test.ts`
- Create: `src/story/lisbonEffects.parity.test.ts`
- Create: `src/story/saveV2Compatibility.test.ts`
- Create: `src/story/storyRuntimeActions.ts`
- Create: `src/story/storyRuntimeActions.test.ts`
- Delete: `src/interface/quest/getAvailableQuest.ts`
- Modify: `src/interface/quest/useQuestStep.ts`
- Modify: `src/interface/quest/getMessageBoxes.ts`
- Modify: `src/state/state.ts`
- Modify: `src/state/actionsPort.ts`
- Delete: `src/interface/quest/questData.ts`
- Delete: `src/interface/quest/questEvents.ts`
- Delete: `src/interface/quest/getAvailableQuest.parity.test.ts`

**Interfaces:**

- Produces: production `storyRuntimeActions` implementing `StoryEffectRuntime` through existing state actions.
- Changes: application runtime resolves and plays only compiled story content.
- Preserves: Save v2 keys, MessageBox UI, all Lisbon results, and one-save effect groups.

- [ ] **Step 1: Lock the legacy oracle before cutover**

Import the immutable `legacyLisbonSnapshot` created before Task 7 transformed production content. Add an architecture test that walks the production dependency graph from `src/story/index.ts` and asserts no production module imports `src/story/__fixtures__`. Do not regenerate the snapshot from already-migrated content.

- [ ] **Step 2: Write exhaustive resolver parity**

Adapt the existing powerset test to compare the test-only legacy oracle with `resolveStoryEvent()` across:

- all `2^10` gating completion subsets currently used by Lisbon rules;
- building IDs `1` through `11` plus `null`;
- time values `0`, `600`, `1319`, `1320`, and `1439`;
- port `1`, port `2`, and `null`;
- building and world stages;
- random candidate sets rather than random picks.

Expected before cutover: all comparisons PASS.

- [ ] **Step 3: Write transcript and effect parity**

Normalize both representations to:

```ts
interface NormalizedBeat {
  body?: string;
  position?: 0 | 1 | 2;
  legacyCharacterId?: string;
  fade?: boolean;
  effects: Array<{ type: string; payload?: unknown }>;
  choiceOptions?: string[];
}
```

Compare every event and both `harborFinal` branches. Execute each event against identical cloned state fixtures and assert exact `gold`, `items`, `mates`, `fleets`, `quests`, `buildingId`, and save-call counts.

- [ ] **Step 4: Write Save v2 compatibility tests**

Use current Save v2 fixtures for empty, partial, and complete Lisbon progress. Load each fixture, create a story context, resolve the next event, complete one event, save again, and assert:

- `version` remains `2`;
- legacy quest strings remain unchanged;
- unknown quest strings are preserved;
- no semantic event ID is serialized;
- next-event behavior matches the legacy oracle.

- [ ] **Step 5: Implement production runtime actions**

Map canonical characters to sailor IDs and declarative effects to the existing state operations. Avoid nested persistence by using non-saving mutation helpers internally, refresh UI once after a successful effect group, and call `save()` once. Preflight ship, item, companion, role, event, and port targets before mutation.

- [ ] **Step 6: Switch the React hook**

`useQuestStep()` must:

1. Resolve once when entering the current building, matching existing behavior.
2. Create an immutable session.
3. Project dialogue/choice frames through `getMessageBoxesFromFrame()`.
4. Execute effect frames through production runtime actions.
5. Preserve fade-before-next behavior.
6. Preserve yes/no labels and branch order.
7. Exit buildings through the existing interface action.
8. Return `null` when no event resolves.

Have `useQuestStep()` call the new resolver directly. Delete `getAvailableQuest.ts` after updating its only production caller; the new exhaustive story parity suite replaces the old parity test.

- [ ] **Step 7: Remove legacy production paths**

Delete old re-export shims and legacy `Message.action()` types. Update State to type `quests` with the legacy completion-key string union exported by the compatibility adapter while preserving its runtime array values and serialized shape.

Run:

```bash
rg -n "Message\.action|action\?: \(\) => void|questData|questEvents" src --glob '!**/__fixtures__/**'
```

Expected: no production legacy runtime references.

- [ ] **Step 8: Run the complete non-browser gate**

```bash
npx jest src/story/lisbonResolver.parity.test.ts src/story/lisbonTranscript.parity.test.ts src/story/lisbonEffects.parity.test.ts src/story/saveV2Compatibility.test.ts --runInBand
npm run verify
```

Expected: exhaustive parity and the complete asset/Jest/type/lint/build gate PASS. Only recorded existing build warnings may remain.

- [ ] **Step 9: Commit**

```bash
git add src/story src/interface/quest src/state/state.ts src/state/actionsPort.ts
git diff --cached --check
git commit -m "refactor: run Lisbon story through structured engine"
```

---

### Task 9: Authoring Commands, Documentation, and CI Integration

**Files:**

- Create: `src/story/contentManifest.ts`
- Create: `src/story/contentManifest.test.ts`
- Create: `scripts/story-content.js`
- Create: `docs/story/authoring-guide.md`
- Modify: `package.json`
- Modify: `docs/DECISIONS.md`

**Interfaces:**

- Produces: `getStoryValidationReport()` and `getStoryContentReport()` as JSON-serializable results.
- Produces: `npm run story:validate` and `npm run story:report`.
- Changes: `npm run verify` invokes `story:validate` before Jest.

- [ ] **Step 1: Write failing report tests**

Assert the report includes exact counts derived from compiled content, entry/terminal events for `joao.lisbon-opening`, unreferenced characters/relationships, cross-arc dependencies, and complete legacy-key coverage. Assert invalid injected content produces nonzero error count and field paths.

- [ ] **Step 2: Verify RED**

```bash
npx jest src/story/contentManifest.test.ts --runInBand
```

Expected: FAIL because manifest functions do not exist.

- [ ] **Step 3: Implement manifest and dependency-free CLI**

Because Node cannot import TypeScript directly and no dependency may be added, make `scripts/story-content.js` invoke Jest for validation/report modes through `child_process.spawnSync`:

```js
const { spawnSync } = require('child_process');

const mode = process.argv[2];
const testName =
  mode === 'report' ? 'prints story content report' : 'validates story content';
const result = spawnSync(
  process.execPath,
  [
    require.resolve('jest/bin/jest'),
    'src/story/contentManifest.test.ts',
    '--runInBand',
    '-t',
    testName,
  ],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);
```

The report test prints the stable human-readable report when `STORY_REPORT=1`; ordinary full Jest does not emit it.

Add scripts:

```json
"story:validate": "node scripts/story-content.js validate",
"story:report": "STORY_REPORT=1 node scripts/story-content.js report"
```

Change `verify` to begin with `npm run verify:assets && npm run story:validate` before full Jest. Do not edit `.github/workflows/baseline.yml`; it already runs `verify:full` and will inherit validation.

- [ ] **Step 4: Write the authoring guide**

Document exact ID rules, directory ownership, character/relationship factories, arc registration, condition/effect examples, priority rules, random groups, validation messages, parity/state tests, StoryHooks/lore links, persisted versus presentation fields, and the prohibition on callbacks/global imports.

Include a complete non-running Domingo directory example but no Domingo dialogue or live registration.

- [ ] **Step 5: Record the decision**

Add a dated decision to `docs/DECISIONS.md`: arc modules + explicit compiler, TypeScript content, static relationship graph, declarative effects, shadow parity, Save v2 adapter, and no new content in the architecture slice.

- [ ] **Step 6: Run tool and full checks**

```bash
npm run story:validate
npm run story:report
npm run verify
find .github/workflows -maxdepth 1 -type f -print | sort
```

Expected: validation, report, and full non-browser gate PASS; workflow inventory prints only `.github/workflows/baseline.yml`.

- [ ] **Step 7: Commit**

```bash
git add src/story/contentManifest.ts src/story/contentManifest.test.ts scripts/story-content.js docs/story/authoring-guide.md package.json docs/DECISIONS.md
git diff --cached --check
git commit -m "docs: add structured story authoring workflow"
```

---

### Task 10: Browser Acceptance, Status Sync, and Durable Evidence

**Files:**

- Create: `tests/e2e/storyArchitecture.cy.ts`
- Create: `docs/superpowers/verification/2026-07-10-structured-story-architecture-verification.md`
- Modify: `docs/README.md`
- Modify: `docs/roadmap.md`

**Interfaces:**

- Proves: new-game opening, partial Save v2 continuation, terminal harbor state, persistence, and runtime cutover through production assets.
- Documents: actual final counts and warnings without claiming new post-Lisbon story.

- [ ] **Step 1: Confirm the existing stable selectors**

Run:

```bash
rg -n "vendorMessageBox|characterMessageBox|confirmYes|confirmNo|data-test=building" src/interface tests/utils.ts
```

Expected: existing selectors are present in `VendorMessageBox.tsx`, `CharacterMessageBox.tsx`, `Confirm.tsx`, and `BuildingWrapper.tsx`, with helpers in `tests/utils.ts`. Add no new production selector in this task.

- [ ] **Step 2: Write the production browser scenarios**

Create `tests/e2e/storyArchitecture.cy.ts` with three scenarios:

1. New Save v2 state at `portId: '1'`, `buildingId: '8'` reaches the exact opening line `Father, did you send for me?` through the structured runtime.
2. A partial Save v2 fixture containing selected legacy completion keys resolves the exact expected next Lisbon event, completes it, reloads, and does not repeat it.
3. A fixture immediately before `harborFinal` exercises both choice branches in isolated tests, asserting mate roles equal the legacy characterization, the legacy `harborFinal` completion key, unchanged `version: 2`, and no semantic event ID in localStorage.

Use observable DOM/localStorage assertions only; no fixed waits.

- [ ] **Step 3: Run focused Chrome acceptance**

```bash
npm run build
npx start-server-and-test serve:build http://127.0.0.1:8080 \
  "cypress run --browser chrome --spec tests/e2e/storyArchitecture.cy.ts"
```

Expected: all new scenarios PASS and the server exits.

- [ ] **Step 4: Synchronize status docs**

Update the status panel and roadmap to state that the structured story architecture and behavior-preserving Lisbon migration are implemented. Explicitly retain Domingo and the full João route as pending. Link the verification record from the status row.

- [ ] **Step 5: Run a clean full gate and collect evidence**

```bash
rm -rf build
npm run verify:full
lsof -nP -iTCP:8080 -sTCP:LISTEN
find .github/workflows -maxdepth 1 -type f -print | sort
git status --short
git diff --check
git rev-parse HEAD
git lfs version
```

Expected: story validation, assets, all Jest, TypeScript, ESLint, Webpack, and every Chrome spec PASS; no 8080 listener; only `baseline.yml`; only the verification record and the untouched main-workspace Chatlog are untracked before staging.

- [ ] **Step 6: Write the verification record from actual output**

Record:

- Design and execution date.
- Verified pre-evidence SHA and branch.
- Story character/relationship/arc/event counts from `story:report`.
- Validator result and production-fallback focused test.
- Resolver, transcript, effects, session, Save v2, and UI suite counts.
- Full Jest, TypeScript, ESLint, asset, Webpack, Chrome/spec/test counts and warnings.
- Exact new browser scenarios.
- `SAVE_VERSION = 2` and legacy-key persistence evidence.
- No listener on 8080 and only `baseline.yml`.
- Untouched Chatlog status.
- All non-goals, especially no new post-Lisbon content.

Do not claim the future evidence commit SHA in the evidence file.

- [ ] **Step 7: Format and commit**

```bash
npx prettier --write docs/README.md docs/roadmap.md docs/superpowers/verification/2026-07-10-structured-story-architecture-verification.md
git add tests/e2e/storyArchitecture.cy.ts docs/README.md docs/roadmap.md docs/superpowers/verification/2026-07-10-structured-story-architecture-verification.md
git diff --cached --check
git commit -m "test: verify structured story architecture"
```

- [ ] **Step 8: Re-run the full gate on the evidence commit**

```bash
npm run verify:full
lsof -nP -iTCP:8080 -sTCP:LISTEN
git status --short
git log --oneline --decorate -15
```

Expected: full gate PASS; no port listener; only the untouched Chatlog remains untracked in the main workspace; focused Task 1–10 commits follow the approved design and plan.

---

## Final Review Gate

After Task 10:

1. Create an exact review package from the plan commit's parent/base through feature HEAD.
2. Request a fresh independent branch review against the approved design and this plan.
3. Fix every Critical and Important finding and re-review the exact follow-up range.
4. Record Minor findings in the execution ledger; fix low-risk test/documentation gaps before handoff when practical.
5. Run `npm run verify:full` personally from a clean build output.
6. Confirm port 8080 is unused, the feature worktree is clean, only `baseline.yml` exists, Save remains v2, and the user's Chatlog is untouched.
7. Use `superpowers:finishing-a-development-branch` to offer merge, PR, keep, or discard options.
