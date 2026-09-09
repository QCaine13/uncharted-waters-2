import { compiledStoryContent } from '.';
import { resolveStoryEvent } from './core/resolver';
import { storyEventId, type StoryContext } from './core/types';
import {
  MASSAWA_BATTLE_AREA,
  MASSAWA_COMPLETE_EVENT_ID,
  MASSAWA_WAITING_EVENT_ID,
  WAITING_FOR_PIETRO_EVENT_ID,
} from './content/arcs/joao/massawa';

const prefix = 'joao.massawa.';
const PRIOR_COMPLETE = [...compiledStoryContent.eventsById.keys()]
  .map(String)
  .filter((eventId) => !eventId.startsWith(prefix));
const id = (suffix: string) => storyEventId(`${prefix}${suffix}`);

const minutesAt = (
  year: number,
  month: number,
  day: number,
  hour = 10,
): number =>
  (Date.UTC(year, month - 1, day, hour) - Date.UTC(1522, 4, 17)) / 60_000;

const context = (
  overrides: Partial<StoryContext> & { completed?: string[] } = {},
): StoryContext => ({
  stage: 'world',
  portId: null,
  buildingId: null,
  timePassed: minutesAt(1522, 6, 1),
  dayAtSea: 0,
  completedEvents: new Set(
    (overrides.completed ?? PRIOR_COMPLETE).map(storyEventId),
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

const completedThrough = (suffix: string): string[] => {
  const order = [
    'five-day-voyage',
    'ali-massawa-lead',
    'religious-lead',
    'staff-request',
    'pietro-commissioned',
    'waiting-for-pietro',
    'invasion-authorized',
    'first-sortie-ready',
    'ottoman-one-start',
    'second-sortie-ready',
    'ottoman-two-start',
    'defense-reported',
    'staff-received',
    'staff-returned',
    'chapter-complete',
  ];
  const index = order.indexOf(suffix);
  if (index < 0) throw new Error(`Unknown milestone ${suffix}`);
  return [
    ...PRIOR_COMPLETE,
    ...order.slice(0, index + 1).map((part) => `${prefix}${part}`),
  ];
};

const resolve = (candidate: StoryContext): string | null =>
  resolveStoryEvent(candidate, compiledStoryContent, (events) => events[0])
    ?.id ?? null;

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

describe('Massawa resolver graph', () => {
  test('exports the stable completion, wait alias, and inclusive battle area interfaces', () => {
    expect(MASSAWA_COMPLETE_EVENT_ID).toBe('joao.massawa.chapter-complete');
    expect(MASSAWA_WAITING_EVENT_ID).toBe(WAITING_FOR_PIETRO_EVENT_ID);
    expect(MASSAWA_BATTLE_AREA).toEqual({
      minX: 1152,
      maxX: 1156,
      minY: 527,
      maxY: 533,
    });
  });

  test('latches five uninterrupted sea days before docking resets the counter', () => {
    expect(resolve(context({ dayAtSea: 4 }))).toBeNull();
    expect(resolve(context({ dayAtSea: 5 }))).toBe(id('five-day-voyage'));
    expect(
      resolve(
        context({
          stage: 'building',
          portId: '3',
          buildingId: '2',
          dayAtSea: 0,
        }),
      ),
    ).toBeNull();
  });

  test('sends the latched voyage through the next facility, Massawa church, and southwest residence', () => {
    const voyage = completedThrough('five-day-voyage');
    expect(resolve(building('27', '5', voyage))).toBe(id('ali-massawa-lead'));
    expect(
      resolve(context({ stage: 'port', portId: '27', completed: voyage })),
    ).toBeNull();

    const aliLead = completedThrough('ali-massawa-lead');
    expect(resolve(building('75', '11', aliLead))).toBe(id('religious-lead'));
    expect(resolve(building('75', '13', aliLead))).toBeNull();
    expect(resolve(building('74', '11', aliLead))).toBeNull();

    const religiousLead = completedThrough('religious-lead');
    expect(resolve(building('75', '8', religiousLead))).toBe(
      id('staff-request'),
    );
    expect(resolve(building('75', '11', religiousLead))).toBeNull();
  });

  test('commissions Pietro only at the Lisbon residence and establishes the wait only after returning to Massawa', () => {
    const requested = completedThrough('staff-request');
    expect(resolve(building('1', '8', requested))).toBe(
      id('pietro-commissioned'),
    );
    expect(resolve(building('75', '8', requested))).toBeNull();
    expect(resolve(building('1', '2', requested))).not.toBe(
      id('pietro-commissioned'),
    );

    const commissioned = completedThrough('pietro-commissioned');
    expect(resolve(building('75', '8', commissioned))).toBe(
      id('waiting-for-pietro'),
    );
    expect(resolve(building('1', '8', commissioned))).not.toBe(
      id('waiting-for-pietro'),
    );
  });

  test('uses the Massawa wait timestamp rather than the Lisbon commission timestamp', () => {
    const completed = completedThrough('waiting-for-pietro');
    const commissionTime = minutesAt(1522, 6, 1);
    const waitTime = minutesAt(1522, 7, 20);
    const candidate = (year: number, month: number, day: number) =>
      building('75', '8', completed, {
        timePassed: minutesAt(year, month, day),
        storyEventTimes: {
          [id('pietro-commissioned')]: commissionTime,
          [id('waiting-for-pietro')]: waitTime,
        },
      });

    expect(resolve(candidate(1522, 7, 21))).toBe(id('waiting-advice'));
    expect(resolve(candidate(1522, 8, 10))).toBe(id('waiting-advice'));
    expect(resolve(candidate(1522, 8, 11))).toBe(id('invasion-authorized'));
  });

  test('enforces a later month and day 11 across same-month and year-rollover boundaries', () => {
    const completed = completedThrough('waiting-for-pietro');
    const anchorId = id('waiting-for-pietro');
    const candidate = (
      anchor: [number, number, number],
      now: [number, number, number],
    ) =>
      building('75', '8', completed, {
        timePassed: minutesAt(...now),
        storyEventTimes: { [anchorId]: minutesAt(...anchor) },
      });

    expect(resolve(candidate([1522, 7, 2], [1522, 7, 10]))).toBe(
      id('waiting-advice'),
    );
    expect(resolve(candidate([1522, 7, 2], [1522, 7, 11]))).toBe(
      id('waiting-advice'),
    );
    expect(resolve(candidate([1522, 7, 2], [1522, 8, 1]))).toBe(
      id('waiting-advice'),
    );
    expect(resolve(candidate([1522, 7, 2], [1522, 8, 10]))).toBe(
      id('waiting-advice'),
    );
    expect(resolve(candidate([1522, 7, 2], [1522, 8, 11]))).toBe(
      id('invasion-authorized'),
    );
    expect(resolve(candidate([1522, 12, 20], [1523, 1, 10]))).toBe(
      id('waiting-advice'),
    );
    expect(resolve(candidate([1522, 12, 20], [1523, 1, 11]))).toBe(
      id('invasion-authorized'),
    );
  });

  test('retires waiting advice after authorization and offers the first sortie only at Massawa harbor', () => {
    const authorized = completedThrough('invasion-authorized');
    expect(resolve(building('75', '8', authorized))).toBeNull();
    expect(resolve(building('75', '4', authorized))).toBe(
      id('first-sortie-ready'),
    );
    expect(resolve(building('75', '2', authorized))).toBeNull();
    expect(resolve(building('74', '4', authorized))).toBeNull();
  });

  test('starts the first Ottoman encounter only inside the inclusive Massawa battle area', () => {
    const completed = completedThrough('first-sortie-ready');
    (
      [
        { x: 1152, y: 527 },
        { x: 1156, y: 533 },
        { x: 1154, y: 530 },
      ] as const
    ).forEach((worldPosition) => {
      expect(resolve(context({ completed, worldPosition }))).toBe(
        id('ottoman-one-start'),
      );
    });
    expect(
      resolve(context({ completed, worldPosition: { x: 1151, y: 530 } })),
    ).toBeNull();
    expect(
      resolve(context({ completed, worldPosition: { x: 1154, y: 534 } })),
    ).toBeNull();
    expect(
      resolve(context({ completed, worldPosition: undefined })),
    ).toBeNull();
  });

  test('offers a local first-fleet retry after defeat and the next preparation after victory or retreat', () => {
    const completed = completedThrough('ottoman-one-start');
    expect(
      resolve(
        building('75', '4', completed, {
          combatResults: { 'joao.m3.ottoman-one': 'defeat' },
        }),
      ),
    ).toBe(id('ottoman-one-retry'));
    (['victory', 'retreat'] as const).forEach((outcome) => {
      expect(
        resolve(
          building('75', '4', completed, {
            combatResults: { 'joao.m3.ottoman-one': outcome },
          }),
        ),
      ).toBe(id('second-sortie-ready'));
    });
    expect(
      resolve(
        building('74', '4', completed, {
          combatResults: { 'joao.m3.ottoman-one': 'defeat' },
        }),
      ),
    ).toBeNull();
  });

  test('starts the second encounter in the same navigable area and retries only its defeat', () => {
    const ready = completedThrough('second-sortie-ready');
    expect(
      resolve(
        context({ completed: ready, worldPosition: { x: 1152, y: 533 } }),
      ),
    ).toBe(id('ottoman-two-start'));
    expect(
      resolve(
        context({ completed: ready, worldPosition: { x: 1157, y: 533 } }),
      ),
    ).toBeNull();

    const started = completedThrough('ottoman-two-start');
    expect(
      resolve(
        building('75', '4', started, {
          combatResults: {
            'joao.m3.ottoman-one': 'victory',
            'joao.m3.ottoman-two': 'defeat',
          },
        }),
      ),
    ).toBe(id('ottoman-two-retry'));
    expect(
      resolve(
        building('75', '2', started, {
          combatResults: {
            'joao.m3.ottoman-one': 'victory',
            'joao.m3.ottoman-two': 'defeat',
          },
        }),
      ),
    ).toBeNull();
  });

  test.each([
    ['victory', 'victory'],
    ['victory', 'retreat'],
    ['retreat', 'victory'],
    ['retreat', 'retreat'],
  ] as const)(
    'accepts distinct Ottoman successes %s / %s at the residence',
    (one, two) => {
      const completed = completedThrough('ottoman-two-start');
      expect(
        resolve(
          building('75', '8', completed, {
            combatResults: {
              'joao.m3.ottoman-one': one,
              'joao.m3.ottoman-two': two,
            },
          }),
        ),
      ).toBe(id('defense-reported'));
    },
  );

  test('does not report the defense after either defeat or from the wrong Massawa building', () => {
    const completed = completedThrough('ottoman-two-start');
    expect(
      resolve(
        building('75', '8', completed, {
          combatResults: {
            'joao.m3.ottoman-one': 'defeat',
            'joao.m3.ottoman-two': 'victory',
          },
        }),
      ),
    ).toBeNull();
    expect(
      resolve(
        building('75', '8', completed, {
          combatResults: {
            'joao.m3.ottoman-one': 'victory',
            'joao.m3.ottoman-two': 'defeat',
          },
        }),
      ),
    ).toBeNull();
    expect(
      resolve(
        building('75', '2', completed, {
          combatResults: {
            'joao.m3.ottoman-one': 'victory',
            'joao.m3.ottoman-two': 'victory',
          },
        }),
      ),
    ).toBeNull();
  });

  test('delivers, returns, and closes the Staff route at three distinct Massawa facilities', () => {
    const reported = completedThrough('defense-reported');
    expect(resolve(building('75', '2', reported))).toBe(id('staff-received'));
    expect(resolve(building('75', '8', reported))).toBeNull();

    const received = completedThrough('staff-received');
    const staff = new Set(['m3-staff-of-the-saint'] as const);
    expect(resolve(building('75', '8', received, { items: staff }))).toBe(
      id('staff-returned'),
    );
    expect(resolve(building('75', '8', received))).toBeNull();
    expect(resolve(building('74', '8', received, { items: staff }))).toBeNull();

    const returned = completedThrough('staff-returned');
    expect(resolve(building('75', '4', returned))).toBe(id('chapter-complete'));
    expect(resolve(building('75', '8', returned))).toBeNull();
    expect(resolve(building('74', '4', returned))).toBeNull();
  });

  test('rejects every chapter facility out of order', () => {
    expect(resolve(building('75', '11', PRIOR_COMPLETE))).not.toBe(
      id('religious-lead'),
    );
    expect(resolve(building('75', '8', PRIOR_COMPLETE))).not.toBe(
      id('staff-request'),
    );
    expect(resolve(building('1', '8', PRIOR_COMPLETE))).not.toBe(
      id('pietro-commissioned'),
    );
    expect(resolve(building('75', '4', PRIOR_COMPLETE))).not.toBe(
      id('first-sortie-ready'),
    );
    expect(resolve(building('75', '2', PRIOR_COMPLETE))).not.toBe(
      id('staff-received'),
    );
  });
});
