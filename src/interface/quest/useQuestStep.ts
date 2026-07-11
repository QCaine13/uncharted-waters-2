import { useRef, useState } from 'react';

import { compiledStoryContent } from '../../story';
import {
  executeStoryEffects,
  type StoryEffectRuntime,
} from '../../story/core/effects';
import {
  createStoryContext,
  resolveStoryEvent,
} from '../../story/core/resolver';
import {
  advanceStorySession,
  createStorySession,
  getStoryFrame,
  type StorySession,
} from '../../story/core/runtime';
import type { DialogueStep, StoryEvent } from '../../story/core/types';
import { storyRuntimeActions } from '../../story/storyRuntimeActions';
import state from '../../state/state';
import updateInterface from '../../state/updateInterface';
import { getMessageBoxesFromFrame } from './getMessageBoxes';

export const advanceQuestSession = (
  session: StorySession,
  runtime: StoryEffectRuntime,
  choiceId?: string,
): StorySession => {
  const first = advanceStorySession(session, choiceId);
  if (first.type === 'blocked' || first.type === 'completed')
    return first.session;
  let next = first.session;
  if (first.type === 'effects') {
    const execution = executeStoryEffects(first.effects, runtime);
    if (!execution.ok)
      throw new Error(
        execution.diagnostics.map(({ message }) => message).join('\n'),
      );
  }

  while (getStoryFrame(next)?.type === 'effect') {
    const result = advanceStorySession(next);
    if (result.type !== 'effects') throw new Error('Expected story effects');
    const execution = executeStoryEffects(result.effects, runtime);
    if (!execution.ok)
      throw new Error(
        execution.diagnostics.map(({ message }) => message).join('\n'),
      );
    next = result.session;
  }
  return next;
};

const dialogueHistory = (session: StorySession): DialogueStep[] =>
  session.steps
    .slice(0, session.stepIndex)
    .filter((step): step is DialogueStep => step.type === 'dialogue');

export default function useQuestStep() {
  const eventRef = useRef<StoryEvent | null | undefined>(undefined);
  if (eventRef.current === undefined) {
    eventRef.current = resolveStoryEvent(
      createStoryContext(state, compiledStoryContent),
      compiledStoryContent,
      (candidates) => candidates[Math.floor(Math.random() * candidates.length)],
    );
  }
  const [session, setSession] = useState<StorySession | null>(() =>
    eventRef.current ? createStorySession(eventRef.current) : null,
  );
  if (session === null) return null;
  const frame = getStoryFrame(session);
  if (frame === null || frame.type === 'effect') return null;

  const proceed = (choiceId?: string) => {
    const advance = () =>
      setSession(advanceQuestSession(session, storyRuntimeActions, choiceId));
    if (frame.type === 'dialogue' && frame.fadeBeforeNext) {
      updateInterface.fade(advance);
    } else {
      advance();
    }
  };
  const messageBoxes = getMessageBoxesFromFrame(
    dialogueHistory(session),
    frame,
    proceed,
  );
  const current = messageBoxes[frame.position];
  if (frame.type === 'dialogue' && current)
    current.acknowledge = () => proceed();
  return { messageBoxes };
}
