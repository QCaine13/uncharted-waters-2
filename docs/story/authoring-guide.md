# Structured Story Authoring Guide

This guide covers the typed story system under `src/story`. The current registered content is the behavior-preserving João Lisbon opening. New chapters, including Domingo's stowaway story, remain out of scope until separately designed and reviewed.

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

Compose triggers from declarative conditions. `all`, `any`, and `not` may nest; leaf conditions cover event completion, port, building, stage, time, elapsed days, fame, items, and companions:

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

For `repeat: 'random-ambient'`, give every member of one candidate set the same `randomGroup`, priority, and scene conditions. Do not sample in content. The resolver receives the selector, which keeps production random and tests deterministic. Members of one random group must not use different priorities.

## Validation and reports

Run these before review:

```bash
npm run story:validate
npm run story:report
```

Validation aggregates errors instead of stopping at the first one. Every diagnostic contains a code, owner when available, and an exact field path such as `events[3].steps[1].speaker`. Repair the field at that path; do not suppress the validator. Typical messages cover duplicate IDs, missing references, arc ownership, empty dialogue/choices/effects, invalid numeric bounds, priority conflicts, reciprocal conflicts, and missing or duplicate Save v2 keys.

The report prints registered counts, entry and terminal events, cross-arc dependencies, unreferenced characters and relationships, and legacy-key coverage. Entry/terminal topology and cross-arc dependencies use positive `eventCompleted` prerequisites; a negated completion gate is not a prerequisite, while a double negation is. `crossArcDependencies` contains sorted public arc IDs whose events are prerequisites. `npm run verify` runs asset checks, then story validation, before the complete Jest/type/lint/build gate. The project-owned `baseline.yml` workflow invokes `verify:full`, so it inherits this check.

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

Save v2 persists the existing strings in `state.quests`. A migrated once-only event therefore needs exactly one `legacyCompletionKey`; completing the semantic event writes that old key through `src/story/legacy/lisbonCompletionKeys.ts`. Unknown old keys are preserved. Do not bump `SAVE_VERSION`, add story progress fields, or persist relationships in an authoring-only change.

Names, translated body text, dialogue color, portrait, title, speaker position, fade hints, and the active session cursor are presentation/runtime fields rather than Save v2 story progress. Stable IDs and legacy completion mappings are compatibility contracts even when they are not stored as new fields.

## Content safety boundary

Story content is TypeScript data, but it must remain declarative. Never put a function callback in a step, choice, condition, or effect. Content modules must not import global state, mutable actions, save functions, UI stores, or runtime services. The interpreter receives explicit operations at the runtime boundary; tests supply an in-memory runtime.

## Future Domingo layout (non-running example)

The complete expected directory shape for a later Domingo slice is:

```text
src/story/content/
├── characters/
│   └── domingo.ts
├── relationships/
│   └── joao-domingo.ts
└── arcs/
    └── joao/
        └── domingo-stowaway/
            ├── dialogue.ts
            ├── events.ts
            └── index.ts
```

Those files are an ownership example only: they do not exist, contain no dialogue here, and must not be added to `src/story/content/index.ts` until that content has its own approved design, tests, and migration decision.
