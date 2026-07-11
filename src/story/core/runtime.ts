import type {
  DialogueStep,
  EffectStep,
  StoryChoice,
  StoryEvent,
  StoryEventId,
  StoryStep,
} from './types';

export interface StorySession {
  eventId: StoryEventId;
  steps: StoryStep[];
  stepIndex: number;
}

export type StoryFrame =
  | DialogueStep
  | {
      type: 'choice';
      prompt: string;
      options: Array<{ id: string; label: string }>;
    }
  | EffectStep;

export type StoryAdvanceResult =
  | { type: 'advanced'; session: StorySession }
  | {
      type: 'effects';
      effects: EffectStep['effects'];
      session: StorySession;
    }
  | {
      type: 'blocked';
      reason: 'choice-required' | 'invalid-choice';
      session: StorySession;
    }
  | { type: 'completed'; session: StorySession };

const cloneStoryStep = (step: StoryStep): StoryStep => {
  if (step.type === 'choice') {
    return {
      ...step,
      options: step.options.map((choice) => ({
        ...choice,
        steps: choice.steps.map(cloneStoryStep),
      })),
    };
  }

  if (step.type === 'effect') {
    return { ...step, effects: step.effects.map((effect) => ({ ...effect })) };
  }

  return { ...step };
};

const cloneStorySteps = (steps: readonly StoryStep[]): StoryStep[] =>
  steps.map(cloneStoryStep);

export const createStorySession = (event: StoryEvent): StorySession => ({
  eventId: event.id,
  steps: cloneStorySteps(event.steps),
  stepIndex: 0,
});

export const getStoryFrame = (session: StorySession): StoryFrame | null => {
  const step = session.steps[session.stepIndex];

  if (!step) {
    return null;
  }

  if (step.type === 'choice') {
    return {
      type: 'choice',
      prompt: step.prompt,
      options: step.options.map(({ id, label }) => ({ id, label })),
    };
  }

  return cloneStoryStep(step) as DialogueStep | EffectStep;
};

const advancePastCurrentStep = (session: StorySession): StorySession => ({
  ...session,
  steps: cloneStorySteps(session.steps),
  stepIndex: session.stepIndex + 1,
});

const expandChoice = (
  session: StorySession,
  selected: StoryChoice,
): StorySession => ({
  ...session,
  steps: cloneStorySteps([
    ...session.steps.slice(0, session.stepIndex),
    ...selected.steps,
    ...session.steps.slice(session.stepIndex + 1),
  ]),
});

export const advanceStorySession = (
  session: StorySession,
  choiceId?: string,
): StoryAdvanceResult => {
  const step = session.steps[session.stepIndex];

  if (!step) {
    return { type: 'completed', session };
  }

  if (step.type === 'choice') {
    if (choiceId === undefined) {
      return { type: 'blocked', reason: 'choice-required', session };
    }

    const selected = step.options.find((option) => option.id === choiceId);

    if (!selected) {
      return { type: 'blocked', reason: 'invalid-choice', session };
    }

    return { type: 'advanced', session: expandChoice(session, selected) };
  }

  const nextSession = advancePastCurrentStep(session);

  if (step.type === 'effect') {
    return {
      type: 'effects',
      effects: step.effects.map((effect) => ({ ...effect })),
      session: nextSession,
    };
  }

  return { type: 'advanced', session: nextSession };
};
