import {
  compileProductionStoryContent,
  compileStoryContent,
  sceneKey,
} from './registry';
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
    const sourceSnapshot = JSON.stringify(source);
    const relationship = source.relationships[0];

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
    expect(Object.isFrozen(compiled.relationshipsByCharacter.get(rocco))).toBe(
      true,
    );
    expect(Object.isFrozen(compiled.relationshipsByCharacter.get(joao))).toBe(
      true,
    );
    expect(compiled.relationshipsByCharacter.get(rocco)?.[0]).toBe(
      relationship,
    );
    expect(JSON.stringify(source)).toBe(sourceSnapshot);
  });

  test('uses an explicit matching reverse relationship without synthesizing duplicates', () => {
    const source = validSource();
    source.relationships.push({
      id: relationshipId('joao.rocco.student'),
      from: joao,
      to: rocco,
      type: 'student',
    });

    const compiled = compileStoryContent(source, 'strict');

    expect(compiled.relationshipsByCharacter.get(rocco)).toHaveLength(1);
    expect(compiled.relationshipsByCharacter.get(joao)).toHaveLength(1);
  });

  test('rejects an explicit reverse relationship that conflicts with the reciprocal type', () => {
    const source = validSource();
    source.relationships.push({
      id: relationshipId('joao.rocco.friend'),
      from: joao,
      to: rocco,
      type: 'friend',
    });

    expect(() => compileStoryContent(source, 'strict')).toThrow(
      /conflicting-reciprocal/,
    );
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
    expect([...compiled.candidatesByScene.values()].flat()).not.toContainEqual(
      expect.objectContaining({ id: invalidId }),
    );
    expect(
      compiled.eventByLegacyCompletionKey.has(legacyQuestId('invalidQuest')),
    ).toBe(false);
    expect(compiled.legacyCompletionKeyByEvent.has(invalidId)).toBe(false);
    expect(compiled.diagnostics.map(({ code }) => code)).toContain(
      'empty-dialogue',
    );
  });

  test('production boundary emits each structured diagnostic once without throwing', () => {
    const source = validSource();
    const invalidId = storyEventId('joao.opening.invalid');
    source.events.push({
      ...source.events[0],
      id: invalidId,
      priority: Number.NaN,
      steps: [{ type: 'dialogue', body: ' ', position: 0 }],
      legacyCompletionKey: legacyQuestId('invalidQuest'),
    });
    source.arcs[0].eventIds.push(invalidId);
    const sink = jest.fn();

    const compiled = compileProductionStoryContent(source, undefined, sink);

    expect(compiled.eventsById.has(introduction)).toBe(true);
    expect(compiled.eventsById.has(invalidId)).toBe(false);
    expect(sink.mock.calls.map(([diagnostic]) => diagnostic)).toEqual(
      compiled.diagnostics,
    );
    expect(sink).toHaveBeenCalledTimes(compiled.diagnostics.length);
    expect(sink).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        code: 'invalid-priority',
        owner: String(invalidId),
        path: 'events[1].priority',
      }),
    );
  });

  test('production exclusion uses event ownership for non-event diagnostic paths', () => {
    const source = validSource();
    const sink = jest.fn();
    const catalogs = {
      itemIds: new Set<string>(),
      portIds: new Set(['lisbon']),
      buildingIds: new Set(['house']),
      shipIds: new Set<string>(),
      sailorIds: new Set<string>(),
      mateRoles: new Set<string | number | null>(),
      parityManifest: new Map([
        ['wrongKey', String(introduction)],
      ]),
    };

    const compiled = compileProductionStoryContent(source, catalogs, sink);

    expect(compiled.eventsById.has(introduction)).toBe(false);
    expect(sink).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'parity-event-mismatch',
        path: 'parityManifest[wrongKey]',
      }),
    );
  });

  test('does not remove a valid event when relationship, arc, and event ids share one string', () => {
    const source = validSource();
    const sharedRelationshipId = relationshipId('shared');
    const sharedArcId = storyArcId('shared');
    const sharedEventId = storyEventId('shared');
    const sharedLegacyKey = legacyQuestId('sharedQuest');
    source.relationships[0] = {
      ...source.relationships[0],
      id: sharedRelationshipId,
      to: characterId('missing'),
    };
    source.arcs[0] = {
      ...source.arcs[0],
      id: sharedArcId,
      protagonist: characterId('missing-protagonist'),
      eventIds: [sharedEventId],
    };
    source.events[0] = {
      ...source.events[0],
      id: sharedEventId,
      arcId: sharedArcId,
      legacyCompletionKey: sharedLegacyKey,
    };

    const compiled = compileStoryContent(source, 'production');

    expect(compiled.diagnostics.map(({ code }) => code)).toContain(
      'missing-relationship-character',
    );
    expect(compiled.diagnostics.map(({ code }) => code)).toContain(
      'missing-arc-protagonist',
    );
    expect(compiled.eventsById.get(sharedEventId)).toBe(source.events[0]);
    expect(compiled.candidatesByScene.get('building:lisbon:house')).toContain(
      source.events[0],
    );
    expect(compiled.eventByLegacyCompletionKey.get(sharedLegacyKey)).toBe(
      sharedEventId,
    );
    expect(compiled.legacyCompletionKeyByEvent.get(sharedEventId)).toBe(
      sharedLegacyKey,
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

  test('indexes an event with no scene predicates in the all-wildcard slot', () => {
    const source = validSource();
    source.events[0].trigger = { type: 'timeWindow', min: 0, max: 60 };

    const compiled = compileStoryContent(source, 'strict');

    expect(compiled.candidatesByScene.get('-:-:-')).toEqual([source.events[0]]);
  });

  test('indexes the cross product of every scene value collected through all trees', () => {
    const source = validSource();
    source.events[0].trigger = {
      type: 'all',
      conditions: [
        { type: 'stage', stage: 'port' },
        { type: 'stage', stage: 'building' },
        { type: 'atPort', portId: 'lisbon' },
        { type: 'atPort', portId: 'seville' },
        { type: 'atBuilding', buildingId: 'house' },
        { type: 'atBuilding', buildingId: 'guild' },
      ],
    };

    const compiled = compileStoryContent(source, 'strict');

    expect([...compiled.candidatesByScene.keys()].sort()).toEqual(
      [
        'building:lisbon:guild',
        'building:lisbon:house',
        'building:seville:guild',
        'building:seville:house',
        'port:lisbon:guild',
        'port:lisbon:house',
        'port:seville:guild',
        'port:seville:house',
      ].sort(),
    );
  });

  test('does not use scene predicates nested under any or not for indexing', () => {
    const source = validSource();
    source.events[0].trigger = {
      type: 'all',
      conditions: [
        { type: 'stage', stage: 'world' },
        {
          type: 'any',
          conditions: [
            { type: 'atPort', portId: 'lisbon' },
            { type: 'atPort', portId: 'seville' },
          ],
        },
        {
          type: 'not',
          condition: { type: 'atBuilding', buildingId: 'house' },
        },
      ],
    };

    const compiled = compileStoryContent(source, 'strict');

    expect([...compiled.candidatesByScene.keys()]).toEqual(['world:-:-']);
  });
});
