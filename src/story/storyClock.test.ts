import { conditionSatisfied } from './core/resolver';
import {
  characterId,
  storyArcId,
  storyEventId,
  type StoryCondition,
  type StoryContentSource,
  type StoryContext,
} from './core/types';
import { validateStoryContent } from './core/validator';

const epoch = Date.UTC(1522, 4, 17);
const minutesAt = (
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
): number => (Date.UTC(year, month - 1, day, hours, minutes) - epoch) / 60_000;

const anchorId = storyEventId('fixture.clock.anchor');
const context = (overrides: Partial<StoryContext> = {}): StoryContext => ({
  stage: 'world',
  portId: null,
  buildingId: null,
  timePassed: minutesAt(1522, 6, 30),
  dayAtSea: 0,
  completedEvents: new Set([anchorId]),
  storyEventTimes: { [anchorId]: minutesAt(1522, 6, 28) },
  worldPosition: { x: 598, y: 645 },
  fame: { adventure: 0, pirate: 0, trade: 0 },
  items: new Set(),
  companions: new Set(),
  discoveries: new Set(),
  reportedDiscoveries: new Set(),
  combatResults: {},
  ...overrides,
});

describe('calendar story conditions', () => {
  const oneMonthAfterDayEleven: StoryCondition = {
    type: 'calendarMonthsAfterEvent',
    eventId: anchorId,
    minMonths: 1,
    minDay: 11,
  };

  test.each([
    [1522, 6, 30, false],
    [1522, 7, 10, false],
    [1522, 7, 11, true],
    [1522, 8, 1, false],
    [1522, 8, 11, true],
  ])(
    'matches month and day threshold at %i-%i-%i',
    (year, month, day, want) => {
      expect(
        conditionSatisfied(
          oneMonthAfterDayEleven,
          context({ timePassed: minutesAt(year, month, day) }),
        ),
      ).toBe(want);
    },
  );

  test('counts crossed calendar dates for day thresholds', () => {
    const condition: StoryCondition = {
      type: 'calendarDaysAfterEvent',
      eventId: anchorId,
      minDays: 1,
    };
    const lateAnchor = minutesAt(1522, 6, 28, 23, 50);

    expect(
      conditionSatisfied(
        condition,
        context({
          timePassed: minutesAt(1522, 6, 29, 9),
          storyEventTimes: { [anchorId]: lateAnchor },
        }),
      ),
    ).toBe(true);
  });

  test.each([
    [
      'missing completion',
      { completedEvents: new Set([storyEventId('other')]) },
    ],
    ['missing anchor', { storyEventTimes: {} }],
    [
      'future anchor',
      { storyEventTimes: { [anchorId]: minutesAt(1523, 1, 1) } },
    ],
    ['NaN anchor', { storyEventTimes: { [anchorId]: Number.NaN } }],
  ])('rejects a %s', (_label, override) => {
    expect(conditionSatisfied(oneMonthAfterDayEleven, context(override))).toBe(
      false,
    );
    expect(
      conditionSatisfied(
        { type: 'calendarDaysAfterEvent', eventId: anchorId, minDays: 0 },
        context(override),
      ),
    ).toBe(false);
  });
});

describe('world-area story conditions', () => {
  const area: StoryCondition = {
    type: 'withinWorldArea',
    minX: 594,
    maxX: 602,
    minY: 641,
    maxY: 649,
  };

  test.each([
    [594, 641],
    [594, 649],
    [602, 641],
    [602, 649],
  ])('includes corner (%i, %i)', (x, y) => {
    expect(conditionSatisfied(area, context({ worldPosition: { x, y } }))).toBe(
      true,
    );
  });

  test.each([
    [593, 645],
    [603, 645],
    [598, 640],
    [598, 650],
  ])('excludes outside edge (%i, %i)', (x, y) => {
    expect(conditionSatisfied(area, context({ worldPosition: { x, y } }))).toBe(
      false,
    );
  });

  test.each([
    ['missing', undefined],
    ['NaN x', { x: Number.NaN, y: 645 }],
    ['NaN y', { x: 598, y: Number.NaN }],
  ])('rejects a %s world position', (_label, worldPosition) => {
    expect(conditionSatisfied(area, context({ worldPosition }))).toBe(false);
  });
});

describe('clock and area condition validation', () => {
  const source = (): StoryContentSource => {
    const protagonist = characterId('fixture.protagonist');
    const arcId = storyArcId('fixture.clock');
    const dependentId = storyEventId('fixture.clock.dependent');
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
      arcs: [
        {
          id: arcId,
          protagonist,
          title: 'Clock fixture',
          eventIds: [anchorId, dependentId],
        },
      ],
      events: [
        {
          id: anchorId,
          arcId,
          priority: 1,
          trigger: { type: 'stage', stage: 'world' },
          repeat: 'repeatable',
          steps: [{ type: 'dialogue', body: 'Anchor.', position: 0 }],
        },
        {
          id: dependentId,
          arcId,
          priority: 2,
          trigger: {
            type: 'calendarDaysAfterEvent',
            eventId: anchorId,
            minDays: 1,
          },
          repeat: 'repeatable',
          steps: [{ type: 'dialogue', body: 'Dependent.', position: 0 }],
        },
      ],
    };
  };

  test.each([
    [
      'unknown month anchor',
      {
        type: 'calendarMonthsAfterEvent',
        eventId: storyEventId('missing'),
        minMonths: 1,
        minDay: 1,
      },
      'missing-condition-event',
      'events[1].trigger.eventId',
    ],
    [
      'fractional months',
      {
        type: 'calendarMonthsAfterEvent',
        eventId: anchorId,
        minMonths: 1.5,
        minDay: 1,
      },
      'invalid-calendar-months',
      'events[1].trigger.minMonths',
    ],
    [
      'day zero',
      {
        type: 'calendarMonthsAfterEvent',
        eventId: anchorId,
        minMonths: 1,
        minDay: 0,
      },
      'invalid-calendar-day',
      'events[1].trigger.minDay',
    ],
    [
      'fractional days',
      {
        type: 'calendarDaysAfterEvent',
        eventId: anchorId,
        minDays: 0.5,
      },
      'invalid-calendar-days',
      'events[1].trigger.minDays',
    ],
    [
      'reversed x bounds',
      {
        type: 'withinWorldArea',
        minX: 603,
        maxX: 602,
        minY: 641,
        maxY: 649,
      },
      'invalid-world-area',
      'events[1].trigger',
    ],
    [
      'x outside the map',
      {
        type: 'withinWorldArea',
        minX: 0,
        maxX: 2160,
        minY: 0,
        maxY: 1079,
      },
      'invalid-world-area',
      'events[1].trigger',
    ],
    [
      'y outside the map',
      {
        type: 'withinWorldArea',
        minX: 0,
        maxX: 2159,
        minY: -1,
        maxY: 1079,
      },
      'invalid-world-area',
      'events[1].trigger',
    ],
    [
      'non-finite bounds',
      {
        type: 'withinWorldArea',
        minX: 0,
        maxX: Number.POSITIVE_INFINITY,
        minY: 0,
        maxY: 1079,
      },
      'invalid-world-area',
      'events[1].trigger',
    ],
  ] as const)('rejects %s', (_label, trigger, code, path) => {
    const fixture = source();
    fixture.events[1].trigger = trigger;

    expect(validateStoryContent(fixture)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code, path })]),
    );
  });

  test('accepts map-edge bounds and integer clock thresholds', () => {
    const fixture = source();
    fixture.events[1].trigger = {
      type: 'all',
      conditions: [
        {
          type: 'calendarMonthsAfterEvent',
          eventId: anchorId,
          minMonths: 0,
          minDay: 31,
        },
        { type: 'withinWorldArea', minX: 0, maxX: 2159, minY: 0, maxY: 1079 },
      ],
    };

    expect(validateStoryContent(fixture)).toEqual([]);
  });
});
