# Structured Story Architecture Design

**Design date:** 2026-07-10

**Status:** Approved in conversation; awaiting written-spec review

**Scope:** Runnable story architecture plus a behavior-preserving migration of the existing João Lisbon opening

## 1. Objective

Build a typed, validated, runnable architecture for story content, events, characters, and static character relationships. Prove the architecture by migrating the complete existing João Lisbon opening without changing its dialogue, trigger order, rewards, side effects, save compatibility, or player-visible behavior.

This phase establishes the foundation for later arcs. It does not add the Domingo stowaway arc or any other new story chapter.

## 2. Current Problems

The current implementation spreads one story slice across several unrelated responsibilities:

- `src/interface/quest/questData.ts` combines dialogue presentation, choices, and executable callbacks in a file of more than one thousand lines.
- `src/interface/quest/questEvents.ts` contains an ordered Lisbon-only rule table whose array order is an implicit priority system.
- `src/interface/quest/useQuestStep.ts` owns both scene progression and execution of content-defined functions.
- `src/data/characterData.ts` identifies dialogue speakers with numeric string IDs, while `src/data/sailorData.ts` separately describes the playable sailor form of some of the same people.
- Static relationships such as parent, mentor, and companion are not represented as queryable data.
- `src/data/storyHooks.ts` defines richer future-facing trigger and reward concepts but is not connected to the running game.
- `state.quests` and Save v2 persist legacy completion keys, so a direct ID replacement would break existing saves.

The result is playable for the Lisbon opening but hard to extend safely across sea events, ports, protagonists, companions, items, fame, and later arcs.

## 3. Scope

### 3.1 Included

- Typed TypeScript story content.
- A central explicit registry and compile step.
- Canonical story-character records with links to legacy dialogue IDs and optional sailor records.
- A typed static directed relationship graph.
- Story arcs containing events, dialogue steps, choices, conditions, and declarative effects.
- A pure deterministic event resolver.
- A declarative effect interpreter with an explicit runtime boundary.
- Aggregated development/CI content validation and production-safe exclusion of invalid events.
- A shadow migration of the full existing João Lisbon opening.
- Exhaustive old/new resolver parity, transcript parity, effect/state-transition tests, Save v2 compatibility tests, and browser acceptance coverage.
- Removal of the legacy runtime rule and callback paths after parity is proven.
- Story authoring documentation and `story:validate` / `story:report` commands.

### 3.2 Excluded

- New Domingo, Catalina, Massawa, Zipangu, or final-conspiracy story content.
- Dynamic affinity, relationship scores, or relationship state machines.
- A Save v3 migration or new persisted relationship fields.
- Multi-protagonist selection.
- A dialogue UI redesign.
- An external editor, CMS, JSON, YAML, or database content source.
- New runtime dependencies.
- Unrelated changes to sailing, trading, provisions, combat, exploration, or port systems.

## 4. Chosen Approach

Use **arc modules plus a central registry/compiler**.

Character and relationship identities are globally unique. Dialogue and event logic live with the story arc that owns them. Core runtime modules understand only general story contracts and never import João, Lisbon, or any other concrete content.

This is preferred over character-owned story directories because cross-protagonist events otherwise have ambiguous ownership. It is preferred over fully normalized independent tables because authors should be able to read and review a complete arc without joining many unrelated files mentally.

## 5. Target Structure

```text
src/story/
├── core/
│   ├── types.ts
│   ├── registry.ts
│   ├── validator.ts
│   ├── resolver.ts
│   ├── effects.ts
│   └── runtime.ts
├── content/
│   ├── characters/
│   │   ├── joao.ts
│   │   ├── duke-franco.ts
│   │   ├── duchess-christiana.ts
│   │   ├── rocco.ts
│   │   ├── enrico.ts
│   │   ├── carlotta.ts
│   │   └── lucia.ts
│   ├── relationships/
│   │   └── joao-lisbon.ts
│   └── arcs/
│       └── joao/
│           └── lisbon-opening/
│               ├── dialogue.ts
│               ├── events.ts
│               └── index.ts
├── legacy/
│   └── lisbonCompletionKeys.ts
└── index.ts

docs/story/
└── authoring-guide.md
```

Responsibilities:

- `core/types.ts`: stable IDs and all public story contracts.
- `core/registry.ts`: explicit content registration and compiled lookup indexes.
- `core/validator.ts`: complete content diagnostics.
- `core/resolver.ts`: pure candidate selection and condition evaluation.
- `core/effects.ts`: validate and execute declarative effects through injected runtime operations.
- `core/runtime.ts`: story sessions, step progression, choice handling, and UI-facing view models.
- `content/characters`: canonical story identities and presentation metadata.
- `content/relationships`: global static relationship edges.
- `content/arcs`: independently testable story chapters.
- `legacy`: the isolated Save v2 completion-key compatibility boundary.
- `story/index.ts`: the only story entry point consumed by the application.

No directory auto-discovery is used. All content is imported and registered explicitly so missing registration is visible in review and deterministic across Jest and Webpack.

## 6. Core Data Model

### 6.1 Stable IDs

IDs are semantic, lowercase, and stable after release:

```text
character: joao
relationship: joao.rocco.mentor
arc: joao.lisbon-opening
event: joao.lisbon-opening.house-introduction
```

Display names may change or be translated. Persisted or externally referenced IDs may not be renamed without an explicit migration.

### 6.2 Characters

```ts
interface StoryCharacter {
  id: CharacterId;
  names: {
    en: string;
    zh?: string;
    ja?: string;
  };
  role: 'protagonist' | 'companion' | 'family' | 'npc' | 'antagonist';
  portraitId?: string;
  dialogueStyle: {
    color: string;
  };
  sailorId?: string;
  legacyCharacterId?: string;
}
```

`StoryCharacter` is the canonical narrative identity. Sailor navigation and battle statistics remain in the sailor domain and are linked by `sailorId`. Legacy numeric dialogue IDs remain only as compatibility metadata during migration.

### 6.3 Static Relationships

```ts
type RelationshipType =
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

interface CharacterRelationship {
  id: RelationshipId;
  from: CharacterId;
  to: CharacterId;
  type: RelationshipType;
  reciprocal?: RelationshipType;
  description?: string;
  sourceArc?: StoryArcId;
}
```

Relationships are directed. The compiler materializes the declared reciprocal edge for queries but rejects a conflicting separately declared reverse edge.

The Lisbon opening seeds at least these facts:

- Duke Franco → João: `parent`, reciprocal `child`.
- Duchess Christiana → João: `parent`, reciprocal `child`.
- Rocco → João: `mentor`, reciprocal `student`.
- Rocco ↔ João: `companion`.
- Enrico ↔ João: `companion`.
- Carlotta ↔ João and Lucia ↔ João: `acquaintance`.

No relationship is persisted or mutated in this phase.

### 6.4 Arcs and Events

```ts
interface StoryArc {
  id: StoryArcId;
  protagonist: CharacterId;
  title: string;
  eventIds: StoryEventId[];
}

interface StoryEvent {
  id: StoryEventId;
  arcId: StoryArcId;
  priority: number;
  trigger: StoryCondition;
  repeat: 'once' | 'repeatable' | 'random-ambient';
  steps: StoryStep[];
  legacyCompletionKey?: LegacyQuestId;
}
```

Priority is explicit; lower numeric priority resolves first. Event ID is the stable tie-breaker. `legacyCompletionKey` is allowed only on migrated events and is isolated by the legacy adapter.

`random-ambient` defines the candidate set explicitly. Random selection is injected, so production can use the existing sampler and tests can use a deterministic selector.

### 6.5 Conditions

```ts
type StoryCondition =
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
```

The Lisbon migration uses event completion, port, building, stage, and time-window conditions. The remaining variants establish the already-approved future vocabulary and receive pure tests, but this phase does not author new content that depends on them.

Time windows retain the current semantics: minutes are normalized to `[0, 1440)`, the maximum is exclusive for normal windows, and a minimum greater than the maximum represents a window that wraps across midnight.

### 6.6 Steps, Choices, and Effects

```ts
type StoryStep =
  | {
      type: 'dialogue';
      speaker: CharacterId;
      body: string;
      position?: 'left' | 'right';
    }
  | {
      type: 'choice';
      prompt: string;
      options: StoryChoice[];
    }
  | {
      type: 'effect';
      effects: StoryEffect[];
    };

type StoryEffect =
  | { type: 'completeEvent'; eventId: StoryEventId }
  | { type: 'receiveGold'; amount: number }
  | { type: 'receiveItem'; itemId: ItemId }
  | { type: 'receiveShip'; shipId: string; name: string }
  | { type: 'addCompanion'; characterId: CharacterId }
  | { type: 'assignMate'; characterId: CharacterId; role: Role }
  | { type: 'exitBuilding' }
  | { type: 'setPort'; portId: string | null }
  | { type: 'save' };
```

`StoryChoice` contains display copy and its ordered follow-up steps or effects. Effects may appear between dialogue lines, which preserves the current timing of `Message.action()` behavior without allowing arbitrary functions in content.

An effect group is preflighted before execution. If any member is invalid for the current state, none of the group executes. Successful groups update the interface as required and perform no more than one save, even if compatibility data contains redundant save intent.

## 7. Compilation and Validation

```ts
const compiledStory = compileStoryContent({
  characters,
  relationships,
  arcs: [joaoLisbonOpening],
});
```

Compilation produces immutable indexes:

- `charactersById`
- `relationshipsByCharacter`
- `arcsById`
- `eventsById`
- events indexed by stage, port, and building
- legacy completion key ↔ story event mappings

Validation returns all diagnostics in one pass. Each diagnostic includes severity, content kind, owning arc, ID, field path, and a human-readable repair message.

Errors include:

- Duplicate character, relationship, arc, event, or legacy completion IDs.
- Missing character, relationship, event, item, port, building, ship, or sailor references.
- Arc/event ownership mismatches.
- Dialogue with an unknown speaker or empty body.
- Empty conditions, choices, option sets, effect groups, or arcs.
- Invalid time windows, day ranges, fame values, amounts, roles, or priorities.
- A `once` event without a completion mapping in the Save v2 migration phase.
- Conflicting priorities for candidates in the same indexed scene.
- Conflicting reciprocal relationship definitions.
- Obvious event-dependency cycles and direct logical contradictions.
- Migrated events or legacy keys that are missing from the parity manifest.

Environment behavior:

- Development, tests, `story:validate`, `verify`, and CI call `assertValidStoryContent()` and fail with the aggregated diagnostics.
- Production compilation removes invalid events from candidate indexes, emits structured diagnostics, and continues with valid content.
- Unknown completion keys from an old or unusual Save v2 payload are preserved but ignored by resolution.

## 8. Resolution and Runtime

### 8.1 Pure Resolver

```ts
resolveStoryEvent(
  context: StoryContext,
  content: CompiledStoryContent,
  chooseRandom: RandomSelector,
): StoryEvent | null
```

Resolution order:

1. Select the pre-indexed candidates for the current stage, port, and building.
2. Evaluate the condition tree without mutation.
3. Exclude completed `once` events.
4. Sort by explicit priority, then stable event ID.
5. Return the first deterministic event or select from the explicit `random-ambient` group with the injected selector.

The resolver never reads the global state directly. `createStoryContext(state)` constructs its input.

### 8.2 Story Session and UI Adapter

```text
State
  → createStoryContext
  → resolveStoryEvent
  → StorySession(eventId, stepIndex)
  → MessageBox view model
  → acknowledge / choose
  → effect interpreter
  → state actions, interface refresh, save
```

`StorySession` owns only the active event ID and step cursor. It does not own game state. A rewritten thin `useQuestStep()` adapter keeps the current MessageBox UI contract, including positions, confirmation choices, fades, and building exits. This phase does not redesign the interface.

### 8.3 Effect Runtime Boundary

The interpreter receives explicit operations rather than importing mutable global modules from content:

```ts
interface StoryEffectRuntime {
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

The production adapter delegates to the existing state actions. Tests use an in-memory runtime to verify effect order and resulting state without a UI.

## 9. Save v2 Compatibility

This phase does not change the persisted schema or bump `SAVE_VERSION`.

- `state.quests` remains the persisted array of existing completion keys.
- Each migrated once-only event declares its one `legacyCompletionKey`.
- `createStoryContext()` converts recognized legacy keys into completed semantic event IDs.
- `completeEvent()` writes the corresponding legacy key through the compatibility map.
- Unknown keys remain untouched when the save is loaded and subsequently saved.
- No new event without a legacy completion mapping is authored in this phase.

A future story-progress store and Save v3 migration require their own design and implementation plan. They are not hidden inside this architecture migration.

## 10. Migration Strategy

### 10.1 Foundation

Add the core types, registry, validator, resolver, effect interpreter, and their focused tests. The live game continues to use the legacy system.

### 10.2 Characters and Relationships

Create canonical records for all Lisbon-opening speakers and static relationships. Temporarily generate the legacy dialogue character lookup from the new registry. Keep sailor statistics in their current domain.

### 10.3 Lisbon Arc Migration

Move every current Lisbon quest into `joao/lisbon-opening`, including:

- House, pub, lodge, bank, guild, palace, item-shop, shipyard, church, market, and harbor events.
- Random ambient greetings and their candidate groups.
- All dialogue text, speaker placement, confirmations, fades, and exits.
- Gold, item, companion, first-ship, mate-assignment, completion, and persistence effects.

No copy editing, new dialogue, reward adjustment, or trigger reordering is allowed.

### 10.4 Shadow Parity

The legacy resolver remains authoritative while the new resolver evaluates the same context. Tests and development diagnostics compare results.

Parity covers:

- The full power set of legacy gating completions.
- Every Lisbon building and all non-building states.
- Critical time-window boundaries and normal times.
- Zero and threshold fame/day values.
- At sea, no port, and non-Lisbon ports.
- Random ambient candidate sets rather than nondeterministic samples.
- Full event transcripts and choice branches.
- Effect order and final state for every migrated event.
- Save v2 fixtures representing incomplete, partially complete, and completed openings.

Any mismatch blocks the runtime cutover.

### 10.5 Cutover and Legacy Removal

After parity passes:

- `getAvailableQuest()` delegates to the new story resolver or is removed if no consumer needs it.
- `useQuestStep()` delegates to `StorySession`.
- Runtime rules in `questEvents.ts` are removed.
- The giant `questData.ts` is removed after all content is owned by the arc module.
- Arbitrary `Message.action()` callbacks are removed from the story path.
- Only the isolated Save v2 completion-key adapter remains.

## 11. Content Authoring and Governance

Add these commands:

```bash
npm run story:validate
npm run story:report
```

`story:validate` runs the complete validator and is included in `npm run verify` and the project-owned CI workflow.

`story:report` prints, without generating a committed artifact:

- Character, relationship, arc, and event counts.
- Each arc's entry events, terminal events, and cross-arc dependencies.
- Unreferenced characters and relationships.
- Legacy compatibility coverage for migrated events.

`docs/story/authoring-guide.md` documents:

- Stable ID and directory rules.
- Adding characters and reciprocal relationships.
- Creating an arc, event, dialogue, choice, condition, and effect.
- Priority selection and deterministic random groups.
- State-transition and parity test patterns.
- Linking story content to `StoryHooks` and lore sources.
- Persisted versus presentation-only fields.
- The prohibition on global-state imports and function callbacks in content.

Cross-arc references use public IDs. An arc may not import another arc's internal arrays.

## 12. Testing and Acceptance

### 12.1 Focused Tests

- Registry compilation and immutable indexes.
- Every validator diagnostic category.
- Production exclusion of invalid events without a crash.
- All condition variants and boundary semantics.
- Deterministic priority, tie-breaking, and random-group selection.
- Relationship reciprocal materialization and conflict detection.
- Each effect, effect-group preflight, order, interface refresh, and save count.
- Story-session dialogue, choice, fade, and exit progression.
- Save v2 completion-key round trips and unknown-key preservation.

### 12.2 Parity Tests

- Exhaustive resolver parity with the legacy Lisbon rules.
- Transcript parity for every event and choice branch.
- State-transition parity for rewards and side effects.
- Candidate-set parity for random greetings.

### 12.3 Browser Acceptance

Chrome E2E must prove at least:

- A new game reaches the same opening dialogue.
- The complete Lisbon tutorial can progress through its major rewards and final harbor event.
- A partially completed Save v2 resumes at the same next event before and after cutover.
- The player can leave Lisbon with the same ship, companions, roles, items, gold, and completion state.

### 12.4 Full Gate

The final gate includes:

- Story validation.
- Asset verification.
- All Jest tests.
- TSX-inclusive TypeScript.
- ESLint.
- Production Webpack build.
- All Chrome Cypress specifications.
- No listener left on port 8080.
- Only `.github/workflows/baseline.yml` remains as the project-owned CI workflow.

## 13. Acceptance Criteria

The architecture phase is accepted only when:

- The entire existing João Lisbon opening remains playable from new game to departure.
- Dialogue text, ordering, choices, rewards, state changes, and trigger results match the legacy behavior.
- Existing Save v2 progress resumes without a version bump or data loss.
- Characters, relationships, arcs, events, conditions, dialogue, and effects are typed and independently testable.
- Content contains no arbitrary executable callbacks.
- Invalid references fail development and CI validation, while production excludes invalid events safely.
- A new empty arc module can be registered without changing the resolver, effect interpreter, or UI.
- The legacy runtime rule table and giant dialogue/action data file no longer own live behavior.
- Story authoring and reporting commands are documented and included in verification.
- All repository gates pass with durable verification evidence.

## 14. Future Extension Example

The later Domingo arc should require only content additions unless it introduces a genuinely new condition or effect:

```text
src/story/content/characters/domingo.ts
src/story/content/relationships/joao-domingo.ts
src/story/content/arcs/joao/domingo-stowaway/
├── dialogue.ts
├── events.ts
└── index.ts
```

It then registers the new character, relationship, and arc at the central content entry. The resolver, UI adapter, and existing effect interpreter remain unchanged.
