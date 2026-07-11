import { compileStoryContent, sceneKey } from './registry';
import {
  characterId,
  legacyQuestId,
  relationshipId,
  storyArcId,
  storyEventId,
  type StoryContentSource,
} from './types';

const joao = characterId('joao');
const rocco = characterId('rocco');
const opening = storyArcId('joao.opening');
const introduction = storyEventId('joao.opening.introduction');

const validSource = (): StoryContentSource => ({
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
        {
          type: 'dialogue',
          body: 'Welcome home.',
          position: 0,
          speaker: rocco,
        },
      ],
    },
  ],
});

describe('compileStoryContent', () => {
  test('builds identity, reciprocal relationship, event, scene, and legacy indexes', () => {
    const source = validSource();

    const compiled = compileStoryContent(source, 'strict');

    expect(compiled.charactersById.get(joao)?.names.en).toBe('João');
    expect(
      compiled.relationshipsByCharacter
        .get(rocco)
        ?.map(({ type, to }) => [type, to]),
    ).toContainEqual(['mentor', joao]);
    expect(
      compiled.relationshipsByCharacter
        .get(joao)
        ?.map(({ type, to }) => [type, to]),
    ).toContainEqual(['student', rocco]);
    expect(compiled.eventsById.size).toBe(1);
    expect(
      compiled.candidatesByScene.get(sceneKey('building', 'lisbon', 'house')),
    ).toEqual([source.events[0]]);
    expect(
      compiled.eventByLegacyCompletionKey.get(
        legacyQuestId('houseBeforeQuest'),
      ),
    ).toBe(introduction);
    expect(compiled.legacyCompletionKeyByEvent.get(introduction)).toBe(
      legacyQuestId('houseBeforeQuest'),
    );
    expect(compiled.diagnostics).toEqual([]);
    expect(
      Object.isFrozen(compiled.candidatesByScene.get('building:lisbon:house')),
    ).toBe(true);
    expect(source.relationships).toHaveLength(1);
  });

  test('production mode excludes an invalid event while preserving a valid event', () => {
    const source = validSource();
    const invalidId = storyEventId('joao.opening.invalid');
    source.events.push({
      ...source.events[0],
      id: invalidId,
      steps: [{ type: 'dialogue', body: '   ', position: 0, speaker: rocco }],
      legacyCompletionKey: legacyQuestId('invalidQuest'),
    });
    source.arcs[0].eventIds.push(invalidId);

    const compiled = compileStoryContent(source, 'production');

    expect(compiled.eventsById.has(introduction)).toBe(true);
    expect(compiled.eventsById.has(invalidId)).toBe(false);
    expect(compiled.diagnostics.map(({ code }) => code)).toContain(
      'empty-dialogue',
    );
  });

  test('strict mode throws one message containing all diagnostics', () => {
    const source = validSource();
    source.events[0].steps = [
      {
        type: 'dialogue',
        body: '',
        position: 0,
        speaker: characterId('missing'),
      },
    ];

    expect(() => compileStoryContent(source, 'strict')).toThrow(
      /missing-dialogue-speaker[\s\S]*empty-dialogue/,
    );
  });

  test('indexes predicates nested only through all conditions and uses wildcard slots', () => {
    const source = validSource();
    source.events[0].trigger = {
      type: 'all',
      conditions: [
        { type: 'stage', stage: 'port' },
        {
          type: 'all',
          conditions: [{ type: 'atPort', portId: 'lisbon' }],
        },
      ],
    };

    const compiled = compileStoryContent(source, 'strict');

    expect(compiled.candidatesByScene.get('port:lisbon:-')).toEqual([
      source.events[0],
    ]);
  });
});
