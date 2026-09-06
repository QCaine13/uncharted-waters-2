import { useRef, useState } from 'react';

import { compiledStoryContent } from '../../story';
import { advanceQuestSession } from '../../story/advanceSession';
import {
  createStoryContext,
  resolveStoryEvent,
} from '../../story/core/resolver';
import {
  createStorySession,
  getStoryFrame,
  type StorySession,
} from '../../story/core/runtime';
import type { DialogueStep, StoryEvent } from '../../story/core/types';
import { storyRuntimeActions } from '../../story/storyRuntimeActions';
import state from '../../state/state';
import updateInterface from '../../state/updateInterface';
import { getMessageBoxesFromFrame } from './getMessageBoxes';
import Input from '../../input';

export { advanceQuestSession } from '../../story/advanceSession';

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
  const activeSessionRef = useRef<StorySession | null>(session);
  const transitionPendingRef = useRef(false);
  if (session === null) return null;
  const frame = getStoryFrame(session);
  if (frame === null || frame.type === 'effect') return null;

  const proceed = (choiceId?: string) => {
    if (Input.isSuspended('overlay')) return;
    if (transitionPendingRef.current || activeSessionRef.current !== session) {
      return;
    }
    transitionPendingRef.current = true;
    const advance = () => {
      try {
        const next = advanceQuestSession(
          session,
          storyRuntimeActions,
          choiceId,
        );
        activeSessionRef.current = next;
        transitionPendingRef.current = false;
        setSession(next);
      } catch (error) {
        transitionPendingRef.current = false;
        throw error;
      }
    };
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
