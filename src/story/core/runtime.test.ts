import {
  advanceStorySession,
  createStorySession,
  getStoryFrame,
} from './runtime';
import {
  characterId,
  storyArcId,
  storyEventId,
  StoryEvent,
} from './types';

const eventId = storyEventId('joao.lisbon-opening.harbor-final');
const rocco = characterId('rocco');

const createEvent = (steps: StoryEvent['steps']): StoryEvent => ({
  id: eventId,
  arcId: storyArcId('joao.lisbon-opening'),
  priority: 100,
  trigger: { type: 'atBuilding', buildingId: 'harbor' },
  repeat: 'once',
  steps,
});

describe('story sessions', () => {
  test('dialogue advances one step without mutating the session', () => {
    const session = createStorySession(
      createEvent([
        { type: 'dialogue', body: 'First', position: 1, speaker: rocco },
        { type: 'dialogue', body: 'Second', position: 2 },
      ]),
    );

    const result = advanceStorySession(session);

    expect(result).toMatchObject({
      type: 'advanced',
      session: { stepIndex: 1 },
    });
    expect(session.stepIndex).toBe(0);
    expect(getStoryFrame(session)).toMatchObject({ body: 'First' });
  });

  test('effect steps are returned for orchestration with a session that skips them after success', () => {
    const session = createStorySession(
      createEvent([
        { type: 'effect', effects: [{ type: 'receiveGold', amount: 500 }] },
        { type: 'dialogue', body: 'Done', position: 0 },
      ]),
    );

    const result = advanceStorySession(session);

    expect(result).toMatchObject({
      type: 'effects',
      effects: [{ type: 'receiveGold', amount: 500 }],
      session: { stepIndex: 1 },
    });
    expect(session.stepIndex).toBe(0);
  });

  test('choice cannot advance without a valid option id', () => {
    const session = createStorySession(
      createEvent([
        {
          type: 'choice',
          prompt: 'Take Rocco?',
          options: [
            {
              id: 'yes',
              label: 'Yes',
              steps: [{ type: 'dialogue', body: 'Welcome.', position: 2 }],
            },
          ],
        },
      ]),
    );

    expect(advanceStorySession(session)).toEqual({
      type: 'blocked',
      reason: 'choice-required',
      session,
    });
    expect(advanceStorySession(session, 'missing')).toEqual({
      type: 'blocked',
      reason: 'invalid-choice',
      session,
    });
  });

  test.each([
    [
      'yes',
      [
        { type: 'assignMate', characterId: rocco, role: 'firstMate' },
        { type: 'completeEvent', eventId },
      ],
    ],
    ['no', [{ type: 'completeEvent', eventId }]],
  ] as const)(
    '%s branch expands to its own immutable steps',
    (choiceId, expectedEffects) => {
      const harborFinal = createEvent([
        {
          type: 'choice',
          prompt: 'Will Rocco be your first mate?',
          options: [
            {
              id: 'yes',
              label: 'Yes',
              steps: [
                {
                  type: 'effect',
                  effects: [
                    {
                      type: 'assignMate',
                      characterId: rocco,
                      role: 'firstMate',
                    },
                    { type: 'completeEvent', eventId },
                  ],
                },
              ],
            },
            {
              id: 'no',
              label: 'No',
              steps: [
                {
                  type: 'effect',
                  effects: [{ type: 'completeEvent', eventId }],
                },
              ],
            },
          ],
        },
      ]);
      const session = createStorySession(harborFinal);

      const result = advanceStorySession(session, choiceId);

      expect(result).toMatchObject({
        type: 'advanced',
        session: {
          stepIndex: 0,
          steps: [{ type: 'effect', effects: expectedEffects }],
        },
      });
      expect(session.steps).toHaveLength(1);
      expect(session.steps[0]).toMatchObject({ type: 'choice' });
      expect(harborFinal.steps[0]).toMatchObject({ type: 'choice' });
    },
  );

  test('fade metadata survives frame projection', () => {
    const session = createStorySession(
      createEvent([
        {
          type: 'dialogue',
          body: 'Until next time.',
          position: 1,
          fadeBeforeNext: true,
        },
      ]),
    );

    expect(getStoryFrame(session)).toMatchObject({ fadeBeforeNext: true });
  });

  test('end of steps returns a completed result', () => {
    const session = createStorySession(createEvent([]));

    expect(getStoryFrame(session)).toBeNull();
    expect(advanceStorySession(session)).toEqual({
      type: 'completed',
      session,
    });
  });
});
