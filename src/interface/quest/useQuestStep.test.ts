import { compiledStoryContent } from '../../story';
import { createStorySession, getStoryFrame } from '../../story/core/runtime';
import type { StoryEffectRuntime } from '../../story/core/effects';
import { storyEventId, type DialogueStep } from '../../story/core/types';
import { getMessageBoxesFromFrame } from './getMessageBoxes';
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
      receiveFame: () => operations.push('fame'),
      receiveItem: () => operations.push('item'),
      consumeItem: () => operations.push('consumeItem'),
      receiveShip: () => operations.push('ship'),
      addCompanion: () => operations.push('companion'),
      removeCompanion: () => operations.push('removeCompanion'),
      assignMate: (_character, role) => operations.push(String(role)),
      exitBuilding: () => operations.push('exit'),
      setPort: () => operations.push('port'),
      startCombat: () => operations.push('combat'),
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
    const frame = getStoryFrame(session);
    if (!frame || frame.type !== 'dialogue') throw new Error('missing branch');
    const history = session.steps
      .slice(0, session.stepIndex)
      .filter((step): step is DialogueStep => step.type === 'dialogue');
    expect(getMessageBoxesFromFrame(history, frame)).toEqual([
      null,
      { body: '', characterId: 'rocco' },
      { body: frame.body, characterId: 'joao' },
    ]);
    while (getStoryFrame(session) !== null) {
      session = advanceQuestSession(session, runtime);
    }
    expect(operations).toEqual([
      'firstMate',
      'bookKeeper',
      'save',
      'complete',
      'save',
    ]);
  });

  test.each(['yes', 'no'] as const)(
    'keeps Rocco in position 1 on the first %s branch frame',
    (choiceId) => {
      const event = compiledStoryContent.eventsById.get(
        storyEventId('joao.lisbon-opening.harbor-final'),
      );
      if (!event) throw new Error('missing harbor final');
      const runtime = {
        canExecute: () => [],
        assignMate: jest.fn(),
        save: jest.fn(),
      } as unknown as StoryEffectRuntime;
      let session = createStorySession(event);
      while (getStoryFrame(session)?.type === 'dialogue') {
        session = advanceQuestSession(session, runtime);
      }
      const choiceSession = session;
      session = advanceQuestSession(session, runtime, choiceId);
      const frame = getStoryFrame(session);
      if (!frame || frame.type !== 'dialogue') {
        throw new Error('missing first branch frame');
      }
      const history = session.steps
        .slice(0, session.stepIndex)
        .filter((step): step is DialogueStep => step.type === 'dialogue');

      expect(getMessageBoxesFromFrame(history, frame)[1]).toEqual({
        body: '',
        characterId: 'rocco',
      });
      expect(choiceSession.steps[choiceSession.stepIndex]).toMatchObject({
        type: 'choice',
        speaker: 'rocco',
      });
    },
  );

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
