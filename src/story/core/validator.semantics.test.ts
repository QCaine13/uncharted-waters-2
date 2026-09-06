import { regularPorts, supplyPorts } from '../../data/portData';
import { storyContentSource, storyValidationCatalogs } from '../content';
import {
  characterId,
  storyArcId,
  storyEventId,
  type StoryContentSource,
  type StoryDiagnostic,
} from './types';
import { compileProductionStoryContent } from './registry';
import { validateStoryContent } from './validator';

type ExpectedManifest = {
  legacyKeyToEvent: ReadonlyMap<string, string>;
  migratedEventIds: ReadonlySet<string>;
};

type ExpectedCatalogs = Omit<
  typeof storyValidationCatalogs,
  'parityManifest'
> & { parityManifest: ExpectedManifest };

const validate = validateStoryContent as unknown as (
  source: StoryContentSource,
  catalogs: ExpectedCatalogs,
) => StoryDiagnostic[];

const compileProduction = compileProductionStoryContent as unknown as (
  source: StoryContentSource,
  catalogs: ExpectedCatalogs,
  sink: (diagnostic: StoryDiagnostic) => void,
) => ReturnType<typeof compileProductionStoryContent>;

const graphFixture = (): StoryContentSource => {
  const protagonist = characterId('protagonist');
  const arcId = storyArcId('arc');
  const first = storyEventId('arc.first');
  const second = storyEventId('arc.second');
  return {
    characters: [
      {
        id: protagonist,
        names: { en: 'Protagonist' },
        role: 'protagonist',
        dialogueStyle: { color: 'blue' },
      },
    ],
    relationships: [],
    arcs: [{ id: arcId, protagonist, title: 'Arc', eventIds: [first, second] }],
    events: [
      {
        id: first,
        arcId,
        priority: 1,
        repeat: 'repeatable',
        trigger: { type: 'eventCompleted', eventId: second },
        steps: [{ type: 'dialogue', body: 'First', position: 0 }],
      },
      {
        id: second,
        arcId,
        priority: 2,
        repeat: 'repeatable',
        trigger: { type: 'eventCompleted', eventId: first },
        steps: [{ type: 'dialogue', body: 'Second', position: 0 }],
      },
    ],
  };
};

const emptyCatalogs = (eventIds: readonly string[]): ExpectedCatalogs => ({
  itemIds: new Set(),
  portIds: new Set(),
  buildingIds: new Set(),
  shipIds: new Set(),
  sailorIds: new Set(),
  mateRoles: new Set(['firstMate', 'bookKeeper', 'chiefNavigator']),
  parityManifest: {
    legacyKeyToEvent: new Map(),
    migratedEventIds: new Set(eventIds),
  },
});

describe('story validation semantic boundaries', () => {
  test('production catalog numbers regular and supply ports exactly like runtime', () => {
    const firstSupplyPortId = String(regularPorts.length + 1);
    const lastSupplyPortId = String(regularPorts.length + supplyPorts.length);

    expect(storyValidationCatalogs.portIds.has(firstSupplyPortId)).toBe(true);
    expect(storyValidationCatalogs.portIds.has(lastSupplyPortId)).toBe(true);

    const source = graphFixture();
    source.events[0].trigger = {
      type: 'atPort',
      portId: lastSupplyPortId,
    };
    source.events[1].trigger = { type: 'timeWindow', min: 0, max: 60 };
    expect(
      validate(source, {
        ...emptyCatalogs(source.events.map(({ id }) => String(id))),
        portIds: storyValidationCatalogs.portIds,
      }).map(({ code }) => code),
    ).not.toContain('unknown-port');
  });

  test('declares the exact independent 36-key and 48-event migration inventory', () => {
    expect(storyValidationCatalogs.parityManifest.legacyKeyToEvent.size).toBe(
      36,
    );
    expect(storyValidationCatalogs.parityManifest.migratedEventIds.size).toBe(
      48,
    );
    expect(
      [...storyValidationCatalogs.parityManifest.migratedEventIds].sort(),
    ).toEqual(
      storyContentSource.events
        .filter(({ arcId }) => String(arcId) === 'joao.lisbon-opening')
        .map(({ id }) => String(id))
        .sort(),
    );
    expect(
      storyContentSource.events.filter(
        ({ legacyCompletionKey }) => legacyCompletionKey !== undefined,
      ),
    ).toHaveLength(10);
  });

  test.each([0, 7, Number.NaN, null])(
    'accepts public numeric/null mate role %p',
    (role) => {
      const source = graphFixture();
      const companion = source.characters[0].id;
      source.events[0].trigger = { type: 'timeWindow', min: 0, max: 60 };
      source.events[1].trigger = { type: 'timeWindow', min: 60, max: 120 };
      source.events[0].steps = [
        {
          type: 'effect',
          effects: [{ type: 'assignMate', characterId: companion, role }],
        },
      ];

      expect(
        validate(
          source,
          emptyCatalogs(source.events.map(({ id }) => String(id))),
        ).map(({ code }) => code),
      ).not.toContain('invalid-mate-role');
    },
  );

  test('reports a real mandatory all dependency cycle', () => {
    const source = graphFixture();
    source.events[0].trigger = {
      type: 'all',
      conditions: [
        { type: 'eventCompleted', eventId: source.events[1].id },
        { type: 'atPort', portId: '1' },
      ],
    };
    const catalogs = emptyCatalogs(source.events.map(({ id }) => String(id)));
    catalogs.portIds = new Set(['1']);

    expect(validate(source, catalogs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'dependency-cycle',
          owner: 'arc.first',
          path: 'events[0].trigger',
        }),
      ]),
    );
  });

  test('does not report a runnable any pseudo-cycle', () => {
    const source = graphFixture();
    source.events[0].trigger = {
      type: 'any',
      conditions: [
        { type: 'eventCompleted', eventId: source.events[1].id },
        { type: 'atPort', portId: '1' },
      ],
    };
    const catalogs = emptyCatalogs(source.events.map(({ id }) => String(id)));
    catalogs.portIds = new Set(['1']);

    expect(validate(source, catalogs).map(({ code }) => code)).not.toContain(
      'dependency-cycle',
    );
  });

  test('preserves completion dependency polarity through not', () => {
    const singleNot = graphFixture();
    singleNot.events[0].trigger = {
      type: 'not',
      condition: {
        type: 'eventCompleted',
        eventId: singleNot.events[1].id,
      },
    };
    expect(
      validate(
        singleNot,
        emptyCatalogs(singleNot.events.map(({ id }) => String(id))),
      ).map(({ code }) => code),
    ).not.toContain('dependency-cycle');

    const doubleNot = graphFixture();
    doubleNot.events[0].trigger = {
      type: 'not',
      condition: {
        type: 'not',
        condition: {
          type: 'eventCompleted',
          eventId: doubleNot.events[1].id,
        },
      },
    };
    expect(
      validate(
        doubleNot,
        emptyCatalogs(doubleNot.events.map(({ id }) => String(id))),
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'dependency-cycle',
          owner: 'arc.first',
        }),
      ]),
    );
  });

  test('rejects a persisted key remapped to a repeatable event with both exact owners', () => {
    const persistedId = 'joao.lisbon-opening.house-introduction';
    const repeatableId = 'joao.lisbon-opening.house-guard-after-introduction';
    const legacyKeyToEvent = new Map(
      storyValidationCatalogs.parityManifest.legacyKeyToEvent,
    );
    legacyKeyToEvent.set('houseBeforeQuest', repeatableId);
    const catalogs: ExpectedCatalogs = {
      ...storyValidationCatalogs,
      parityManifest: {
        legacyKeyToEvent,
        migratedEventIds: new Set(
          storyValidationCatalogs.parityManifest.migratedEventIds,
        ),
      },
    };

    const diagnostics = validate(storyContentSource, catalogs);

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'parity-event-mismatch',
          owner: persistedId,
          path: 'events[0].legacyCompletionKey',
        }),
        expect.objectContaining({
          code: 'parity-event-mismatch',
          owner: repeatableId,
          path: 'parityManifest.legacyKeyToEvent[houseBeforeQuest]',
        }),
      ]),
    );

    const compiled = compileProduction(storyContentSource, catalogs, jest.fn());
    expect(compiled.eventsById.has(storyEventId(persistedId))).toBe(false);
    expect(compiled.eventsById.has(storyEventId(repeatableId))).toBe(false);
    expect(
      compiled.eventsById.has(
        storyEventId('joao.lisbon-opening.pub-carlotta-greeting'),
      ),
    ).toBe(true);
  });

  test.each(
    ['before', 'after'].flatMap((phase) =>
      ['1', '2', '3'].flatMap((sequence) =>
        ['bank', 'guild'].map(
          (building) =>
            `joao.lisbon-opening.ambient-${phase}-${sequence}.${building}`,
        ),
      ),
    ),
  )('detects deletion of independent ambient split %s', (splitId) => {
    const source: StoryContentSource = {
      ...storyContentSource,
      arcs: storyContentSource.arcs.map((arc) => ({
        ...arc,
        eventIds: arc.eventIds.filter((id) => String(id) !== splitId),
      })),
      events: storyContentSource.events.filter(
        ({ id }) => String(id) !== splitId,
      ),
    };

    expect(
      validate(source, storyValidationCatalogs as ExpectedCatalogs),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'parity-event-missing',
          owner: splitId,
          path: `parityManifest.migratedEventIds[${splitId}]`,
        }),
      ]),
    );
  });

  test('excludes a migrated split omitted from the manifest while retaining peers', () => {
    const splitId = 'joao.lisbon-opening.ambient-after-3.guild';
    const peerId = 'joao.lisbon-opening.ambient-after-3.bank';
    const splitIndex = storyContentSource.events.findIndex(
      ({ id }) => String(id) === splitId,
    );
    const catalogs: ExpectedCatalogs = {
      ...storyValidationCatalogs,
      parityManifest: {
        legacyKeyToEvent: new Map(
          storyValidationCatalogs.parityManifest.legacyKeyToEvent,
        ),
        migratedEventIds: new Set(
          storyValidationCatalogs.parityManifest.migratedEventIds,
        ),
      },
    };
    (catalogs.parityManifest.migratedEventIds as Set<string>).delete(splitId);

    const diagnostics = validate(storyContentSource, catalogs);
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'parity-manifest-omission',
          owner: splitId,
          path: `events[${splitIndex}].id`,
        }),
      ]),
    );

    const compiled = compileProduction(storyContentSource, catalogs, jest.fn());
    expect(compiled.eventsById.has(storyEventId(splitId))).toBe(false);
    expect(compiled.eventsById.has(storyEventId(peerId))).toBe(true);
  });
});
