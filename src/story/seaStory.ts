import Input from '../input';
import state from '../state/state';
import { subscribeGameLoad } from '../state/saveEvents';
import { compiledStoryContent } from '.';
import { advanceQuestSession } from './advanceSession';
import type { StoryEffectRuntime } from './core/effects';
import { createStoryContext, resolveStoryEvent } from './core/resolver';
import {
  createStorySession,
  getStoryFrame,
  type StorySession,
} from './core/runtime';
import type { CompiledStoryContent, StoryContext } from './core/types';
import { storyRuntimeActions } from './storyRuntimeActions';

interface Dependencies {
  content: CompiledStoryContent;
  getContext(): StoryContext;
  runtime: StoryEffectRuntime;
  acquirePause(): () => void;
  canAdvance?(): boolean;
}

export const createSeaStoryController = ({
  content,
  getContext,
  runtime,
  acquirePause,
  canAdvance = () => true,
}: Dependencies) => {
  let session: StorySession | null = null;
  let releasePause: (() => void) | undefined;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  const clear = () => {
    if (session === null) return;
    session = null;
    releasePause?.();
    releasePause = undefined;
    emit();
  };
  return {
    getSnapshot: () => session,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    start: (): boolean => {
      const context = getContext();
      if (context.stage !== 'world') {
        clear();
        return false;
      }
      if (session !== null) return true;
      const event = resolveStoryEvent(context, content, (events) => events[0]);
      if (!event) return false;
      session = createStorySession(event);
      releasePause = acquirePause();
      if (getStoryFrame(session)?.type === 'effect') {
        session = advanceQuestSession(session, runtime);
      }
      if (getStoryFrame(session) === null) {
        clear();
        return false;
      }
      emit();
      return true;
    },
    advance: (expected: StorySession, choiceId?: string): void => {
      if (session !== expected || !canAdvance()) return;
      session = advanceQuestSession(session, runtime, choiceId);
      if (getStoryFrame(session) === null) clear();
      else emit();
    },
    clear,
  };
};

const seaStory = createSeaStoryController({
  content: compiledStoryContent,
  getContext: () => createStoryContext(state, compiledStoryContent),
  runtime: storyRuntimeActions,
  acquirePause: () => Input.suspend('story'),
  canAdvance: () => !Input.isSuspended('overlay'),
});

subscribeGameLoad(seaStory.clear);

export const getSeaStorySession = seaStory.getSnapshot;
export const subscribeSeaStory = seaStory.subscribe;
export const startSeaStory = seaStory.start;
export const advanceSeaStory = seaStory.advance;
export const clearSeaStory = seaStory.clear;
