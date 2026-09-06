import { executeStoryEffects, type StoryEffectRuntime } from './core/effects';
import {
  advanceStorySession,
  getStoryFrame,
  type StorySession,
} from './core/runtime';

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

export default advanceQuestSession;
