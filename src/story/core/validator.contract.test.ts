import {
  characterId,
  legacyQuestId,
  storyArcId,
  storyEventId,
  type StoryContentSource,
  type StoryDiagnostic,
  type StoryEffect,
} from './types';
import { validateStoryContent } from './validator';
import { compileProductionStoryContent } from './registry';

/* eslint-disable no-param-reassign, prefer-destructuring -- invalid-fixture mutators operate on fresh data */

const joao = characterId('joao');
const rocco = characterId('rocco');
const opening = storyArcId('joao.opening');
const introduction = storyEventId('joao.opening.introduction');

const sourceFixture = (): StoryContentSource => ({
  characters: [
    {
      id: joao,
      names: { en: 'Joao' },
      role: 'protagonist',
      dialogueStyle: { color: 'blue' },
      sailorId: '1',
      legacyCharacterId: 'legacy-joao',
    },
    {
      id: rocco,
      names: { en: 'Rocco' },
      role: 'companion',
      dialogueStyle: { color: 'green' },
      sailorId: '32',
      legacyCharacterId: 'legacy-rocco',
    },
  ],
  relationships: [],
  arcs: [
    {
      id: opening,
      protagonist: joao,
      title: 'Opening',
      eventIds: [introduction],
    },
  ],
  events: [
    {
      id: introduction,
      arcId: opening,
      priority: 10,
      repeat: 'once',
      legacyCompletionKey: legacyQuestId('houseBeforeQuest'),
      trigger: {
        type: 'all',
        conditions: [
          { type: 'atPort', portId: '1' },
          { type: 'atBuilding', buildingId: '8' },
          { type: 'hasItem', itemId: '4' },
        ],
      },
      steps: [
        { type: 'dialogue', body: 'Welcome.', position: 1, speaker: rocco },
        {
          type: 'effect',
          effects: [
            { type: 'receiveGold', amount: 100 },
            { type: 'receiveItem', itemId: '4' },
            { type: 'receiveShip', shipId: '6', name: 'Hermes II' },
            { type: 'assignMate', characterId: rocco, role: 'firstMate' },
            { type: 'setPort', portId: '1' },
          ],
        },
      ],
    },
  ],
});

const catalogs = {
  itemIds: new Set(['4']),
  portIds: new Set(['1']),
  buildingIds: new Set(['8']),
  shipIds: new Set(['6']),
  sailorIds: new Set(['1', '32']),
  encounterIds: new Set(['joao.m2.kahn-house']),
  mateRoles: new Set(['firstMate', 'bookKeeper', 'chiefNavigator']),
  parityManifest: {
    legacyKeyToEvent: new Map([['houseBeforeQuest', String(introduction)]]),
    migratedEventIds: new Set([String(introduction)]),
  },
};

const validate = validateStoryContent as unknown as (
  source: StoryContentSource,
  validationCatalogs: typeof catalogs,
) => StoryDiagnostic[];

type Case = {
  code: string;
  path: string;
  mutate: (source: StoryContentSource, localCatalogs: typeof catalogs) => void;
};

const cases: Case[] = [
  { code: 'empty-arcs', path: 'arcs', mutate: (source) => { source.arcs = []; } },
  { code: 'empty-events', path: 'events', mutate: (source) => { source.events = []; } },
  { code: 'empty-arc-events', path: 'arcs[0].eventIds', mutate: (source) => { source.arcs[0].eventIds = []; } },
  { code: 'empty-event-steps', path: 'events[0].steps', mutate: (source) => { source.events[0].steps = []; } },
  {
    code: 'empty-option-steps',
    path: 'events[0].steps[0].options[0].steps',
    mutate: (source) => {
      source.events[0].steps = [{ type: 'choice', prompt: 'Go?', position: 0, options: [{ id: 'yes', label: 'Yes', steps: [] }] }];
    },
  },
  {
    code: 'missing-position-speaker',
    path: 'events[0].steps[0].speaker',
    mutate: (source) => { source.events[0].steps = [{ type: 'dialogue', body: 'Who?', position: 1 }]; },
  },
  {
    code: 'missing-position-speaker',
    path: 'events[0].steps[0].speaker',
    mutate: (source) => { source.events[0].steps = [{ type: 'choice', prompt: 'Who?', position: 2, options: [{ id: 'x', label: 'X', steps: [{ type: 'dialogue', body: 'X', position: 0 }] }] }]; },
  },
  { code: 'unknown-port', path: 'events[0].trigger.portId', mutate: (source) => { source.events[0].trigger = { type: 'atPort', portId: 'missing' }; } },
  { code: 'unknown-building', path: 'events[0].trigger.conditions[1].buildingId', mutate: (source) => { const trigger = source.events[0].trigger; if (trigger.type === 'all') trigger.conditions[1] = { type: 'atBuilding', buildingId: 'missing' }; } },
  { code: 'unknown-item', path: 'events[0].trigger.conditions[2].itemId', mutate: (source) => { const trigger = source.events[0].trigger; if (trigger.type === 'all') trigger.conditions[2] = { type: 'hasItem', itemId: 'missing' as '4' }; } },
  { code: 'unknown-item', path: 'events[0].steps[1].effects[1].itemId', mutate: (source) => { const step = source.events[0].steps[1]; if (step.type === 'effect') step.effects[1] = { type: 'receiveItem', itemId: 'missing' as '4' }; } },
  { code: 'unknown-item', path: 'events[0].steps[1].effects[1].itemId', mutate: (source) => { const step = source.events[0].steps[1]; if (step.type === 'effect') step.effects[1] = { type: 'consumeItem', itemId: 'missing' } as unknown as StoryEffect; } },
  { code: 'unknown-ship', path: 'events[0].steps[1].effects[2].shipId', mutate: (source) => { const step = source.events[0].steps[1]; if (step.type === 'effect') step.effects[2] = { type: 'receiveShip', shipId: 'missing', name: 'Ship' }; } },
  { code: 'unknown-port', path: 'events[0].steps[1].effects[4].portId', mutate: (source) => { const step = source.events[0].steps[1]; if (step.type === 'effect') step.effects[4] = { type: 'setPort', portId: 'missing' }; } },
  { code: 'invalid-gold', path: 'events[0].steps[1].effects[0].amount', mutate: (source) => { const step = source.events[0].steps[1]; if (step.type === 'effect') step.effects[0] = { type: 'receiveGold', amount: -1 }; } },
  { code: 'invalid-gold', path: 'events[0].steps[1].effects[0].amount', mutate: (source) => { const step = source.events[0].steps[1]; if (step.type === 'effect') step.effects[0] = { type: 'receiveGold', amount: Number.POSITIVE_INFINITY }; } },
  { code: 'invalid-priority', path: 'events[0].priority', mutate: (source) => { source.events[0].priority = Number.NaN; } },
  { code: 'invalid-priority', path: 'events[0].priority', mutate: (source) => { source.events[0].priority = -1; } },
  { code: 'invalid-ship-name', path: 'events[0].steps[1].effects[2].name', mutate: (source) => { const step = source.events[0].steps[1]; if (step.type === 'effect') step.effects[2] = { type: 'receiveShip', shipId: '6', name: ' ' }; } },
  { code: 'invalid-mate-role', path: 'events[0].steps[1].effects[3].role', mutate: (source) => { const step = source.events[0].steps[1]; if (step.type === 'effect') step.effects[3] = { type: 'assignMate', characterId: rocco, role: 'captain' as never }; } },
  { code: 'duplicate-sailor-link', path: 'characters[1].sailorId', mutate: (source) => { source.characters[1].sailorId = '1'; } },
  { code: 'duplicate-legacy-character-link', path: 'characters[1].legacyCharacterId', mutate: (source) => { source.characters[1].legacyCharacterId = 'legacy-joao'; } },
  { code: 'unknown-sailor', path: 'characters[1].sailorId', mutate: (source) => { source.characters[1].sailorId = 'missing'; } },
  { code: 'parity-event-missing', path: 'parityManifest.legacyKeyToEvent[houseBeforeQuest]', mutate: (_source, local) => { local.parityManifest.legacyKeyToEvent.set('houseBeforeQuest', 'missing-event'); } },
  { code: 'parity-manifest-omission', path: 'events[0].legacyCompletionKey', mutate: (_source, local) => { local.parityManifest.legacyKeyToEvent.delete('houseBeforeQuest'); } },
];

describe('complete story content validation contract', () => {
  test.each(cases)('reports $code at exact $path', ({ code, path, mutate }) => {
    const source = sourceFixture();
    const localCatalogs = {
      ...catalogs,
      itemIds: new Set(catalogs.itemIds),
      portIds: new Set(catalogs.portIds),
      buildingIds: new Set(catalogs.buildingIds),
      shipIds: new Set(catalogs.shipIds),
      sailorIds: new Set(catalogs.sailorIds),
      encounterIds: new Set(catalogs.encounterIds),
      mateRoles: new Set(catalogs.mateRoles),
      parityManifest: {
        legacyKeyToEvent: new Map(catalogs.parityManifest.legacyKeyToEvent),
        migratedEventIds: new Set(catalogs.parityManifest.migratedEventIds),
      },
    };
    mutate(source, localCatalogs);
    expect(validate(source, localCatalogs)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code, path })]),
    );
  });

  test('reports dependency cycles and direct completion contradictions', () => {
    const source = sourceFixture();
    const second = storyEventId('joao.opening.second');
    source.events[0].trigger = { type: 'eventCompleted', eventId: second };
    source.events.push({
      ...source.events[0],
      id: second,
      priority: 20,
      legacyCompletionKey: legacyQuestId('second'),
      trigger: {
        type: 'all',
        conditions: [
          { type: 'eventCompleted', eventId: introduction },
          { type: 'not', condition: { type: 'eventCompleted', eventId: introduction } },
        ],
      },
    });
    source.arcs[0].eventIds.push(second);
    const localCatalogs = {
      ...catalogs,
      parityManifest: {
        legacyKeyToEvent: new Map([
          ['houseBeforeQuest', String(introduction)],
          ['second', String(second)],
        ]),
        migratedEventIds: new Set([String(introduction), String(second)]),
      },
    };

    expect(validate(source, localCatalogs)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'dependency-cycle', path: 'events[1].trigger' }),
      expect.objectContaining({ code: 'contradictory-condition', path: 'events[1].trigger' }),
    ]));
  });

  test('returns every diagnostic in one pass and accepts a valid source', () => {
    expect(validate(sourceFixture(), catalogs)).toEqual([]);
    const source = sourceFixture();
    source.arcs = [];
    source.events[0].priority = -1;
    expect(validate(source, catalogs).map(({ code }) => code)).toEqual(expect.arrayContaining([
      'empty-arcs', 'event-arc-mismatch', 'invalid-priority',
    ]));
  });

  test('validates combat encounter references and terminal start placement', () => {
    const source = sourceFixture();
    source.events[0].trigger = {
      type: 'combatResolved',
      encounterId: 'missing-encounter',
      outcomes: ['victory'],
    };
    source.events[0].steps = [
      {
        type: 'effect',
        effects: [
          { type: 'startCombat', encounterId: 'missing-encounter' },
          { type: 'receiveGold', amount: 1 },
        ],
      },
    ];

    expect(validate(source, catalogs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'unknown-encounter',
          path: 'events[0].trigger.encounterId',
        }),
        expect.objectContaining({
          code: 'unknown-encounter',
          path: 'events[0].steps[0].effects[0].encounterId',
        }),
        expect.objectContaining({
          code: 'non-terminal-combat-start',
          path: 'events[0].steps[0].effects[0]',
        }),
      ]),
    );
  });

  test('accepts an explicit save after the final non-save combat effect', () => {
    const source = sourceFixture();
    source.events[0].steps = [
      {
        type: 'effect',
        effects: [
          { type: 'receiveFame', fame: 'adventure', amount: 100 },
          { type: 'removeCompanion', characterId: rocco },
          { type: 'startCombat', encounterId: 'joao.m2.kahn-house' },
          { type: 'save' },
        ],
      },
    ];

    expect(validate(source, catalogs)).toEqual([]);
  });

  test.each(
    cases.filter(({ code }) =>
      [
        'empty-event-steps',
        'empty-option-steps',
        'missing-position-speaker',
        'unknown-port',
        'unknown-building',
        'unknown-item',
        'unknown-ship',
        'invalid-gold',
        'invalid-priority',
        'invalid-ship-name',
        'invalid-mate-role',
        'parity-manifest-omission',
      ].includes(code),
    ),
  )('production excludes event-owned $code while retaining valid content', ({ mutate }) => {
    const source = sourceFixture();
    const validId = storyEventId('joao.opening.valid-sentinel');
    source.events.push({
      ...source.events[0],
      id: validId,
      priority: 99,
      repeat: 'repeatable',
      legacyCompletionKey: undefined,
      trigger: { type: 'timeWindow', min: 60, max: 120 },
      steps: [{ type: 'dialogue', body: 'Still valid.', position: 0 }],
    });
    source.arcs[0].eventIds.push(validId);
    const localCatalogs = {
      ...catalogs,
      itemIds: new Set(catalogs.itemIds),
      portIds: new Set(catalogs.portIds),
      buildingIds: new Set(catalogs.buildingIds),
      shipIds: new Set(catalogs.shipIds),
      sailorIds: new Set(catalogs.sailorIds),
      encounterIds: new Set(catalogs.encounterIds),
      mateRoles: new Set(catalogs.mateRoles),
      parityManifest: {
        legacyKeyToEvent: new Map(catalogs.parityManifest.legacyKeyToEvent),
        migratedEventIds: new Set(catalogs.parityManifest.migratedEventIds),
      },
    };
    localCatalogs.parityManifest.migratedEventIds.add(String(validId));
    mutate(source, localCatalogs);

    const compiled = compileProductionStoryContent(
      source,
      localCatalogs,
      jest.fn(),
    );

    expect(compiled.eventsById.has(introduction)).toBe(false);
    expect(compiled.eventsById.has(validId)).toBe(true);
  });

  test('production excludes cycle and contradiction owners without cascading to valid events', () => {
    const source = sourceFixture();
    const second = storyEventId('joao.opening.second');
    const validId = storyEventId('joao.opening.valid-sentinel');
    source.events[0].trigger = { type: 'eventCompleted', eventId: second };
    source.events.push(
      {
        ...source.events[0],
        id: second,
        priority: 20,
        legacyCompletionKey: legacyQuestId('second'),
        trigger: {
          type: 'all',
          conditions: [
            { type: 'eventCompleted', eventId: introduction },
            {
              type: 'not',
              condition: { type: 'eventCompleted', eventId: introduction },
            },
          ],
        },
      },
      {
        ...source.events[0],
        id: validId,
        priority: 30,
        repeat: 'repeatable',
        legacyCompletionKey: undefined,
        trigger: { type: 'timeWindow', min: 60, max: 120 },
      },
    );
    source.arcs[0].eventIds.push(second, validId);
    const localCatalogs = {
      ...catalogs,
      parityManifest: {
        legacyKeyToEvent: new Map([
          ['houseBeforeQuest', String(introduction)],
          ['second', String(second)],
        ]),
        migratedEventIds: new Set([
          String(introduction),
          String(second),
          String(validId),
        ]),
      },
    };

    const compiled = compileProductionStoryContent(
      source,
      localCatalogs,
      jest.fn(),
    );

    expect(compiled.eventsById.has(introduction)).toBe(false);
    expect(compiled.eventsById.has(second)).toBe(false);
    expect(compiled.eventsById.has(validId)).toBe(true);
  });
});
