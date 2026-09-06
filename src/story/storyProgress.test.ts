import { landmarks } from '../data/discoveryData';
import { load, save } from '../state/saveLoad';
import state, { SAVED_STATE_KEY, type State } from '../state/state';
import { compiledStoryContent } from '.';
import updateInterface from '../state/updateInterface';
import { executeStoryEffects } from './core/effects';
import {
  conditionSatisfied,
  createStoryContext,
  resolveStoryEvent,
} from './core/resolver';
import {
  characterId,
  storyArcId,
  storyEventId,
  type StoryContentSource,
  type StoryContext,
} from './core/types';
import { validateStoryContent } from './core/validator';
import { storyValidationCatalogs } from './content/catalogs';
import { storyRuntimeActions } from './storyRuntimeActions';

const context = (overrides: Partial<StoryContext> = {}): StoryContext => ({
  stage: 'world',
  portId: null,
  buildingId: null,
  timePassed: 0,
  dayAtSea: 0,
  completedEvents: new Set(),
  fame: { adventure: 0, pirate: 0, trade: 0 },
  items: new Set(),
  companions: new Set(),
  discoveries: new Set(),
  reportedDiscoveries: new Set(),
  ...overrides,
});

const semanticSource = (): StoryContentSource => {
  const protagonist = characterId('fixture.protagonist');
  const arcId = storyArcId('fixture.arc');
  const eventId = storyEventId('fixture.arc.once');
  return {
    characters: [
      {
        id: protagonist,
        names: { en: 'Fixture' },
        role: 'protagonist',
        dialogueStyle: { color: 'blue' },
      },
    ],
    relationships: [],
    arcs: [{ id: arcId, protagonist, title: 'Fixture', eventIds: [eventId] }],
    events: [
      {
        id: eventId,
        arcId,
        priority: 1,
        trigger: { type: 'stage', stage: 'world' },
        repeat: 'once',
        steps: [{ type: 'dialogue', body: 'Once.', position: 0 }],
      },
    ],
  };
};

describe('semantic story progress', () => {
  beforeEach(() => {
    window.localStorage.clear();
    state.portId = '1';
    state.buildingId = '8';
    state.timePassed = 0;
    state.dayAtSea = 0;
    state.quests = [];
    state.storyEvents = [];
    state.discoveries = [];
    state.reportedDiscoveries = [];
    updateInterface.general = jest.fn();
  });

  test('round-trips semantic progress including unknown future IDs', () => {
    state.storyEvents = ['fixture.arc.once', 'future.arc.unknown'];
    state.reportedDiscoveries = ['strait-of-gibraltar', 'future-discovery-id'];

    save();
    state.storyEvents = [];
    state.reportedDiscoveries = [];

    expect(load()).toBe(true);
    expect(state.storyEvents).toEqual([
      'fixture.arc.once',
      'future.arc.unknown',
    ]);
    expect(state.reportedDiscoveries).toEqual([
      'strait-of-gibraltar',
      'future-discovery-id',
    ]);
  });

  test('defaults missing v5 progress arrays at the load boundary', () => {
    window.localStorage.setItem(
      SAVED_STATE_KEY,
      JSON.stringify({
        version: 5,
        portId: '1',
        buildingId: null,
        timePassed: 0,
        fleets: {},
        dayAtSea: 0,
        gold: 0,
        quests: [],
        usedShipsAtPort: {},
        savings: 0,
        debt: 0,
        items: [],
        mates: [],
        fame: { adventure: 0, pirate: 0, trade: 0 },
        marketPrices: {},
        discoveries: [],
      }),
    );

    expect(load()).toBe(true);
    expect(state.storyEvents).toEqual([]);
    expect(state.reportedDiscoveries).toEqual([]);
  });

  test('records a registered semantic-only completion idempotently', () => {
    const eventId = storyEventId(
      'joao.lisbon-opening.house-guard-after-introduction',
    );
    expect(compiledStoryContent.eventsById.has(eventId)).toBe(true);
    expect(compiledStoryContent.legacyCompletionKeyByEvent.has(eventId)).toBe(
      false,
    );

    expect(
      executeStoryEffects(
        [{ type: 'completeEvent', eventId }],
        storyRuntimeActions,
      ),
    ).toEqual({ ok: true, executed: 1 });
    executeStoryEffects(
      [{ type: 'completeEvent', eventId }],
      storyRuntimeActions,
    );

    expect(state.storyEvents).toEqual([
      'joao.lisbon-opening.house-guard-after-introduction',
    ]);
    expect(state.quests).toEqual([]);
  });

  test('records semantic and legacy completion for Lisbon exactly once', () => {
    const eventId = storyEventId('joao.lisbon-opening.house-introduction');

    executeStoryEffects(
      [{ type: 'completeEvent', eventId }],
      storyRuntimeActions,
    );
    executeStoryEffects(
      [{ type: 'completeEvent', eventId }],
      storyRuntimeActions,
    );

    expect(state.storyEvents).toEqual([
      'joao.lisbon-opening.house-introduction',
    ]);
    expect(state.quests).toEqual(['houseBeforeQuest']);
  });

  test('unions semantic and legacy completion when resolving once events', () => {
    state.storyEvents = ['joao.lisbon-opening.house-introduction'];
    state.quests = [];

    const next = resolveStoryEvent(
      createStoryContext(state, compiledStoryContent),
      compiledStoryContent,
      ([first]) => first,
    );

    expect(next?.id).not.toBe('joao.lisbon-opening.house-introduction');
  });

  test('uses consecutive sea days rather than elapsed calendar days', () => {
    const threeSeaDays = context({ dayAtSea: 3, timePassed: 0 });
    const thirtyCalendarDays = context({
      dayAtSea: 0,
      timePassed: 30 * 1440,
    });

    expect(
      conditionSatisfied({ type: 'daysAtSea', min: 3 }, threeSeaDays),
    ).toBe(true);
    expect(
      conditionSatisfied({ type: 'daysAtSea', min: 3 }, thirtyCalendarDays),
    ).toBe(false);
  });

  test('matches discovered and reported discovery membership independently', () => {
    const discoveryId = 'strait-of-gibraltar';
    const current = context({
      discoveries: new Set([discoveryId]),
      reportedDiscoveries: new Set(),
    });

    expect(
      conditionSatisfied({ type: 'hasDiscovery', discoveryId }, current),
    ).toBe(true);
    expect(
      conditionSatisfied(
        { type: 'hasReportedDiscovery', discoveryId },
        current,
      ),
    ).toBe(false);
  });

  test('defaults missing progress fields at the story runtime boundary', () => {
    const partial = {
      portId: null,
      buildingId: null,
      timePassed: 30 * 1440,
      quests: [],
      items: [],
      mates: [],
      fame: { adventure: 0, pirate: 0, trade: 0 },
    } as unknown as State;

    const result = createStoryContext(partial, compiledStoryContent);

    expect(result.dayAtSea).toBe(0);
    expect(result.completedEvents).toEqual(new Set());
    expect(result.discoveries).toEqual(new Set());
    expect(result.reportedDiscoveries).toEqual(new Set());
  });
});

describe('extensible story condition validation', () => {
  test('allows semantic once events without a legacy completion key', () => {
    expect(validateStoryContent(semanticSource())).toEqual([]);
  });

  test.each([
    { min: -1 },
    { max: Number.POSITIVE_INFINITY },
    { min: 4, max: 3 },
  ])('rejects invalid sea-day range %#', (range) => {
    const source = semanticSource();
    source.events[0].trigger = { type: 'daysAtSea', ...range };

    expect(validateStoryContent(source)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'invalid-days-at-sea-range',
          path: 'events[0].trigger',
        }),
      ]),
    );
  });

  test.each(['hasDiscovery', 'hasReportedDiscovery'] as const)(
    'rejects an unknown discovery referenced by %s',
    (type) => {
      const source = semanticSource();
      source.events[0].trigger = { type, discoveryId: 'missing-landmark' };
      const catalogs = {
        itemIds: new Set<string>(),
        portIds: new Set<string>(),
        buildingIds: new Set<string>(),
        shipIds: new Set<string>(),
        sailorIds: new Set<string>(),
        mateRoles: new Set<string | number | null>(),
        discoveryIds: new Set(landmarks.map(({ id }) => id)),
        parityManifest: {
          legacyKeyToEvent: new Map<string, string>(),
          migratedEventIds: new Set<string>(),
        },
      };

      expect(validateStoryContent(source, catalogs)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'unknown-discovery',
            path: 'events[0].trigger.discoveryId',
          }),
        ]),
      );
    },
  );

  test('production discovery catalog accepts every shipped landmark', () => {
    expect(storyValidationCatalogs.discoveryIds).toEqual(
      new Set(landmarks.map(({ id }) => id)),
    );
  });

  test('still rejects a migrated once event whose legacy key is removed', () => {
    const source: StoryContentSource = {
      ...semanticSource(),
      events: semanticSource().events.map((event) => ({
        ...event,
        id: storyEventId('legacy.once'),
      })),
    };
    source.arcs[0].eventIds = [source.events[0].id];
    const catalogs = {
      itemIds: new Set<string>(),
      portIds: new Set<string>(),
      buildingIds: new Set<string>(),
      shipIds: new Set<string>(),
      sailorIds: new Set<string>(),
      mateRoles: new Set<string | number | null>(),
      parityManifest: {
        legacyKeyToEvent: new Map([['legacyQuest', 'legacy.once']]),
        migratedEventIds: new Set(['legacy.once']),
      },
    };

    expect(validateStoryContent(source, catalogs)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'once-without-legacy-key',
          path: 'events[0].legacyCompletionKey',
        }),
      ]),
    );
  });
});
