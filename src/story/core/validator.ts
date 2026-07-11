import type {
  StoryCondition,
  StoryContentSource,
  StoryDiagnostic,
  StoryEffect,
  StoryEvent,
  StoryStep,
} from './types';

type AddDiagnostic = (
  code: string,
  path: string,
  message: string,
  owner?: string,
) => void;

const duplicateDiagnostics = <T>(
  values: readonly T[],
  idOf: (value: T) => string,
  collection: string,
  code: string,
  add: AddDiagnostic,
): void => {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    const id = idOf(value);
    if (seen.has(id)) {
      add(
        code,
        `${collection}[${index}].id`,
        `${collection} contains the duplicate id "${id}".`,
        collection === 'events' ? id : undefined,
      );
    }
    seen.add(id);
  });
};

const visitCondition = (
  condition: StoryCondition,
  path: string,
  event: StoryEvent,
  characterIds: ReadonlySet<string>,
  eventIds: ReadonlySet<string>,
  add: AddDiagnostic,
): void => {
  const owner = String(event.id);
  switch (condition.type) {
    case 'all':
    case 'any':
      if (condition.conditions.length === 0) {
        add(
          'empty-condition',
          `${path}.conditions`,
          `${condition.type} conditions must contain at least one condition.`,
          owner,
        );
      }
      condition.conditions.forEach((child, index) =>
        visitCondition(
          child,
          `${path}.conditions[${index}]`,
          event,
          characterIds,
          eventIds,
          add,
        ),
      );
      break;
    case 'not':
      visitCondition(
        condition.condition,
        `${path}.condition`,
        event,
        characterIds,
        eventIds,
        add,
      );
      break;
    case 'eventCompleted':
      if (!eventIds.has(condition.eventId)) {
        add(
          'missing-condition-event',
          `${path}.eventId`,
          `Condition references missing event "${condition.eventId}".`,
          owner,
        );
      }
      break;
    case 'timeWindow':
      if (
        !Number.isFinite(condition.min) ||
        !Number.isFinite(condition.max) ||
        condition.min < 0 ||
        condition.min >= 1440 ||
        condition.max < 0 ||
        condition.max >= 1440
      ) {
        add(
          'invalid-time-window',
          path,
          'Time window bounds must be finite minutes in [0, 1440).',
          owner,
        );
      }
      break;
    case 'daysElapsed':
      if (
        (condition.min !== undefined &&
          (!Number.isFinite(condition.min) || condition.min < 0)) ||
        (condition.max !== undefined &&
          (!Number.isFinite(condition.max) || condition.max < 0)) ||
        (condition.min !== undefined &&
          condition.max !== undefined &&
          condition.min > condition.max)
      ) {
        add(
          'invalid-days-range',
          path,
          'Elapsed-day bounds must be non-negative and min must not exceed max.',
          owner,
        );
      }
      break;
    case 'fameAtLeast':
      if (!Number.isFinite(condition.value) || condition.value < 0) {
        add(
          'invalid-fame-value',
          `${path}.value`,
          'Required fame must be a non-negative finite value.',
          owner,
        );
      }
      break;
    case 'hasCompanion':
      if (!characterIds.has(condition.characterId)) {
        add(
          'missing-condition-character',
          `${path}.characterId`,
          `Condition references missing character "${condition.characterId}".`,
          owner,
        );
      }
      break;
    case 'atPort':
    case 'atBuilding':
    case 'stage':
    case 'hasItem':
      break;
    default: {
      const exhaustive: never = condition;
      throw new Error(
        `Unhandled story condition: ${JSON.stringify(exhaustive)}`,
      );
    }
  }
};

const visitEffect = (
  effect: StoryEffect,
  path: string,
  event: StoryEvent,
  characterIds: ReadonlySet<string>,
  eventIds: ReadonlySet<string>,
  add: AddDiagnostic,
): void => {
  const owner = String(event.id);
  switch (effect.type) {
    case 'completeEvent':
      if (!eventIds.has(effect.eventId)) {
        add(
          'missing-effect-event',
          `${path}.eventId`,
          `Effect references missing event "${effect.eventId}".`,
          owner,
        );
      }
      break;
    case 'addCompanion':
    case 'assignMate':
      if (!characterIds.has(effect.characterId)) {
        add(
          'missing-effect-character',
          `${path}.characterId`,
          `Effect references missing character "${effect.characterId}".`,
          owner,
        );
      }
      break;
    case 'receiveGold':
    case 'receiveItem':
    case 'receiveShip':
    case 'exitBuilding':
    case 'setPort':
    case 'save':
      break;
    default: {
      const exhaustive: never = effect;
      throw new Error(`Unhandled story effect: ${JSON.stringify(exhaustive)}`);
    }
  }
};

const visitSteps = (
  steps: readonly StoryStep[],
  path: string,
  event: StoryEvent,
  characterIds: ReadonlySet<string>,
  eventIds: ReadonlySet<string>,
  add: AddDiagnostic,
): void => {
  const owner = String(event.id);
  steps.forEach((step, index) => {
    const stepPath = `${path}[${index}]`;
    switch (step.type) {
      case 'dialogue':
        if (step.speaker !== undefined && !characterIds.has(step.speaker)) {
          add(
            'missing-dialogue-speaker',
            `${stepPath}.speaker`,
            `Dialogue references missing speaker "${step.speaker}".`,
            owner,
          );
        }
        if (step.body.trim().length === 0) {
          add(
            'empty-dialogue',
            `${stepPath}.body`,
            'Dialogue body must not be empty.',
            owner,
          );
        }
        break;
      case 'choice':
        if (step.options.length === 0) {
          add(
            'empty-choice',
            `${stepPath}.options`,
            'Choice must contain at least one option.',
            owner,
          );
        }
        step.options.forEach((option, optionIndex) =>
          visitSteps(
            option.steps,
            `${stepPath}.options[${optionIndex}].steps`,
            event,
            characterIds,
            eventIds,
            add,
          ),
        );
        break;
      case 'effect':
        if (step.effects.length === 0) {
          add(
            'empty-effects',
            `${stepPath}.effects`,
            'Effect step must contain at least one effect.',
            owner,
          );
        }
        step.effects.forEach((effect, effectIndex) =>
          visitEffect(
            effect,
            `${stepPath}.effects[${effectIndex}]`,
            event,
            characterIds,
            eventIds,
            add,
          ),
        );
        break;
      default: {
        const exhaustive: never = step;
        throw new Error(`Unhandled story step: ${JSON.stringify(exhaustive)}`);
      }
    }
  });
};

const sceneSignatures = (condition: StoryCondition): readonly string[] => {
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

const validateRelationships = (
  source: StoryContentSource,
  characterIds: ReadonlySet<string>,
  add: AddDiagnostic,
): void => {
  source.relationships.forEach((relationship, index) => {
    (['from', 'to'] as const).forEach((field) => {
      if (!characterIds.has(relationship[field])) {
        add(
          'missing-relationship-character',
          `relationships[${index}].${field}`,
          `Relationship references missing character "${relationship[field]}".`,
          String(relationship.id),
        );
      }
    });

    if (relationship.reciprocal === undefined) return;
    const reverse = source.relationships
      .map((candidate, candidateIndex) => ({ candidate, candidateIndex }))
      .filter(
        ({ candidate }) =>
          candidate.from === relationship.to &&
          candidate.to === relationship.from,
      );
    if (
      reverse.length > 0 &&
      !reverse.some(
        ({ candidate }) => candidate.type === relationship.reciprocal,
      )
    ) {
      const { candidate, candidateIndex } = reverse[0];
      add(
        'conflicting-reciprocal',
        `relationships[${candidateIndex}].type`,
        `Relationship type "${candidate.type}" conflicts with reciprocal type "${relationship.reciprocal}".`,
        String(candidate.id),
      );
    }
  });
};

const validatePriorityConflicts = (
  events: readonly StoryEvent[],
  add: AddDiagnostic,
): void => {
  const candidatesBySceneAndPriority = new Map<string, StoryEvent>();
  const candidatesBySceneAndRandomGroup = new Map<string, StoryEvent>();
  events.forEach((event, index) => {
    sceneSignatures(event.trigger).forEach((signature) => {
      if (event.randomGroup !== undefined && event.randomGroup.length > 0) {
        const randomGroupKey = `${signature}:${event.randomGroup}`;
        const previousGroupMember =
          candidatesBySceneAndRandomGroup.get(randomGroupKey);
        if (previousGroupMember === undefined) {
          candidatesBySceneAndRandomGroup.set(randomGroupKey, event);
        } else if (previousGroupMember.priority !== event.priority) {
          add(
            'priority-conflict',
            `events[${index}].priority`,
            `Random group "${event.randomGroup}" in scene "${signature}" uses priorities ${previousGroupMember.priority} and ${event.priority}.`,
            String(event.id),
          );
        }
      }

      const key = `${signature}:${event.priority}`;
      const previous = candidatesBySceneAndPriority.get(key);
      if (previous === undefined) {
        candidatesBySceneAndPriority.set(key, event);
        return;
      }
      const sameRandomGroup =
        event.randomGroup !== undefined &&
        event.randomGroup.length > 0 &&
        event.randomGroup === previous.randomGroup;
      if (!sameRandomGroup) {
        add(
          'priority-conflict',
          `events[${index}].priority`,
          `Events "${previous.id}" and "${event.id}" share scene "${signature}" and priority ${event.priority}.`,
          String(event.id),
        );
      }
    });
  });
};

export const validateStoryContent = (
  source: StoryContentSource,
): StoryDiagnostic[] => {
  const diagnostics: StoryDiagnostic[] = [];
  const add: AddDiagnostic = (code, path, message, owner) => {
    diagnostics.push({ severity: 'error', code, owner, path, message });
  };

  duplicateDiagnostics(
    source.characters,
    (character) => character.id,
    'characters',
    'duplicate-character',
    add,
  );
  duplicateDiagnostics(
    source.relationships,
    (relationship) => relationship.id,
    'relationships',
    'duplicate-relationship',
    add,
  );
  duplicateDiagnostics(
    source.arcs,
    (arc) => arc.id,
    'arcs',
    'duplicate-arc',
    add,
  );
  duplicateDiagnostics(
    source.events,
    (event) => event.id,
    'events',
    'duplicate-event',
    add,
  );

  const characterIds = new Set(source.characters.map(({ id }) => String(id)));
  const eventIds = new Set(source.events.map(({ id }) => String(id)));
  validateRelationships(source, characterIds, add);

  const eventsById = new Map(source.events.map((event) => [event.id, event]));
  const arcIds = new Set(source.arcs.map(({ id }) => String(id)));
  source.arcs.forEach((arc, arcIndex) => {
    if (!characterIds.has(arc.protagonist)) {
      add(
        'missing-arc-protagonist',
        `arcs[${arcIndex}].protagonist`,
        `Arc references missing protagonist "${arc.protagonist}".`,
        String(arc.id),
      );
    }
    arc.eventIds.forEach((eventId, eventIndex) => {
      const event = eventsById.get(eventId);
      if (event === undefined) {
        add(
          'missing-arc-event',
          `arcs[${arcIndex}].eventIds[${eventIndex}]`,
          `Arc references missing event "${eventId}".`,
          String(arc.id),
        );
      } else if (event.arcId !== arc.id) {
        add(
          'event-arc-mismatch',
          `events[${source.events.indexOf(event)}].arcId`,
          `Event declares arc "${event.arcId}" but is owned by arc "${arc.id}".`,
          String(event.id),
        );
      }
    });
  });

  const legacyKeys = new Set<string>();
  source.events.forEach((event, eventIndex) => {
    const eventPath = `events[${eventIndex}]`;
    const declaringArc = source.arcs.find(({ id }) => id === event.arcId);
    if (
      !arcIds.has(event.arcId) ||
      declaringArc === undefined ||
      !declaringArc.eventIds.includes(event.id)
    ) {
      const alreadyReported = diagnostics.some(
        ({ code, owner }) =>
          code === 'event-arc-mismatch' && owner === String(event.id),
      );
      if (!alreadyReported) {
        add(
          'event-arc-mismatch',
          `${eventPath}.arcId`,
          `Event "${event.id}" is not owned by its declared arc "${event.arcId}".`,
          String(event.id),
        );
      }
    }

    visitCondition(
      event.trigger,
      `${eventPath}.trigger`,
      event,
      characterIds,
      eventIds,
      add,
    );
    visitSteps(
      event.steps,
      `${eventPath}.steps`,
      event,
      characterIds,
      eventIds,
      add,
    );

    if (event.repeat === 'once' && event.legacyCompletionKey === undefined) {
      add(
        'once-without-legacy-key',
        `${eventPath}.legacyCompletionKey`,
        'Once-only events require a legacy completion key.',
        String(event.id),
      );
    }
    if (event.legacyCompletionKey !== undefined) {
      if (legacyKeys.has(event.legacyCompletionKey)) {
        add(
          'duplicate-legacy-key',
          `${eventPath}.legacyCompletionKey`,
          `Legacy completion key "${event.legacyCompletionKey}" is duplicated.`,
          String(event.id),
        );
      }
      legacyKeys.add(event.legacyCompletionKey);
    }
  });

  validatePriorityConflicts(source.events, add);
  return diagnostics;
};

export const formatStoryDiagnostics = (
  diagnostics: readonly StoryDiagnostic[],
): string =>
  [
    `Story content validation failed with ${diagnostics.length} error(s):`,
    ...diagnostics.map(
      ({ code, path, message }) => `- [${code}] ${path}: ${message}`,
    ),
  ].join('\n');

export const assertValidStoryContent = (source: StoryContentSource): void => {
  const diagnostics = validateStoryContent(source).filter(
    ({ severity }) => severity === 'error',
  );
  if (diagnostics.length > 0) {
    throw new Error(formatStoryDiagnostics(diagnostics));
  }
};
