import { regularPorts } from '../data/portData';
import { compiledStoryContent } from '.';
import { resolveStoryEvent } from './core/resolver';
import { characterId, storyEventId, type StoryContext } from './core/types';
import {
  AMAZON_BATTLE_AREA,
  JOAO_ENDING_EVENT_ID,
  SOUTH_AMERICAN_PORT_IDS,
} from './content/arcs/joao/finale';

const prefix = 'joao.finale.';
const id = (suffix: string) => storyEventId(`${prefix}${suffix}`);
const priorComplete = (): string[] =>
  [...compiledStoryContent.eventsById.keys()]
    .map(String)
    .filter((eventId) => !eventId.startsWith(prefix));

const minutesAt = (
  year: number,
  month: number,
  day: number,
  hour = 10,
  minute = 0,
): number =>
  (Date.UTC(year, month - 1, day, hour, minute) - Date.UTC(1522, 4, 17)) /
  60_000;

const context = (
  overrides: Partial<StoryContext> & { completed?: string[] } = {},
): StoryContext => ({
  stage: 'world',
  portId: null,
  buildingId: null,
  timePassed: minutesAt(1523, 1, 2),
  dayAtSea: 0,
  completedEvents: new Set(
    (overrides.completed ?? priorComplete()).map(storyEventId),
  ),
  storyEventTimes: {},
  worldPosition: { x: 900, y: 400 },
  fame: { adventure: 0, pirate: 0, trade: 0 },
  items: new Set(),
  companions: new Set(),
  discoveries: new Set(),
  reportedDiscoveries: new Set(),
  combatResults: {},
  ...overrides,
});

const building = (
  portId: string,
  buildingId: string,
  completed: string[],
  overrides: Partial<StoryContext> = {},
): StoryContext =>
  context({
    stage: 'building',
    portId,
    buildingId,
    completed,
    ...overrides,
  });

const completedThrough = (suffix: string): string[] => {
  const order = [
    'japan-request',
    'enrico-farewell',
    'letter-notice',
    'enrico-letter',
    'sakai-lead',
    'south-america-arrival',
    'rudolph-start',
    'lucia-rescued',
    'martinez-exposed',
    'spanish-alliance',
    'amazon-start',
    'amazon-victory',
    'homecoming',
  ];
  const index = order.indexOf(suffix);
  if (index < 0) throw new Error(`Unknown milestone ${suffix}`);
  return [
    ...priorComplete(),
    ...order.slice(0, index + 1).map((part) => `${prefix}${part}`),
  ];
};

const resolve = (candidate: StoryContext): string | null =>
  resolveStoryEvent(candidate, compiledStoryContent, ([first]) => first)?.id ??
  null;

describe('João finale resolver graph', () => {
  test('exports the stable ending, South American market, and inclusive Amazon area interfaces', () => {
    expect(JOAO_ENDING_EVENT_ID).toBe('joao.finale.homecoming');
    expect(SOUTH_AMERICAN_PORT_IDS).toEqual([
      '43',
      '44',
      '46',
      '53',
      '54',
      '55',
      '57',
    ]);
    expect(
      regularPorts
        .map((port, index) => ({ port, id: String(index + 1) }))
        .filter(({ port }) => port.marketId === '8')
        .map(({ id: portId }) => portId),
    ).toEqual(SOUTH_AMERICAN_PORT_IDS);
    expect(AMAZON_BATTLE_AREA).toEqual({
      minX: 594,
      maxX: 602,
      minY: 641,
      maxY: 649,
    });
  });

  test('offers Japan repeatedly only in a pub outside the Far East while Enrico is aboard', () => {
    const completed = priorComplete();
    const companions = new Set([characterId('enrico')]);
    regularPorts.forEach((port, index) => {
      const resolved = resolve(
        building(String(index + 1), '2', completed, { companions }),
      );
      if (port.regionId === '8') {
        expect(resolved).not.toBe(id('japan-request'));
      } else {
        expect(resolved).toBe(id('japan-request'));
      }
    });
    expect(resolve(building('999', '2', completed, { companions }))).toBeNull();
    expect(
      resolve(context({ stage: 'building', buildingId: '2', companions })),
    ).toBeNull();
    expect(resolve(building('1', '7', completed, { companions }))).not.toBe(
      id('japan-request'),
    );
    expect(resolve(building('1', '2', completed))).not.toBe(
      id('japan-request'),
    );
  });

  test('orders the Japan farewell, Lisbon notice and guild letter, and Sakai guild lead', () => {
    const request = completedThrough('japan-request');
    expect(
      resolve(
        building('100', '4', request, {
          companions: new Set([characterId('enrico')]),
        }),
      ),
    ).toBe(id('enrico-farewell'));
    expect(resolve(building('99', '4', request))).toBeNull();

    const farewell = completedThrough('enrico-farewell');
    expect(resolve(building('1', '2', farewell))).toBe(id('letter-notice'));
    expect(resolve(building('1', '7', farewell))).toBe(id('letter-notice'));
    expect(resolve(building('2', '7', farewell))).toBeNull();

    const notice = completedThrough('letter-notice');
    expect(resolve(building('1', '7', notice))).toBe(id('enrico-letter'));
    expect(resolve(building('1', '11', notice))).not.toBe(id('enrico-letter'));

    const letter = completedThrough('enrico-letter');
    expect(resolve(building('99', '7', letter))).toBe(id('sakai-lead'));
    expect(resolve(building('99', '11', letter))).toBeNull();
    expect(resolve(building('100', '7', letter))).toBeNull();
  });

  test('latches South American arrival outside the pub then starts Rudolph deterministically in every eligible pub', () => {
    const sakai = completedThrough('sakai-lead');
    SOUTH_AMERICAN_PORT_IDS.forEach((portId) => {
      expect(resolve(building(portId, '5', sakai))).toBe(
        id('south-america-arrival'),
      );
      expect(resolve(building(portId, '2', sakai))).toBeNull();
    });
    expect(resolve(building('45', '5', sakai))).toBeNull();
    expect(resolve(building('999', '5', sakai))).toBeNull();
    expect(
      resolve(
        context({ stage: 'building', buildingId: '5', completed: sakai }),
      ),
    ).toBeNull();

    const arrival = completedThrough('south-america-arrival');
    SOUTH_AMERICAN_PORT_IDS.forEach((portId) => {
      expect(resolve(building(portId, '2', arrival))).toBe(id('rudolph-start'));
    });
    expect(resolve(building('45', '2', arrival))).toBeNull();
  });

  test.each(['victory', 'defeat', 'draw'] as const)(
    'rescues Lucia after a real Rudolph %s',
    (outcome) => {
      const started = completedThrough('rudolph-start');
      expect(
        resolve(
          building('57', '2', started, {
            combatResults: { 'joao.m3.rudolph': outcome },
          }),
        ),
      ).toBe(id('lucia-rescued'));
    },
  );

  test('does not rescue Lucia before Rudolph resolves or outside an eligible pub', () => {
    const started = completedThrough('rudolph-start');
    expect(resolve(building('57', '2', started))).toBeNull();
    expect(
      resolve(
        building('57', '4', started, {
          combatResults: { 'joao.m3.rudolph': 'victory' },
        }),
      ),
    ).toBeNull();
    expect(
      resolve(
        building('45', '2', started, {
          combatResults: { 'joao.m3.rudolph': 'victory' },
        }),
      ),
    ).toBeNull();
  });

  test('exposes Martinez only at an eligible harbor after Lucia is free', () => {
    const rescued = completedThrough('lucia-rescued');
    expect(resolve(building('43', '4', rescued))).toBe(id('martinez-exposed'));
    expect(resolve(building('43', '2', rescued))).toBeNull();
    expect(resolve(building('45', '4', rescued))).toBeNull();
  });

  test.each([
    ['same-day 10:00', [1522, 12, 31, 10, 0], 'rendezvous-wait'],
    ['next-day 08:59', [1523, 1, 1, 8, 59], 'rendezvous-wait'],
    ['next-day 09:00', [1523, 1, 1, 9, 0], 'spanish-alliance'],
    ['next-day 14:59', [1523, 1, 1, 14, 59], 'spanish-alliance'],
    ['next-day 15:00', [1523, 1, 1, 15, 0], 'rendezvous-wait'],
    ['later-day 14:59', [1523, 1, 3, 14, 59], 'spanish-alliance'],
  ] as const)(
    'uses the saved daily appointment across year rollover at %s',
    (_label, now, expected) => {
      const exposed = completedThrough('martinez-exposed');
      expect(
        resolve(
          building('57', '4', exposed, {
            timePassed: minutesAt(now[0], now[1], now[2], now[3], now[4]),
            storyEventTimes: {
              [id('martinez-exposed')]: minutesAt(1522, 12, 31, 10),
            },
          }),
        ),
      ).toBe(id(expected));
    },
  );

  test('retires rendezvous advice after the alliance and starts the final fleet only inside the Amazon area', () => {
    const alliance = completedThrough('spanish-alliance');
    expect(
      resolve(
        building('57', '4', alliance, {
          timePassed: minutesAt(1523, 1, 4, 8),
        }),
      ),
    ).toBeNull();
    expect(
      resolve(
        context({
          completed: alliance,
          worldPosition: { x: 594, y: 641 },
        }),
      ),
    ).toBe(id('amazon-start'));
    expect(
      resolve(
        context({
          completed: alliance,
          worldPosition: { x: 602, y: 649 },
        }),
      ),
    ).toBe(id('amazon-start'));
    expect(
      resolve(
        context({
          completed: alliance,
          worldPosition: { x: 603, y: 649 },
        }),
      ),
    ).toBeNull();
  });

  test('opens the same daily appointment window across an ordinary month boundary', () => {
    const exposed = completedThrough('martinez-exposed');
    const storyEventTimes = {
      [id('martinez-exposed')]: minutesAt(1523, 1, 31, 14),
    };
    expect(
      resolve(
        building('43', '4', exposed, {
          timePassed: minutesAt(1523, 2, 1, 8, 59),
          storyEventTimes,
        }),
      ),
    ).toBe(id('rendezvous-wait'));
    expect(
      resolve(
        building('43', '4', exposed, {
          timePassed: minutesAt(1523, 2, 1, 9),
          storyEventTimes,
        }),
      ),
    ).toBe(id('spanish-alliance'));
  });

  test.each(['defeat', 'retreat', 'draw'] as const)(
    'offers only the Cayenne harbor retry after Amazon %s',
    (outcome) => {
      const started = completedThrough('amazon-start');
      const result = { 'joao.m3.amazon': outcome };
      expect(
        resolve(building('57', '4', started, { combatResults: result })),
      ).toBe(id('amazon-retry'));
      expect(
        resolve(building('57', '2', started, { combatResults: result })),
      ).toBeNull();
      expect(
        resolve(building('54', '4', started, { combatResults: result })),
      ).toBeNull();
    },
  );

  test('reports only an actual Amazon victory from world, port, or building and reserves homecoming for the Lisbon residence', () => {
    const started = completedThrough('amazon-start');
    const victory = { 'joao.m3.amazon': 'victory' as const };
    expect(
      resolve(context({ completed: started, combatResults: victory })),
    ).toBe(id('amazon-victory'));
    expect(
      resolve(
        context({
          stage: 'port',
          portId: '57',
          completed: started,
          combatResults: victory,
        }),
      ),
    ).toBe(id('amazon-victory'));
    expect(
      resolve(building('3', '5', started, { combatResults: victory })),
    ).toBe(id('amazon-victory'));
    expect(
      resolve(
        context({
          completed: started,
          combatResults: { 'joao.m3.amazon': 'defeat' },
        }),
      ),
    ).toBeNull();

    const reported = completedThrough('amazon-victory');
    expect(resolve(building('1', '8', reported))).toBe(id('homecoming'));
    expect(resolve(building('1', '7', reported))).not.toBe(id('homecoming'));
    expect(resolve(building('57', '8', reported))).toBeNull();
  });
});
