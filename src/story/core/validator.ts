import type {
  StoryCondition,
  StoryContentSource,
  StoryDiagnostic,
  StoryEffect,
  StoryEvent,
  StoryStep,
} from './types';
import { combatOutcomes } from '../../combat/types';

export interface StoryParityManifest {
  legacyKeyToEvent: ReadonlyMap<string, string>;
  migratedEventIds: ReadonlySet<string>;
}

export interface StoryValidationCatalogs {
  itemIds: ReadonlySet<string>;
  portIds: ReadonlySet<string>;
  buildingIds: ReadonlySet<string>;
  shipIds: ReadonlySet<string>;
  sailorIds: ReadonlySet<string>;
  encounterIds?: ReadonlySet<string>;
  mateRoles: ReadonlySet<string | number | null>;
  discoveryIds?: ReadonlySet<string>;
  parityManifest: StoryParityManifest;
}

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
  catalogs: StoryValidationCatalogs | undefined,
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
          catalogs,
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
        catalogs,
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
    case 'calendarMonthsAfterEvent':
      if (!eventIds.has(condition.eventId)) {
        add(
          'missing-condition-event',
          `${path}.eventId`,
          `Condition references missing event "${condition.eventId}".`,
          owner,
        );
      }
      if (!Number.isInteger(condition.minMonths) || condition.minMonths < 0) {
        add(
          'invalid-calendar-months',
          `${path}.minMonths`,
          'Required calendar months must be a non-negative integer.',
          owner,
        );
      }
      if (
        !Number.isInteger(condition.minDay) ||
        condition.minDay < 1 ||
        condition.minDay > 31
      ) {
        add(
          'invalid-calendar-day',
          `${path}.minDay`,
          'Required calendar day must be an integer in [1, 31].',
          owner,
        );
      }
      break;
    case 'calendarDaysAfterEvent':
      if (!eventIds.has(condition.eventId)) {
        add(
          'missing-condition-event',
          `${path}.eventId`,
          `Condition references missing event "${condition.eventId}".`,
          owner,
        );
      }
      if (!Number.isInteger(condition.minDays) || condition.minDays < 0) {
        add(
          'invalid-calendar-days',
          `${path}.minDays`,
          'Required calendar days must be a non-negative integer.',
          owner,
        );
      }
      break;
    case 'withinWorldArea':
      if (
        !Number.isFinite(condition.minX) ||
        !Number.isFinite(condition.maxX) ||
        !Number.isFinite(condition.minY) ||
        !Number.isFinite(condition.maxY) ||
        condition.minX < 0 ||
        condition.maxX > 2159 ||
        condition.minY < 0 ||
        condition.maxY > 1079 ||
        condition.minX > condition.maxX ||
        condition.minY > condition.maxY
      ) {
        add(
          'invalid-world-area',
          path,
          'World area bounds must be finite, ordered, and inside [0, 2159] x [0, 1079].',
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
    case 'daysAtSea':
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
          'invalid-days-at-sea-range',
          path,
          'Sea-day bounds must be non-negative and min must not exceed max.',
          owner,
        );
      }
      break;
    case 'hasDiscovery':
    case 'hasReportedDiscovery':
      if (
        catalogs?.discoveryIds !== undefined &&
        !catalogs.discoveryIds.has(condition.discoveryId)
      ) {
        add(
          'unknown-discovery',
          `${path}.discoveryId`,
          `Condition references unknown discovery "${condition.discoveryId}".`,
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
      if (catalogs !== undefined && !catalogs.portIds.has(condition.portId)) {
        add(
          'unknown-port',
          `${path}.portId`,
          `Condition references unknown port "${condition.portId}".`,
          owner,
        );
      }
      break;
    case 'atBuilding':
      if (
        catalogs !== undefined &&
        !catalogs.buildingIds.has(condition.buildingId)
      ) {
        add(
          'unknown-building',
          `${path}.buildingId`,
          `Condition references unknown building "${condition.buildingId}".`,
          owner,
        );
      }
      break;
    case 'hasItem':
      if (catalogs !== undefined && !catalogs.itemIds.has(condition.itemId)) {
        add(
          'unknown-item',
          `${path}.itemId`,
          `Condition references unknown item "${condition.itemId}".`,
          owner,
        );
      }
      break;
    case 'combatResolved':
      if (
        catalogs?.encounterIds !== undefined &&
        !catalogs.encounterIds.has(condition.encounterId)
      ) {
        add(
          'unknown-encounter',
          `${path}.encounterId`,
          `Condition references unknown combat encounter "${condition.encounterId}".`,
          owner,
        );
      }
      if (
        condition.outcomes.length === 0 ||
        condition.outcomes.some((outcome) => !combatOutcomes.includes(outcome))
      ) {
        add(
          'invalid-combat-outcomes',
          `${path}.outcomes`,
          'Combat outcomes must contain at least one supported outcome.',
          owner,
        );
      }
      break;
    case 'stage':
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
  catalogs: StoryValidationCatalogs | undefined,
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
    case 'removeCompanion':
      if (!characterIds.has(effect.characterId)) {
        add(
          'missing-effect-character',
          `${path}.characterId`,
          `Effect references missing character "${effect.characterId}".`,
          owner,
        );
      }
      break;
    case 'assignMate': {
      if (!characterIds.has(effect.characterId)) {
        add(
          'missing-effect-character',
          `${path}.characterId`,
          `Effect references missing character "${effect.characterId}".`,
          owner,
        );
      }
      const isPublicRole =
        effect.role === null ||
        typeof effect.role === 'number' ||
        catalogs?.mateRoles.has(effect.role) === true;
      if (catalogs !== undefined && !isPublicRole) {
        add(
          'invalid-mate-role',
          `${path}.role`,
          `Effect uses invalid mate role "${String(effect.role)}".`,
          owner,
        );
      }
      break;
    }
    case 'receiveGold':
      if (!Number.isFinite(effect.amount) || effect.amount < 0) {
        add(
          'invalid-gold',
          `${path}.amount`,
          'Gold amount must be a non-negative finite number.',
          owner,
        );
      }
      break;
    case 'receiveFame':
      if (!Number.isFinite(effect.amount) || effect.amount < 0) {
        add(
          'invalid-fame',
          `${path}.amount`,
          'Fame amount must be a non-negative finite number.',
          owner,
        );
      }
      break;
    case 'receiveItem':
    case 'consumeItem':
      if (catalogs !== undefined && !catalogs.itemIds.has(effect.itemId)) {
        add(
          'unknown-item',
          `${path}.itemId`,
          `Effect references unknown item "${effect.itemId}".`,
          owner,
        );
      }
      break;
    case 'receiveShip':
      if (catalogs !== undefined && !catalogs.shipIds.has(effect.shipId)) {
        add(
          'unknown-ship',
          `${path}.shipId`,
          `Effect references unknown ship "${effect.shipId}".`,
          owner,
        );
      }
      if (typeof effect.name !== 'string' || effect.name.trim().length === 0) {
        add(
          'invalid-ship-name',
          `${path}.name`,
          'Received ship name must not be empty.',
          owner,
        );
      }
      break;
    case 'setPort':
      if (
        effect.portId !== null &&
        catalogs !== undefined &&
        !catalogs.portIds.has(effect.portId)
      ) {
        add(
          'unknown-port',
          `${path}.portId`,
          `Effect references unknown port "${effect.portId}".`,
          owner,
        );
      }
      break;
    case 'startCombat':
      if (
        catalogs?.encounterIds !== undefined &&
        !catalogs.encounterIds.has(effect.encounterId)
      ) {
        add(
          'unknown-encounter',
          `${path}.encounterId`,
          `Effect references unknown combat encounter "${effect.encounterId}".`,
          owner,
        );
      }
      break;
    case 'exitBuilding':
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
  catalogs: StoryValidationCatalogs | undefined,
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
        if (step.position !== 0 && step.speaker === undefined) {
          add(
            'missing-position-speaker',
            `${stepPath}.speaker`,
            'Dialogue in a character position requires a speaker.',
            owner,
          );
        }
        break;
      case 'choice':
        if (step.speaker !== undefined && !characterIds.has(step.speaker)) {
          add(
            'missing-dialogue-speaker',
            `${stepPath}.speaker`,
            `Choice references missing speaker "${step.speaker}".`,
            owner,
          );
        }
        if (step.position !== 0 && step.speaker === undefined) {
          add(
            'missing-position-speaker',
            `${stepPath}.speaker`,
            'Choice in a character position requires a speaker.',
            owner,
          );
        }
        if (step.options.length === 0) {
          add(
            'empty-choice',
            `${stepPath}.options`,
            'Choice must contain at least one option.',
            owner,
          );
        }
        step.options.forEach((option, optionIndex) => {
          const optionPath = `${stepPath}.options[${optionIndex}].steps`;
          if (option.steps.length === 0) {
            add(
              'empty-option-steps',
              optionPath,
              'Choice option must contain at least one step.',
              owner,
            );
          }
          visitSteps(
            option.steps,
            optionPath,
            event,
            characterIds,
            eventIds,
            catalogs,
            add,
          );
        });
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
            catalogs,
            add,
          ),
        );
        step.effects.forEach((effect, effectIndex) => {
          if (effect.type !== 'startCombat') return;
          const laterNonSave = step.effects
            .slice(effectIndex + 1)
            .some((candidate) => candidate.type !== 'save');
          if (laterNonSave) {
            add(
              'non-terminal-combat-start',
              `${stepPath}.effects[${effectIndex}]`,
              'Combat start must be the final non-save effect in its group.',
              owner,
            );
          }
        });
        break;
      default: {
        const exhaustive: never = step;
        throw new Error(`Unhandled story step: ${JSON.stringify(exhaustive)}`);
      }
    }
  });
};

const union = (sets: readonly ReadonlySet<string>[]): Set<string> =>
  new Set(sets.flatMap((entries) => [...entries]));

const intersection = (sets: readonly ReadonlySet<string>[]): Set<string> => {
  if (sets.length === 0) return new Set();
  return new Set([...sets[0]].filter((id) => sets.every((set) => set.has(id))));
};

const eventDependencies = (
  condition: StoryCondition,
  positive = true,
): Set<string> => {
  switch (condition.type) {
    case 'eventCompleted':
      return positive ? new Set([String(condition.eventId)]) : new Set();
    case 'calendarMonthsAfterEvent':
    case 'calendarDaysAfterEvent':
      return positive ? new Set([String(condition.eventId)]) : new Set();
    case 'not':
      return eventDependencies(condition.condition, !positive);
    case 'all': {
      const children = condition.conditions.map((child) =>
        eventDependencies(child, positive),
      );
      return positive ? union(children) : intersection(children);
    }
    case 'any': {
      const children = condition.conditions.map((child) =>
        eventDependencies(child, positive),
      );
      return positive ? intersection(children) : union(children);
    }
    default:
      return new Set();
  }
};

const hasDirectContradiction = (condition: StoryCondition): boolean => {
  if (condition.type !== 'all') return false;
  const positiveEvents = new Set<string>();
  const negativeEvents = new Set<string>();
  condition.conditions.forEach((candidate) => {
    if (candidate.type === 'eventCompleted') {
      positiveEvents.add(String(candidate.eventId));
    } else if (
      candidate.type === 'not' &&
      candidate.condition.type === 'eventCompleted'
    ) {
      negativeEvents.add(String(candidate.condition.eventId));
    }
  });
  return (
    [...positiveEvents].some((id) => negativeEvents.has(id)) ||
    condition.conditions.some(hasDirectContradiction)
  );
};

const validateDependencyGraph = (
  events: readonly StoryEvent[],
  add: AddDiagnostic,
): void => {
  const eventIndex = new Map(
    events.map((event, index) => [String(event.id), index]),
  );
  const graph = new Map(
    events.map((event) => [String(event.id), eventDependencies(event.trigger)]),
  );
  const reaches = (
    start: string,
    current: string,
    visited: Set<string>,
  ): boolean => {
    if (visited.has(current)) return false;
    visited.add(current);
    return [...(graph.get(current) ?? [])].some(
      (dependency) =>
        dependency === start ||
        (graph.has(dependency) && reaches(start, dependency, visited)),
    );
  };
  events.forEach((event) => {
    const id = String(event.id);
    if (reaches(id, id, new Set())) {
      const index = eventIndex.get(String(event.id));
      add(
        'dependency-cycle',
        `events[${index}].trigger`,
        `Event "${event.id}" participates in a completion dependency cycle.`,
        String(event.id),
      );
    }
  });
};

type ScenePattern = {
  stage: string;
  port: string;
  building: string;
};

const scenePatterns = (condition: StoryCondition): readonly ScenePattern[] => {
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
  return stageSlots.flatMap((stage): ScenePattern[] =>
    portSlots.flatMap((port) =>
      buildingSlots.map((building) => ({ stage, port, building })),
    ),
  );
};

const scenePatternsOverlap = (
  left: ScenePattern,
  right: ScenePattern,
): boolean =>
  (left.stage === right.stage || left.stage === '-' || right.stage === '-') &&
  (left.port === right.port || left.port === '-' || right.port === '-') &&
  (left.building === right.building ||
    left.building === '-' ||
    right.building === '-');

const formatScenePattern = ({ stage, port, building }: ScenePattern): string =>
  `${stage}:${port}:${building}`;

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
  const patternsByEvent = events.map(({ trigger }) => scenePatterns(trigger));
  events.forEach((event, index) => {
    for (let previousIndex = 0; previousIndex < index; previousIndex += 1) {
      const previous = events[previousIndex];
      const overlap = patternsByEvent[index].find((pattern) =>
        patternsByEvent[previousIndex].some((previousPattern) =>
          scenePatternsOverlap(pattern, previousPattern),
        ),
      );
      if (overlap !== undefined) {
        const sameRandomGroup =
          event.randomGroup !== undefined &&
          event.randomGroup.length > 0 &&
          event.randomGroup === previous.randomGroup;
        const conflictsAtEqualPriority =
          event.priority === previous.priority && !sameRandomGroup;
        const randomGroupPriorityMismatch =
          event.priority !== previous.priority && sameRandomGroup;
        if (conflictsAtEqualPriority || randomGroupPriorityMismatch) {
          add(
            'priority-conflict',
            `events[${index}].priority`,
            `Events "${previous.id}" and "${
              event.id
            }" have incompatible priorities across overlapping scene pattern "${formatScenePattern(
              overlap,
            )}".`,
            String(event.id),
          );
        }
      }
    }
  });
};

export const validateStoryContent = (
  source: StoryContentSource,
  catalogs?: StoryValidationCatalogs,
): StoryDiagnostic[] => {
  const diagnostics: StoryDiagnostic[] = [];
  const add: AddDiagnostic = (code, path, message, owner) => {
    diagnostics.push({ severity: 'error', code, owner, path, message });
  };

  if (catalogs !== undefined && source.arcs.length === 0) {
    add('empty-arcs', 'arcs', 'Story content must contain at least one arc.');
  }
  if (catalogs !== undefined && source.events.length === 0) {
    add(
      'empty-events',
      'events',
      'Story content must contain at least one event.',
    );
  }

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
  const sailorLinks = new Set<string>();
  const legacyCharacterLinks = new Set<string>();
  source.characters.forEach((character, index) => {
    if (character.sailorId !== undefined) {
      if (sailorLinks.has(character.sailorId)) {
        add(
          'duplicate-sailor-link',
          `characters[${index}].sailorId`,
          `Sailor "${character.sailorId}" is linked to multiple characters.`,
          String(character.id),
        );
      }
      if (
        catalogs !== undefined &&
        !catalogs.sailorIds.has(character.sailorId)
      ) {
        add(
          'unknown-sailor',
          `characters[${index}].sailorId`,
          `Character references unknown sailor "${character.sailorId}".`,
          String(character.id),
        );
      }
      sailorLinks.add(character.sailorId);
    }
    if (character.legacyCharacterId !== undefined) {
      if (legacyCharacterLinks.has(character.legacyCharacterId)) {
        add(
          'duplicate-legacy-character-link',
          `characters[${index}].legacyCharacterId`,
          `Legacy character "${character.legacyCharacterId}" is linked more than once.`,
          String(character.id),
        );
      }
      legacyCharacterLinks.add(character.legacyCharacterId);
    }
  });
  validateRelationships(source, characterIds, add);

  const eventsById = new Map(source.events.map((event) => [event.id, event]));
  const arcIds = new Set(source.arcs.map(({ id }) => String(id)));
  source.arcs.forEach((arc, arcIndex) => {
    if (arc.eventIds.length === 0) {
      add(
        'empty-arc-events',
        `arcs[${arcIndex}].eventIds`,
        'Story arc must contain at least one event.',
        String(arc.id),
      );
    }
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
    if (!Number.isFinite(event.priority) || event.priority < 0) {
      add(
        'invalid-priority',
        `${eventPath}.priority`,
        'Event priority must be a non-negative finite number.',
        String(event.id),
      );
    }
    if (event.steps.length === 0) {
      add(
        'empty-event-steps',
        `${eventPath}.steps`,
        'Story event must contain at least one step.',
        String(event.id),
      );
    }
    if (hasDirectContradiction(event.trigger)) {
      add(
        'contradictory-condition',
        `${eventPath}.trigger`,
        'Event trigger contains directly contradictory conditions.',
        String(event.id),
      );
    }
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
      catalogs,
      add,
    );
    visitSteps(
      event.steps,
      `${eventPath}.steps`,
      event,
      characterIds,
      eventIds,
      catalogs,
      add,
    );

    const requiresLegacyCompletionKey =
      event.repeat === 'once' &&
      catalogs !== undefined &&
      catalogs.parityManifest.migratedEventIds.has(String(event.id));
    if (
      requiresLegacyCompletionKey &&
      event.legacyCompletionKey === undefined
    ) {
      add(
        'once-without-legacy-key',
        `${eventPath}.legacyCompletionKey`,
        'Migrated once-only events require their legacy completion key.',
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
      if (
        catalogs !== undefined &&
        !catalogs.parityManifest.legacyKeyToEvent.has(
          String(event.legacyCompletionKey),
        )
      ) {
        add(
          'parity-manifest-omission',
          `${eventPath}.legacyCompletionKey`,
          `Legacy completion key "${event.legacyCompletionKey}" is absent from the parity manifest.`,
          String(event.id),
        );
      } else if (
        catalogs !== undefined &&
        catalogs.parityManifest.legacyKeyToEvent.get(
          String(event.legacyCompletionKey),
        ) !== String(event.id)
      ) {
        const mappedEventId = catalogs.parityManifest.legacyKeyToEvent.get(
          String(event.legacyCompletionKey),
        );
        add(
          'parity-event-mismatch',
          `${eventPath}.legacyCompletionKey`,
          `Legacy completion key "${event.legacyCompletionKey}" maps to a different event.`,
          String(event.id),
        );
        if (mappedEventId !== undefined && eventIds.has(mappedEventId)) {
          add(
            'parity-event-mismatch',
            `parityManifest.legacyKeyToEvent[${event.legacyCompletionKey}]`,
            `Legacy completion key "${event.legacyCompletionKey}" is owned by event "${event.id}", not "${mappedEventId}".`,
            mappedEventId,
          );
        }
      }
    }
  });

  catalogs?.parityManifest.legacyKeyToEvent.forEach((eventId, legacyKey) => {
    const event = source.events.find(({ id }) => String(id) === eventId);
    if (event === undefined) {
      add(
        'parity-event-missing',
        `parityManifest.legacyKeyToEvent[${legacyKey}]`,
        `Parity manifest references missing event "${eventId}".`,
        eventId,
      );
    } else if (
      event.legacyCompletionKey !== undefined &&
      String(event.legacyCompletionKey) !== legacyKey
    ) {
      add(
        'parity-event-mismatch',
        `parityManifest.legacyKeyToEvent[${legacyKey}]`,
        `Parity key "${legacyKey}" does not match event "${eventId}".`,
        eventId,
      );
    }
  });

  catalogs?.parityManifest.migratedEventIds.forEach((eventId) => {
    if (!eventIds.has(eventId)) {
      add(
        'parity-event-missing',
        `parityManifest.migratedEventIds[${eventId}]`,
        `Migrated event manifest references missing event "${eventId}".`,
        eventId,
      );
    }
  });

  if (catalogs !== undefined) {
    const migratedArcIds = new Set(
      source.events
        .filter(({ id }) =>
          catalogs.parityManifest.migratedEventIds.has(String(id)),
        )
        .map(({ arcId }) => String(arcId)),
    );
    source.events.forEach((event, eventIndex) => {
      if (
        migratedArcIds.has(String(event.arcId)) &&
        !catalogs.parityManifest.migratedEventIds.has(String(event.id))
      ) {
        add(
          'parity-manifest-omission',
          `events[${eventIndex}].id`,
          `Migrated event "${event.id}" is absent from the event manifest.`,
          String(event.id),
        );
      }
    });
  }

  validateDependencyGraph(source.events, add);
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

export const assertValidStoryContent = (
  source: StoryContentSource,
  catalogs?: StoryValidationCatalogs,
): void => {
  const diagnostics = validateStoryContent(source, catalogs).filter(
    ({ severity }) => severity === 'error',
  );
  if (diagnostics.length > 0) {
    throw new Error(formatStoryDiagnostics(diagnostics));
  }
};
