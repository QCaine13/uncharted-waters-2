import type { Stage, State } from '../../state/state';
import { sceneKey } from './registry';
import type {
  CompiledStoryContent,
  StoryCondition,
  StoryContext,
  StoryEvent,
} from './types';
import { storyEventId } from './types';
import { getCompletedStoryEvents } from '../legacy/lisbonCompletionKeys';

export type RandomSelector = (
  candidates: readonly StoryEvent[],
) => StoryEvent | undefined;

export const conditionSatisfied = (
  condition: StoryCondition,
  context: StoryContext,
): boolean => {
  switch (condition.type) {
    case 'all':
      return condition.conditions.every((candidate) =>
        conditionSatisfied(candidate, context),
      );
    case 'any':
      return condition.conditions.some((candidate) =>
        conditionSatisfied(candidate, context),
      );
    case 'not':
      return !conditionSatisfied(condition.condition, context);
    case 'eventCompleted':
      return context.completedEvents.has(condition.eventId);
    case 'atPort':
      return context.portId === condition.portId;
    case 'atBuilding':
      return context.buildingId === condition.buildingId;
    case 'stage':
      return context.stage === condition.stage;
    case 'timeWindow': {
      const minutesToday = ((context.timePassed % 1440) + 1440) % 1440;
      if (condition.min <= condition.max) {
        return minutesToday >= condition.min && minutesToday < condition.max;
      }
      return (
        minutesToday >= condition.min ||
        minutesToday < condition.max ||
        (condition.max === 0 && minutesToday === 0)
      );
    }
    case 'daysElapsed': {
      const days = Math.floor(context.timePassed / 1440);
      return (
        (condition.min === undefined || days >= condition.min) &&
        (condition.max === undefined || days <= condition.max)
      );
    }
    case 'daysAtSea': {
      const days = context.dayAtSea ?? 0;
      return (
        (condition.min === undefined || days >= condition.min) &&
        (condition.max === undefined || days <= condition.max)
      );
    }
    case 'hasDiscovery':
      return context.discoveries?.has(condition.discoveryId) ?? false;
    case 'hasReportedDiscovery':
      return context.reportedDiscoveries?.has(condition.discoveryId) ?? false;
    case 'fameAtLeast':
      return context.fame[condition.fame] >= condition.value;
    case 'hasItem':
      return context.items.has(condition.itemId);
    case 'hasCompanion':
      return context.companions.has(condition.characterId);
    case 'combatResolved': {
      const outcome = context.combatResults?.[condition.encounterId];
      return outcome !== undefined && condition.outcomes.includes(outcome);
    }
    default: {
      const exhaustive: never = condition;
      throw new Error(
        `Unhandled story condition: ${JSON.stringify(exhaustive)}`,
      );
    }
  }
};

const candidateSceneKeys = (context: StoryContext): readonly string[] => {
  const stages = [context.stage, null] as const;
  const ports = [context.portId, null] as const;
  const buildings = [context.buildingId, null] as const;
  return stages.flatMap((stage) =>
    ports.flatMap((portId) =>
      buildings.map((buildingId) =>
        stage === null
          ? `-:${portId ?? '-'}:${buildingId ?? '-'}`
          : sceneKey(stage, portId, buildingId),
      ),
    ),
  );
};

export const resolveStoryEvent = (
  context: StoryContext,
  content: CompiledStoryContent,
  chooseRandom: RandomSelector,
): StoryEvent | null => {
  const candidatesById = new Map(
    candidateSceneKeys(context)
      .flatMap((key) => content.candidatesByScene.get(key) ?? [])
      .map((candidate) => [candidate.id, candidate]),
  );
  const candidates = [...candidatesById.values()]
    .filter(
      (candidate) =>
        conditionSatisfied(candidate.trigger, context) &&
        (candidate.repeat !== 'once' ||
          !context.completedEvents.has(candidate.id)),
    )
    .sort((left, right) => {
      const priorityDifference = left.priority - right.priority;
      if (priorityDifference !== 0) return priorityDifference;
      if (left.id < right.id) return -1;
      if (left.id > right.id) return 1;
      return 0;
    });

  const first = candidates[0];
  if (first === undefined) return null;
  if (first.repeat !== 'random-ambient') return first;

  return (
    chooseRandom(
      candidates.filter(
        (candidate) =>
          candidate.repeat === 'random-ambient' &&
          candidate.randomGroup === first.randomGroup,
      ),
    ) ?? null
  );
};

const stageForState = (state: State): Stage => {
  if (state.buildingId !== null) return 'building';
  if (state.portId !== null) return 'port';
  return 'world';
};

export const createStoryContext = (
  state: State,
  content: CompiledStoryContent,
): StoryContext => {
  const characterBySailorId = new Map(
    [...content.charactersById.values()]
      .filter((character) => character.sailorId !== undefined)
      .map((character) => [character.sailorId, character.id]),
  );

  return {
    stage: stageForState(state),
    portId: state.portId,
    buildingId: state.buildingId,
    timePassed: state.timePassed,
    dayAtSea: state.dayAtSea ?? 0,
    completedEvents: new Set([
      ...(state.storyEvents ?? []).map(storyEventId),
      ...getCompletedStoryEvents(state.quests ?? [], content),
    ]),
    fame: state.fame,
    items: new Set(state.items ?? []),
    companions: new Set(
      (state.mates ?? [])
        .map(({ sailorId }) => characterBySailorId.get(sailorId))
        .filter((id): id is NonNullable<typeof id> => id !== undefined),
    ),
    discoveries: new Set(state.discoveries ?? []),
    reportedDiscoveries: new Set(state.reportedDiscoveries ?? []),
    combatResults: { ...(state.combatResults ?? {}) },
  };
};
