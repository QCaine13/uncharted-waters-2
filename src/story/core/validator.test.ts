import { assertValidStoryContent, validateStoryContent } from './validator';
import {
  characterId,
  legacyQuestId,
  relationshipId,
  storyArcId,
  storyEventId,
  type StoryContentSource,
} from './types';

/* eslint-disable no-param-reassign -- invalid-fixture builders mutate fresh data */

const joao = characterId('joao');
const rocco = characterId('rocco');
const opening = storyArcId('joao.opening');
const introduction = storyEventId('joao.opening.introduction');

const sourceFixture = (): StoryContentSource => ({
  characters: [
    {
      id: joao,
      names: { en: 'João' },
      role: 'protagonist',
      dialogueStyle: { color: 'blue' },
    },
    {
      id: rocco,
      names: { en: 'Rocco' },
      role: 'family',
      dialogueStyle: { color: 'green' },
    },
  ],
  relationships: [
    {
      id: relationshipId('rocco.joao.mentor'),
      from: rocco,
      to: joao,
      type: 'mentor',
      reciprocal: 'student',
    },
  ],
  arcs: [
    {
      id: opening,
      protagonist: joao,
      title: 'Lisbon opening',
      eventIds: [introduction],
    },
  ],
  events: [
    {
      id: introduction,
      arcId: opening,
      priority: 10,
      trigger: {
        type: 'all',
        conditions: [
          { type: 'stage', stage: 'building' },
          { type: 'atPort', portId: 'lisbon' },
          { type: 'atBuilding', buildingId: 'house' },
        ],
      },
      repeat: 'once',
      legacyCompletionKey: legacyQuestId('houseBeforeQuest'),
      steps: [
        { type: 'dialogue', body: 'Welcome.', position: 0, speaker: rocco },
      ],
    },
  ],
});

const expectedCodes = [
  'duplicate-character',
  'duplicate-relationship',
  'duplicate-arc',
  'duplicate-event',
  'missing-relationship-character',
  'missing-arc-protagonist',
  'missing-arc-event',
  'event-arc-mismatch',
  'missing-dialogue-speaker',
  'empty-dialogue',
  'empty-choice',
  'empty-effects',
  'invalid-time-window',
  'invalid-days-range',
  'invalid-fame-value',
  'once-without-legacy-key',
  'duplicate-legacy-key',
  'conflicting-reciprocal',
  'priority-conflict',
] as const;

type ExpectedCode = typeof expectedCodes[number];
type InvalidCase = {
  code: ExpectedCode;
  path: string;
  mutate: (source: StoryContentSource) => void;
};

const invalidCases: InvalidCase[] = [
  {
    code: 'duplicate-character',
    path: 'characters[2].id',
    mutate: (source) => source.characters.push({ ...source.characters[0] }),
  },
  {
    code: 'duplicate-relationship',
    path: 'relationships[1].id',
    mutate: (source) =>
      source.relationships.push({ ...source.relationships[0] }),
  },
  {
    code: 'duplicate-arc',
    path: 'arcs[1].id',
    mutate: (source) => source.arcs.push({ ...source.arcs[0] }),
  },
  {
    code: 'duplicate-event',
    path: 'events[1].id',
    mutate: (source) =>
      source.events.push({
        ...source.events[0],
        priority: 11,
        legacyCompletionKey: legacyQuestId('duplicateEventQuest'),
      }),
  },
  {
    code: 'missing-relationship-character',
    path: 'relationships[0].to',
    mutate: (source) => {
      source.relationships[0].to = characterId('missing');
    },
  },
  {
    code: 'missing-arc-protagonist',
    path: 'arcs[0].protagonist',
    mutate: (source) => {
      source.arcs[0].protagonist = characterId('missing');
    },
  },
  {
    code: 'missing-arc-event',
    path: 'arcs[0].eventIds[0]',
    mutate: (source) => {
      source.arcs[0].eventIds.unshift(storyEventId('missing'));
    },
  },
  {
    code: 'event-arc-mismatch',
    path: 'events[0].arcId',
    mutate: (source) => {
      source.events[0].arcId = storyArcId('missing');
    },
  },
  {
    code: 'missing-dialogue-speaker',
    path: 'events[0].steps[0].speaker',
    mutate: (source) => {
      source.events[0].steps = [
        {
          type: 'dialogue',
          body: 'Hello.',
          position: 0,
          speaker: characterId('missing'),
        },
      ];
    },
  },
  {
    code: 'empty-dialogue',
    path: 'events[0].steps[0].body',
    mutate: (source) => {
      source.events[0].steps = [{ type: 'dialogue', body: ' ', position: 0 }];
    },
  },
  {
    code: 'empty-choice',
    path: 'events[0].steps[0].options',
    mutate: (source) => {
      source.events[0].steps = [
        { type: 'choice', prompt: 'Choose', options: [] },
      ];
    },
  },
  {
    code: 'empty-effects',
    path: 'events[0].steps[0].effects',
    mutate: (source) => {
      source.events[0].steps = [{ type: 'effect', effects: [] }];
    },
  },
  {
    code: 'invalid-time-window',
    path: 'events[0].trigger',
    mutate: (source) => {
      source.events[0].trigger = { type: 'timeWindow', min: -1, max: 1440 };
    },
  },
  {
    code: 'invalid-days-range',
    path: 'events[0].trigger',
    mutate: (source) => {
      source.events[0].trigger = { type: 'daysElapsed', min: 10, max: 2 };
    },
  },
  {
    code: 'invalid-fame-value',
    path: 'events[0].trigger.value',
    mutate: (source) => {
      source.events[0].trigger = {
        type: 'fameAtLeast',
        fame: 'adventure',
        value: -1,
      };
    },
  },
  {
    code: 'once-without-legacy-key',
    path: 'events[0].legacyCompletionKey',
    mutate: (source) => {
      delete source.events[0].legacyCompletionKey;
    },
  },
  {
    code: 'duplicate-legacy-key',
    path: 'events[1].legacyCompletionKey',
    mutate: (source) => {
      const secondId = storyEventId('joao.opening.second');
      source.events.push({
        ...source.events[0],
        id: secondId,
        priority: 11,
      });
      source.arcs[0].eventIds.push(secondId);
    },
  },
  {
    code: 'conflicting-reciprocal',
    path: 'relationships[1].type',
    mutate: (source) => {
      source.relationships.push({
        id: relationshipId('joao.rocco.friend'),
        from: joao,
        to: rocco,
        type: 'friend',
      });
    },
  },
  {
    code: 'priority-conflict',
    path: 'events[1].priority',
    mutate: (source) => {
      const secondId = storyEventId('joao.opening.second');
      source.events.push({
        ...source.events[0],
        id: secondId,
        legacyCompletionKey: legacyQuestId('secondQuest'),
      });
      source.arcs[0].eventIds.push(secondId);
    },
  },
];

describe('validateStoryContent', () => {
  test.each(invalidCases)(
    'reports $code at $path',
    ({ code, path, mutate }) => {
      const source = sourceFixture();
      mutate(source);

      expect(validateStoryContent(source)).toEqual(
        expect.arrayContaining([expect.objectContaining({ code, path })]),
      );
    },
  );

  test('covers every required diagnostic code in the matrix', () => {
    expect(invalidCases.map(({ code }) => code)).toEqual(expectedCodes);
  });

  test('returns all independent diagnostics together', () => {
    const source = sourceFixture();
    source.relationships[0].to = characterId('missing');
    source.arcs[0].protagonist = characterId('also-missing');
    source.events[0].steps = [{ type: 'effect', effects: [] }];
    delete source.events[0].legacyCompletionKey;

    expect(validateStoryContent(source).map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'missing-relationship-character',
        'missing-arc-protagonist',
        'empty-effects',
        'once-without-legacy-key',
      ]),
    );
  });

  test('assertion reports all diagnostics in one error', () => {
    const source = sourceFixture();
    source.events[0].steps = [
      {
        type: 'dialogue',
        body: '',
        position: 0,
        speaker: characterId('missing'),
      },
    ];

    expect(() => assertValidStoryContent(source)).toThrow(
      /missing-dialogue-speaker[\s\S]*empty-dialogue/,
    );
  });

  test('permits same-priority candidates in one non-empty random group', () => {
    const source = sourceFixture();
    const secondId = storyEventId('joao.opening.ambient-two');
    source.events[0].randomGroup = 'house-greeting';
    source.events.push({
      ...source.events[0],
      id: secondId,
      legacyCompletionKey: legacyQuestId('ambientTwo'),
    });
    source.arcs[0].eventIds.push(secondId);

    expect(validateStoryContent(source).map(({ code }) => code)).not.toContain(
      'priority-conflict',
    );
  });

  test('rejects different priorities within one random group and scene', () => {
    const source = sourceFixture();
    const secondId = storyEventId('joao.opening.ambient-two');
    source.events[0].randomGroup = 'house-greeting';
    source.events.push({
      ...source.events[0],
      id: secondId,
      priority: 20,
      legacyCompletionKey: legacyQuestId('ambientTwo'),
    });
    source.arcs[0].eventIds.push(secondId);

    expect(validateStoryContent(source)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'priority-conflict',
          path: 'events[1].priority',
        }),
      ]),
    );
  });
});
