import { compiledStoryContent } from '.';
import { resolveStoryEvent } from './core/resolver';
import { characterId, storyEventId, type StoryContext } from './core/types';

const m1Complete = [
  'joao.lisbon-opening.house-introduction',
  'joao.lisbon-opening.pub-before-introduction',
  'joao.lisbon-opening.pub-farewell',
  'joao.lisbon-opening.item-shop-rapier',
  'joao.lisbon-opening.shipyard-hermes-ii',
  'joao.lisbon-opening.church-before-introduction',
  'joao.lisbon-opening.church-recruit-enrico',
  'joao.lisbon-opening.church-enrico-gift',
  'joao.lisbon-opening.house-mother-farewell',
  'joao.lisbon-opening.harbor-final',
  'joao.first-voyage.commission-accepted',
  'joao.first-voyage.domingo-met',
  'joao.first-voyage.domingo-recruited',
  'joao.first-voyage.chapter-complete',
];

const id = (suffix: string) =>
  storyEventId(`joao.conflict-and-growth.${suffix}`);

const context = (
  overrides: Partial<StoryContext> & { completed?: string[] } = {},
): StoryContext => ({
  stage: 'building',
  portId: '27',
  buildingId: '2',
  timePassed: 480,
  dayAtSea: 0,
  completedEvents: new Set(
    (overrides.completed ?? m1Complete).map(storyEventId),
  ),
  fame: { adventure: 0, pirate: 0, trade: 0 },
  items: new Set(),
  companions: new Set([characterId('domingo')]),
  discoveries: new Set(),
  reportedDiscoveries: new Set(),
  combatResults: {},
  ...overrides,
});

const resolve = (candidate: StoryContext): string | null =>
  resolveStoryEvent(candidate, compiledStoryContent, (events) => events[0])
    ?.id ?? null;

describe('conflict and growth resolver graph', () => {
  test('opens only for an M1-complete save with Domingo aboard in Ceuta by day', () => {
    expect(resolve(context())).toBe(id('domingo-missing'));
    expect(resolve(context({ timePassed: 959 }))).toBe(id('domingo-missing'));
    expect(resolve(context({ timePassed: 479 }))).toBeNull();
    expect(resolve(context({ timePassed: 960 }))).toBeNull();
    expect(resolve(context({ completed: m1Complete.slice(0, -1) }))).toBeNull();
    expect(resolve(context({ companions: new Set() }))).toBeNull();
  });

  test('orders Ceuta search, first duel, identity reveal, and Lisbon house duel', () => {
    expect(
      resolve(
        context({
          buildingId: '5',
          completed: [...m1Complete, String(id('domingo-missing'))],
        }),
      ),
    ).toBe(id('lodge-search'));
    expect(
      resolve(
        context({
          buildingId: '3',
          completed: [
            ...m1Complete,
            String(id('domingo-missing')),
            String(id('lodge-search')),
          ],
        }),
      ),
    ).toBe(id('kahn-shipyard-start'));

    (['victory', 'defeat', 'draw'] as const).forEach((outcome) => {
      expect(
        resolve(
          context({
            buildingId: '4',
            completed: [
              ...m1Complete,
              String(id('domingo-missing')),
              String(id('lodge-search')),
              String(id('kahn-shipyard-start')),
            ],
            combatResults: { 'joao.m2.kahn-shipyard': outcome },
          }),
        ),
      ).toBe(id('identity-revealed'));
    });

    expect(
      resolve(
        context({
          portId: '1',
          buildingId: '8',
          completed: [
            ...m1Complete,
            String(id('domingo-missing')),
            String(id('lodge-search')),
            String(id('kahn-shipyard-start')),
            String(id('identity-revealed')),
          ],
          combatResults: { 'joao.m2.kahn-shipyard': 'defeat' },
        }),
      ),
    ).toBe(id('kahn-house-start'));
  });

  test('routes a house draw to rematch and either final result to the Palace', () => {
    const completed = [
      ...m1Complete,
      'joao.conflict-and-growth.domingo-missing',
      'joao.conflict-and-growth.lodge-search',
      'joao.conflict-and-growth.kahn-shipyard-start',
      'joao.conflict-and-growth.identity-revealed',
      'joao.conflict-and-growth.kahn-house-start',
    ];
    expect(
      resolve(
        context({
          portId: '1',
          buildingId: '8',
          completed,
          combatResults: { 'joao.m2.kahn-house': 'draw' },
        }),
      ),
    ).toBe(id('kahn-house-rematch'));

    (['victory', 'defeat'] as const).forEach((outcome) => {
      expect(
        resolve(
          context({
            portId: '1',
            buildingId: '6',
            completed,
            combatResults: { 'joao.m2.kahn-house': outcome },
          }),
        ),
      ).toBe(id('father-cleared'));
    });
  });

  test('requires accepted pursuit, a sea day, a harbor visit, and another sea day', () => {
    const farewell = [...m1Complete, String(id('domingo-farewell'))];
    expect(
      resolve(context({ portId: '2', buildingId: '2', completed: farewell })),
    ).toBe(id('katarina-warning'));
    expect(
      resolve(
        context({
          stage: 'world',
          portId: null,
          buildingId: null,
          dayAtSea: 1,
          completed: [...farewell, String(id('katarina-warning'))],
        }),
      ),
    ).toBe(id('pursuit-first-sea'));
    expect(
      resolve(
        context({
          portId: '27',
          buildingId: '4',
          completed: [
            ...farewell,
            String(id('katarina-warning')),
            String(id('pursuit-first-sea')),
          ],
        }),
      ),
    ).toBe(id('pursuit-first-port'));
    expect(
      resolve(
        context({
          stage: 'world',
          portId: null,
          buildingId: null,
          dayAtSea: 1,
          completed: [
            ...farewell,
            String(id('katarina-warning')),
            String(id('pursuit-first-sea')),
            String(id('pursuit-first-port')),
          ],
        }),
      ),
    ).toBe(id('katarina-battle-start'));
  });

  test('separates naval success from defeat recovery and finishes the Ali route', () => {
    const battleStarted = [
      ...m1Complete,
      'joao.conflict-and-growth.domingo-missing',
      'joao.conflict-and-growth.lodge-search',
      'joao.conflict-and-growth.kahn-shipyard-start',
      'joao.conflict-and-growth.identity-revealed',
      'joao.conflict-and-growth.kahn-house-start',
      'joao.conflict-and-growth.father-cleared',
      'joao.conflict-and-growth.domingo-farewell',
      'joao.conflict-and-growth.katarina-warning',
      'joao.conflict-and-growth.pursuit-first-sea',
      'joao.conflict-and-growth.pursuit-first-port',
      'joao.conflict-and-growth.katarina-battle-start',
    ];
    (['victory', 'retreat'] as const).forEach((outcome) => {
      expect(
        resolve(
          context({
            portId: '27',
            buildingId: '2',
            completed: battleStarted,
            combatResults: { 'joao.m2.katarina': outcome },
          }),
        ),
      ).toBe(id('ali-request'));
    });
    expect(
      resolve(
        context({
          portId: '1',
          buildingId: '4',
          completed: battleStarted,
          combatResults: { 'joao.m2.katarina': 'defeat' },
        }),
      ),
    ).toBe(id('katarina-retry'));
    expect(
      resolve(
        context({
          portId: '27',
          buildingId: '2',
          completed: battleStarted,
          combatResults: { 'joao.m2.katarina': 'defeat' },
        }),
      ),
    ).toBeNull();

    expect(
      resolve(
        context({
          portId: '1',
          buildingId: '2',
          completed: [...battleStarted, String(id('ali-request'))],
          combatResults: { 'joao.m2.katarina': 'retreat' },
        }),
      ),
    ).toBe(id('lisbon-inquiry'));
    expect(
      resolve(
        context({
          portId: '77',
          buildingId: '2',
          completed: [
            ...battleStarted,
            String(id('ali-request')),
            String(id('lisbon-inquiry')),
          ],
          combatResults: { 'joao.m2.katarina': 'retreat' },
        }),
      ),
    ).toBe(id('sasha-found'));
    expect(
      resolve(
        context({
          portId: '3',
          buildingId: '5',
          completed: [
            ...battleStarted,
            String(id('ali-request')),
            String(id('lisbon-inquiry')),
            String(id('sasha-found')),
          ],
          combatResults: { 'joao.m2.katarina': 'retreat' },
        }),
      ),
    ).toBe(id('chapter-complete'));
  });
});
