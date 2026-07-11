import { compiledStoryContent } from '../../story';
import { createStorySession, getStoryFrame } from '../../story/core/runtime';
import type { StoryEffectRuntime } from '../../story/core/effects';
import { storyEventId } from '../../story/core/types';
import { advanceQuestSession } from './useQuestStep';

describe('structured quest session advancement', () => {
  test('keeps the prompt and confirmation on one choice frame then executes the selected branch effects', () => {
    const event = compiledStoryContent.eventsById.get(
      storyEventId('joao.lisbon-opening.harbor-final'),
    );
    if (!event) throw new Error('missing harbor final');
    const operations: string[] = [];
    const runtime: StoryEffectRuntime = {
      canExecute: () => [],
      completeEvent: () => operations.push('complete'),
      receiveGold: () => operations.push('gold'),
      receiveItem: () => operations.push('item'),
      receiveShip: () => operations.push('ship'),
      addCompanion: () => operations.push('companion'),
      assignMate: (_character, role) => operations.push(String(role)),
      exitBuilding: () => operations.push('exit'),
      setPort: () => operations.push('port'),
      save: () => operations.push('save'),
    };
    let session = createStorySession(event);
    while (getStoryFrame(session)?.type === 'dialogue') {
      session = advanceQuestSession(session, runtime);
    }
    expect(getStoryFrame(session)).toMatchObject({
      type: 'choice',
      prompt: expect.any(String),
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ],
    });

    session = advanceQuestSession(session, runtime, 'yes');
    expect(getStoryFrame(session)).toMatchObject({
      type: 'dialogue',
      body: 'Not a bad idea. Welcome to the crew, Brother Enrico.',
    });
    while (getStoryFrame(session) !== null) {
      session = advanceQuestSession(session, runtime);
    }
    expect(operations).toEqual(['firstMate', 'bookKeeper', 'complete', 'save']);
  });

  test('executes exit effects without exposing an empty UI frame', () => {
    const event = compiledStoryContent.eventsById.get(
      storyEventId('joao.lisbon-opening.house-guard-after-introduction'),
    );
    if (!event) throw new Error('missing house guard');
    const operations: string[] = [];
    const runtime = {
      canExecute: () => [],
      exitBuilding: () => operations.push('exit'),
      save: () => operations.push('save'),
    } as unknown as StoryEffectRuntime;
    let session = createStorySession(event);
    session = advanceQuestSession(session, runtime);
    expect(getStoryFrame(session)).toBeNull();
    expect(operations).toEqual(['exit', 'save']);
  });
});
