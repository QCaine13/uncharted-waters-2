import {
  advanceStorySession,
  createStorySession,
  getStoryFrame,
} from './runtime';
import { characterId, storyArcId, storyEventId, StoryEvent } from './types';

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

  test('copy-on-advance isolates step arrays and nested choice and effect data', () => {
    const event = createEvent([
      { type: 'dialogue', body: 'Advance me.', position: 0 },
      { type: 'effect', effects: [{ type: 'receiveGold', amount: 500 }] },
      {
        type: 'choice',
        prompt: 'Continue?',
        position: 0,
        options: [
          {
            id: 'yes',
            label: 'Yes',
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
    const eventEffect = event.steps[1];
    const eventChoice = event.steps[2];

    if (eventEffect.type !== 'effect' || eventChoice.type !== 'choice') {
      throw new Error('Expected effect and choice fixtures');
    }

    Object.freeze(event.steps);
    Object.freeze(eventEffect.effects);
    Object.freeze(eventChoice.options);
    Object.freeze(eventChoice.options[0].steps);

    const session = createStorySession(event);
    const sessionEffect = session.steps[1];
    const sessionChoice = session.steps[2];

    if (sessionEffect.type !== 'effect' || sessionChoice.type !== 'choice') {
      throw new Error('Expected cloned effect and choice steps');
    }

    const sessionBranchEffect = sessionChoice.options[0].steps[0];

    if (sessionBranchEffect.type !== 'effect') {
      throw new Error('Expected a nested branch effect');
    }

    Object.freeze(session.steps);
    Object.freeze(sessionEffect.effects);
    Object.freeze(sessionChoice.options);
    Object.freeze(sessionChoice.options[0].steps);

    const result = advanceStorySession(session);

    if (result.type !== 'advanced') {
      throw new Error('Expected dialogue advancement');
    }

    const nextSession = result.session;
    const nextDialogue = nextSession.steps[0];
    const nextEffect = nextSession.steps[1];
    const nextChoice = nextSession.steps[2];

    if (
      nextDialogue.type !== 'dialogue' ||
      nextEffect.type !== 'effect' ||
      nextChoice.type !== 'choice'
    ) {
      throw new Error('Expected copied dialogue, effect, and choice steps');
    }

    const nextBranchEffect = nextChoice.options[0].steps[0];

    if (nextBranchEffect.type !== 'effect') {
      throw new Error('Expected a copied nested branch effect');
    }

    expect(session.steps).not.toBe(event.steps);
    expect(sessionEffect.effects).not.toBe(eventEffect.effects);
    expect(sessionChoice.options).not.toBe(eventChoice.options);
    expect(sessionChoice.options[0].steps).not.toBe(
      eventChoice.options[0].steps,
    );
    expect(nextSession.steps).not.toBe(session.steps);
    expect(nextEffect).not.toBe(sessionEffect);
    expect(nextEffect.effects).not.toBe(sessionEffect.effects);
    expect(nextChoice).not.toBe(sessionChoice);
    expect(nextChoice.options).not.toBe(sessionChoice.options);
    expect(nextChoice.options[0]).not.toBe(sessionChoice.options[0]);
    expect(nextChoice.options[0].steps).not.toBe(
      sessionChoice.options[0].steps,
    );
    expect(nextBranchEffect.effects).not.toBe(sessionBranchEffect.effects);

    nextDialogue.body = 'Changed clone.';

    expect(event.steps[0]).toMatchObject({ body: 'Advance me.' });
    expect(session.steps[0]).toMatchObject({ body: 'Advance me.' });
  });

  test('choice cannot advance without a valid option id', () => {
    const session = createStorySession(
      createEvent([
        {
          type: 'choice',
          prompt: 'Take Rocco?',
          position: 1,
          speaker: rocco,
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
    expect(getStoryFrame(session)).toEqual({
      type: 'choice',
      prompt: 'Take Rocco?',
      position: 1,
      speaker: rocco,
      options: [{ id: 'yes', label: 'Yes' }],
    });
  });

  test('choice expansion preserves the spoken prompt as immutable dialogue history', () => {
    const session = createStorySession(
      createEvent([
        {
          type: 'choice',
          prompt: 'Rocco asks?',
          position: 1,
          speaker: rocco,
          options: [
            {
              id: 'yes',
              label: 'Yes',
              steps: [{ type: 'dialogue', body: 'João answers.', position: 2 }],
            },
          ],
        },
      ]),
    );

    const result = advanceStorySession(session, 'yes');

    expect(result).toMatchObject({
      type: 'advanced',
      session: {
        stepIndex: 1,
        steps: [
          {
            type: 'dialogue',
            body: 'Rocco asks?',
            position: 1,
            speaker: rocco,
          },
          { type: 'dialogue', body: 'João answers.', position: 2 },
        ],
      },
    });
    expect(session.stepIndex).toBe(0);
    expect(session.steps[0]).toMatchObject({ type: 'choice' });
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
        { type: 'dialogue', body: 'Before choice.', position: 1 },
        {
          type: 'choice',
          prompt: 'Will Rocco be your first mate?',
          position: 1,
          speaker: rocco,
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
        { type: 'dialogue', body: 'After choice.', position: 2 },
      ]);
      const initialSession = createStorySession(harborFinal);
      const beforeChoice = advanceStorySession(initialSession);

      if (beforeChoice.type !== 'advanced') {
        throw new Error('Expected dialogue to advance to the choice');
      }

      const { session } = beforeChoice;

      const result = advanceStorySession(session, choiceId);

      expect(result).toMatchObject({
        type: 'advanced',
        session: {
          stepIndex: 2,
          steps: [
            { type: 'dialogue', body: 'Before choice.' },
            {
              type: 'dialogue',
              body: 'Will Rocco be your first mate?',
              position: 1,
              speaker: rocco,
            },
            { type: 'effect', effects: expectedEffects },
            { type: 'dialogue', body: 'After choice.' },
          ],
        },
      });
      expect(session.steps).toHaveLength(3);
      expect(session.steps[1]).toMatchObject({ type: 'choice' });
      expect(harborFinal.steps[1]).toMatchObject({ type: 'choice' });
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
