import state, { SAVED_STATE_KEY } from '../state/state';
import { load, SAVE_VERSION } from '../state/saveLoad';
import updateInterface from '../state/updateInterface';
import { compiledStoryContent } from '.';
import { advanceQuestSession } from './advanceSession';
import { createStoryContext, resolveStoryEvent } from './core/resolver';
import { createStorySession, getStoryFrame } from './core/runtime';
import { storyEventId, type StoryEvent } from './core/types';
import { storyRuntimeActions } from './storyRuntimeActions';

const prefix = 'joao.finale.';
const priorComplete = ['joao.massawa.chapter-complete'];

const event = (suffix: string): StoryEvent => {
  const found = compiledStoryContent.eventsById.get(
    storyEventId(`${prefix}${suffix}`),
  );
  if (!found) throw new Error(`Missing finale event ${suffix}`);
  return found;
};

const finish = (target: StoryEvent, choiceId?: 'yes' | 'no'): void => {
  let session = createStorySession(target);
  for (let guard = 0; guard < 24 && getStoryFrame(session); guard += 1) {
    const frame = getStoryFrame(session);
    session = advanceQuestSession(
      session,
      storyRuntimeActions,
      frame?.type === 'choice' ? choiceId : undefined,
    );
  }
  expect(getStoryFrame(session)).toBeNull();
};

const resolve = (): StoryEvent | null =>
  resolveStoryEvent(
    createStoryContext(state, compiledStoryContent),
    compiledStoryContent,
    ([first]) => first,
  );

describe('João finale production effects', () => {
  beforeEach(() => {
    localStorage.clear();
    state.portId = '1';
    state.buildingId = '2';
    state.timePassed = 100_000;
    state.dayAtSea = 0;
    state.gold = 0;
    state.storyEvents = [...priorComplete];
    state.storyEventTimes = {};
    state.quests = [];
    state.discoveries = [];
    state.reportedDiscoveries = [];
    state.items = ['4'];
    state.equipment = { weaponId: '4', armorId: null };
    state.mates = [
      { sailorId: '1', role: 0 },
      { sailorId: '32', role: 1 },
      { sailorId: 'm2-relief-captain', role: 2 },
      { sailorId: '33', role: 3 },
    ];
    state.mateProgress = {};
    state.fame = { adventure: 30, pirate: 0, trade: 0 };
    state.marketPrices = {};
    state.usedShipsAtPort = {};
    state.savings = 0;
    state.debt = 0;
    state.fleets = {
      '1': {
        position: { x: 598, y: 644 },
        ships: [
          { id: '6', name: 'Hermes II', crew: 10, durability: 30, cargo: [] },
          { id: '6', name: 'Rocco', crew: 10, durability: 30, cargo: [] },
          { id: '6', name: 'Relief', crew: 10, durability: 30, cargo: [] },
          { id: '6', name: 'Enrico', crew: 10, durability: 30, cargo: [] },
        ],
      },
    };
    state.combatResults = {};
    state.activeCombat = null;
    updateInterface.general = jest.fn();
    updateInterface.fame = jest.fn();
  });

  afterEach(() => jest.restoreAllMocks());

  test('declining Japan preserves re-entry and accepting records it once', () => {
    const request = resolve();
    expect(request?.id).toBe(`${prefix}japan-request`);
    finish(request!, 'no');
    expect(state.storyEvents).not.toContain(`${prefix}japan-request`);
    expect(resolve()?.id).toBe(`${prefix}japan-request`);

    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    finish(resolve()!, 'yes');
    expect(
      state.storyEvents.filter((id) => id === `${prefix}japan-request`),
    ).toHaveLength(1);
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  test('removes a four-ship captain at Nagasaki, grants fame once, reloads absent, and leaves every ship in place', () => {
    const originalShips = JSON.parse(JSON.stringify(state.fleets['1'].ships));
    state.portId = '100';
    state.buildingId = '4';
    state.storyEvents.push(`${prefix}japan-request`);
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    finish(resolve()!);

    expect(state.storyEvents).toContain(`${prefix}enrico-farewell`);
    expect(state.fame.adventure).toBe(1030);
    expect(state.fleets['1'].ships).toEqual(originalShips);
    expect(state.mates.some(({ sailorId }) => sailorId === '33')).toBe(false);
    expect(state.mates).toContainEqual({
      sailorId: 'm3-relief-captain',
      role: 3,
    });
    expect(setItem).toHaveBeenCalledTimes(1);

    expect(load()).toBe(true);
    expect(state.mates.some(({ sailorId }) => sailorId === '33')).toBe(false);
    expect(state.fame.adventure).toBe(1030);
    expect(state.fleets['1'].ships).toEqual(originalShips);
    expect(resolve()?.id).not.toBe(`${prefix}enrico-farewell`);
  });

  test('records the original Martinez appointment timestamp once', () => {
    state.portId = '57';
    state.buildingId = '4';
    state.storyEvents.push(`${prefix}lucia-rescued`);
    state.timePassed = 110_000;
    finish(resolve()!);
    expect(state.storyEventTimes[`${prefix}martinez-exposed`]).toBe(110_000);

    state.timePassed = 120_000;
    finish(event('martinez-exposed'));
    expect(state.storyEventTimes[`${prefix}martinez-exposed`]).toBe(110_000);
  });

  test('starts Rudolph and the Amazon fleet only after storing each encounter marker', () => {
    state.portId = '57';
    state.buildingId = '2';
    state.storyEvents.push(
      `${prefix}japan-request`,
      `${prefix}south-america-arrival`,
    );
    finish(resolve()!);
    expect(state.storyEvents).toContain(`${prefix}rudolph-start`);
    expect(state.activeCombat?.encounterId).toBe('joao.m3.rudolph');

    state.activeCombat = null;
    state.portId = null;
    state.buildingId = null;
    state.storyEvents.push(`${prefix}spanish-alliance`);
    finish(resolve()!);
    expect(state.storyEvents).toContain(`${prefix}amazon-start`);
    expect(
      (state.activeCombat as { encounterId?: string } | null)?.encounterId,
    ).toBe('joao.m3.amazon');
  });

  test.each(['victory', 'defeat', 'draw'] as const)(
    'completes Lucia rescue after Rudolph %s without changing the roster',
    (outcome) => {
      const originalMates = JSON.parse(JSON.stringify(state.mates));
      state.portId = '57';
      state.buildingId = '2';
      state.storyEvents.push(
        `${prefix}japan-request`,
        `${prefix}rudolph-start`,
      );
      state.combatResults['joao.m3.rudolph'] = outcome;
      finish(resolve()!);
      expect(state.storyEvents).toContain(`${prefix}lucia-rescued`);
      expect(state.mates).toEqual(originalMates);
    },
  );

  test.each(['defeat', 'retreat', 'draw'] as const)(
    'keeps homecoming locked after Amazon %s and retries only on yes',
    (outcome) => {
      state.portId = '57';
      state.buildingId = '4';
      state.storyEvents.push(`${prefix}japan-request`, `${prefix}amazon-start`);
      state.combatResults['joao.m3.amazon'] = outcome;
      const retry = resolve();
      expect(retry?.id).toBe(`${prefix}amazon-retry`);
      finish(retry!, 'no');
      expect(state.activeCombat).toBeNull();
      expect(state.storyEvents).not.toContain(`${prefix}amazon-victory`);

      finish(resolve()!, 'yes');
      expect(state.activeCombat?.encounterId).toBe('joao.m3.amazon');
      expect(state.storyEvents).not.toContain(`${prefix}amazon-victory`);
    },
  );

  test('completes the route after an outside-Lisbon victory even when the Crown was sold', () => {
    state.portId = '57';
    state.buildingId = '4';
    state.items = ['4'];
    state.storyEvents.push(`${prefix}japan-request`, `${prefix}amazon-start`);
    state.combatResults['joao.m3.amazon'] = 'victory';
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    expect(resolve()?.id).toBe(`${prefix}amazon-victory`);
    finish(resolve()!);
    expect(state.storyEvents).toContain(`${prefix}amazon-victory`);
    expect(setItem).toHaveBeenCalledTimes(1);

    state.portId = '1';
    state.buildingId = '8';
    expect(resolve()?.id).toBe(`${prefix}homecoming`);
    finish(resolve()!);
    expect(state.storyEvents).toContain(`${prefix}homecoming`);
    expect(state.items).toEqual(['4']);
    expect(setItem).toHaveBeenCalledTimes(2);
  });

  test('loads an existing v5 M2 save through migration, resolver, session, effects, and current save', () => {
    localStorage.setItem(
      SAVED_STATE_KEY,
      JSON.stringify({
        version: 5,
        portId: null,
        buildingId: null,
        timePassed: 130_000,
        dayAtSea: 5,
        gold: 1800,
        quests: [],
        usedShipsAtPort: {},
        savings: 0,
        debt: 0,
        items: ['4'],
        mates: [
          { sailorId: '1', role: 0 },
          { sailorId: '32', role: null },
          { sailorId: '33', role: null },
        ],
        fame: { adventure: 5030, pirate: 1000, trade: 0 },
        marketPrices: {},
        discoveries: [],
        reportedDiscoveries: [],
        storyEvents: [
          'joao.conflict-and-growth.chapter-complete',
          'future.event',
        ],
        fleets: {
          '1': {
            position: { x: 840, y: 358 },
            ships: [
              {
                id: '6',
                name: 'Hermes II',
                crew: 10,
                durability: 30,
                cargo: [],
              },
            ],
          },
        },
      }),
    );

    expect(load()).toBe(true);
    expect(resolve()?.id).toBe('joao.massawa.five-day-voyage');
    finish(resolve()!);
    const saved = JSON.parse(localStorage.getItem(SAVED_STATE_KEY) ?? '{}');
    expect(saved.version).toBe(SAVE_VERSION);
    expect(saved.storyEvents).toEqual(
      expect.arrayContaining([
        'joao.conflict-and-growth.chapter-complete',
        'future.event',
        'joao.massawa.five-day-voyage',
      ]),
    );
    expect(saved.storyEventTimes['joao.massawa.five-day-voyage']).toBe(130_000);
  });
});
