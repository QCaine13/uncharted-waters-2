import type {
  CompiledStoryContent,
  LegacyQuestId,
  StoryEventId,
} from '../core/types';
import { legacyQuestId } from '../core/types';

export const getCompletedStoryEvents = (
  legacyKeys: readonly string[],
  content: CompiledStoryContent,
): Set<StoryEventId> =>
  new Set(
    legacyKeys
      .map((key) => content.eventByLegacyCompletionKey.get(legacyQuestId(key)))
      .filter((eventId): eventId is StoryEventId => eventId !== undefined),
  );

export const getLegacyCompletionKey = (
  eventId: StoryEventId,
  content: CompiledStoryContent,
): LegacyQuestId | null =>
  content.legacyCompletionKeyByEvent.get(eventId) ?? null;
