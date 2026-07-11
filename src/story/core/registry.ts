import type { Stage } from '../../state/state';
import { formatStoryDiagnostics, validateStoryContent } from './validator';
import type {
  CharacterId,
  CharacterRelationship,
  CompiledStoryContent,
  LegacyQuestId,
  StoryCondition,
  StoryContentSource,
  StoryEvent,
  StoryEventId,
} from './types';

export const sceneKey = (
  stage: Stage,
  portId: string | null,
  buildingId: string | null,
): string => `${stage}:${portId ?? '-'}:${buildingId ?? '-'}`;

const eventSceneKeys = (condition: StoryCondition): readonly string[] => {
  const stages = new Set<string>();
  const ports = new Set<string>();
  const buildings = new Set<string>();

  const collect = (candidate: StoryCondition): void => {
    if (candidate.type === 'all') {
      candidate.conditions.forEach(collect);
    } else if (candidate.type === 'stage') {
      stages.add(candidate.stage);
    } else if (candidate.type === 'atPort') {
      ports.add(candidate.portId);
    } else if (candidate.type === 'atBuilding') {
      buildings.add(candidate.buildingId);
    }
  };
  collect(condition);

  const stageSlots = stages.size > 0 ? [...stages] : ['-'];
  const portSlots = ports.size > 0 ? [...ports] : ['-'];
  const buildingSlots = buildings.size > 0 ? [...buildings] : ['-'];
  return stageSlots.flatMap((stage) =>
    portSlots.flatMap((port) =>
      buildingSlots.map((building) => `${stage}:${port}:${building}`),
    ),
  );
};

const indexRelationships = (
  source: StoryContentSource,
): ReadonlyMap<CharacterId, readonly CharacterRelationship[]> => {
  const relationshipsByCharacter = new Map<
    CharacterId,
    CharacterRelationship[]
  >();
  const append = (relationship: CharacterRelationship): void => {
    const relationships = relationshipsByCharacter.get(relationship.from) ?? [];
    relationships.push(relationship);
    relationshipsByCharacter.set(relationship.from, relationships);
  };

  source.relationships.forEach((relationship) => {
    append(relationship);
    if (relationship.reciprocal === undefined) return;
    const hasExplicitReciprocal = source.relationships.some(
      (candidate) =>
        candidate.from === relationship.to &&
        candidate.to === relationship.from &&
        candidate.type === relationship.reciprocal,
    );
    if (!hasExplicitReciprocal) {
      append({
        ...relationship,
        from: relationship.to,
        to: relationship.from,
        type: relationship.reciprocal,
        reciprocal: relationship.type,
      });
    }
  });

  return new Map(
    [...relationshipsByCharacter].map(([character, relationships]) => [
      character,
      Object.freeze([...relationships]),
    ]),
  );
};

const indexCandidates = (
  events: readonly StoryEvent[],
): ReadonlyMap<string, readonly StoryEvent[]> => {
  const mutableCandidates = new Map<string, StoryEvent[]>();
  events.forEach((event) => {
    eventSceneKeys(event.trigger).forEach((key) => {
      const candidates = mutableCandidates.get(key) ?? [];
      candidates.push(event);
      mutableCandidates.set(key, candidates);
    });
  });
  return new Map(
    [...mutableCandidates].map(([key, candidates]) => [
      key,
      Object.freeze([...candidates]),
    ]),
  );
};

export const compileStoryContent = (
  source: StoryContentSource,
  mode: 'strict' | 'production',
): CompiledStoryContent => {
  const diagnostics = validateStoryContent(source);
  const errors = diagnostics.filter(({ severity }) => severity === 'error');
  if (mode === 'strict' && errors.length > 0) {
    throw new Error(formatStoryDiagnostics(errors));
  }

  const invalidEventIds = new Set(
    errors
      .map(({ path }) => /^events\[(\d+)\]/.exec(path))
      .filter((match): match is RegExpExecArray => match !== null)
      .map((match) => source.events[Number(match[1])]?.id)
      .filter((id): id is StoryEventId => id !== undefined),
  );
  const validEvents = source.events.filter(
    ({ id }) => !invalidEventIds.has(id),
  );

  const eventByLegacyCompletionKey = new Map<LegacyQuestId, StoryEventId>();
  const legacyCompletionKeyByEvent = new Map<StoryEventId, LegacyQuestId>();
  validEvents.forEach((event) => {
    if (event.legacyCompletionKey !== undefined) {
      eventByLegacyCompletionKey.set(event.legacyCompletionKey, event.id);
      legacyCompletionKeyByEvent.set(event.id, event.legacyCompletionKey);
    }
  });

  return {
    charactersById: new Map(
      source.characters.map((character) => [character.id, character]),
    ),
    relationshipsByCharacter: indexRelationships(source),
    arcsById: new Map(source.arcs.map((arc) => [arc.id, arc])),
    eventsById: new Map(validEvents.map((event) => [event.id, event])),
    candidatesByScene: indexCandidates(validEvents),
    eventByLegacyCompletionKey,
    legacyCompletionKeyByEvent,
    diagnostics: Object.freeze([...diagnostics]),
  };
};
