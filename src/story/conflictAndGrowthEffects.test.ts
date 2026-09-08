import updateInterface from '../state/updateInterface';
import state from '../state/state';
import { compiledStoryContent } from '.';
import { advanceQuestSession } from './advanceSession';
import { createStoryContext, resolveStoryEvent } from './core/resolver';
import { createStorySession, getStoryFrame } from './core/runtime';
import type { StoryEvent } from './core/types';
import { storyRuntimeActions } from './storyRuntimeActions';

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

const finish = (event: StoryEvent, choiceId?: 'yes' | 'no'): void => {
  let session = createStorySession(event);
  for (let guard = 0; guard < 20 && getStoryFrame(session); guard += 1) {
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
    (events) => events[0],
  );

describe('conflict and growth production effects', () => {
  beforeEach(() => {
    localStorage.clear();
    state.portId = '1';
    state.buildingId = '6';
    state.timePassed = 600;
    state.dayAtSea = 0;
    state.gold = 0;
    state.storyEvents = [...m1Complete];
    state.quests = [];
    state.discoveries = ['strait-of-gibraltar'];
    state.reportedDiscoveries = ['strait-of-gibraltar'];
    state.items = ['4'];
    state.equipment = { weaponId: '4', armorId: null };
    state.mates = [
      { sailorId: '1', role: 0 },
      { sailorId: '32', role: null },
      { sailorId: '33', role: null },
      { sailorId: '34', role: null },
    ];
    state.fame = { adventure: 30, pirate: 0, trade: 0 };
    state.fleets = {
      '1': {
        position: { x: 838, y: 358 },
        ships: [
          {
            id: '6',
            name: 'Hermes II',
            crew: 10,
            durability: 25,
            cargo: [],
          },
        ],
      },
    };
    state.combatResults = {};
    state.activeCombat = null;
    updateInterface.general = jest.fn();
    updateInterface.fame = jest.fn();
  });

  test('grants both 1000 fame rewards once after either decisive house result', () => {
    state.storyEvents.push('joao.conflict-and-growth.kahn-house-start');
    state.combatResults['joao.m2.kahn-house'] = 'defeat';
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    const event = resolve();
    expect(event?.id).toBe('joao.conflict-and-growth.father-cleared');
    finish(event!);

    expect(state.fame).toEqual({ adventure: 1030, pirate: 1000, trade: 0 });
    expect(state.storyEvents).toContain(
      'joao.conflict-and-growth.father-cleared',
    );
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(resolve()?.id).not.toBe('joao.conflict-and-growth.father-cleared');
  });

  test('gives one Flamberge, removes Domingo, and preserves M1 completion', () => {
    state.buildingId = '8';
    state.storyEvents.push('joao.conflict-and-growth.father-cleared');

    const event = resolve();
    expect(event?.id).toBe('joao.conflict-and-growth.domingo-farewell');
    finish(event!);

    expect(state.items.filter((itemId) => itemId === '13')).toHaveLength(1);
    expect(state.mates.map(({ sailorId }) => sailorId)).not.toContain('34');
    expect(state.storyEvents).toEqual(
      expect.arrayContaining([
        'joao.first-voyage.chapter-complete',
        'joao.conflict-and-growth.domingo-farewell',
      ]),
    );
    expect(resolve()?.id).not.toBe('joao.conflict-and-growth.domingo-farewell');
  });

  test('uses the pre-owned farewell branch without duplicating the Flamberge', () => {
    state.buildingId = '8';
    state.items.push('13');
    state.storyEvents.push('joao.conflict-and-growth.father-cleared');

    const event = resolve();
    expect(event?.id).toBe(
      'joao.conflict-and-growth.domingo-farewell-flamberge-owned',
    );
    finish(event!);

    expect(state.items.filter((itemId) => itemId === '13')).toHaveLength(1);
    expect(state.mates.map(({ sailorId }) => sailorId)).not.toContain('34');
    expect(state.storyEvents).toContain(
      'joao.conflict-and-growth.domingo-farewell',
    );
  });

  test('starts the first duel and naval retry after the visible dialogue', () => {
    state.portId = '27';
    state.buildingId = '3';
    state.storyEvents.push(
      'joao.conflict-and-growth.domingo-missing',
      'joao.conflict-and-growth.lodge-search',
    );
    const duel = resolve();
    expect(duel?.id).toBe('joao.conflict-and-growth.kahn-shipyard-start');
    finish(duel!);
    expect(state.storyEvents).toContain(
      'joao.conflict-and-growth.kahn-shipyard-start',
    );
    expect(state.activeCombat?.encounterId).toBe('joao.m2.kahn-shipyard');

    state.activeCombat = null;
    state.combatResults['joao.m2.katarina'] = 'defeat';
    state.portId = '1';
    state.buildingId = '4';
    state.storyEvents.push(
      'joao.conflict-and-growth.domingo-farewell',
      'joao.conflict-and-growth.katarina-warning',
      'joao.conflict-and-growth.pursuit-first-sea',
      'joao.conflict-and-growth.pursuit-first-port',
      'joao.conflict-and-growth.katarina-battle-start',
    );
    const retry = resolve();
    expect(retry?.id).toBe('joao.conflict-and-growth.katarina-retry');
    finish(retry!, 'no');
    expect(state.activeCombat).toBeNull();
    expect(resolve()?.id).toBe('joao.conflict-and-growth.katarina-retry');
    finish(resolve()!, 'yes');
    expect(
      (state.activeCombat as { encounterId?: string } | null)?.encounterId,
    ).toBe('joao.m2.katarina');
  });

  test('closes at the Istanbul report with no reward or M3 event', () => {
    state.portId = '3';
    state.buildingId = '5';
    state.storyEvents.push('joao.conflict-and-growth.sasha-found');
    const before = {
      gold: state.gold,
      fame: { ...state.fame },
      items: [...state.items],
    };

    const event = resolve();
    expect(event?.id).toBe('joao.conflict-and-growth.chapter-complete');
    finish(event!);

    expect({ gold: state.gold, fame: state.fame, items: state.items }).toEqual(
      before,
    );
    expect(state.storyEvents).toContain(
      'joao.conflict-and-growth.chapter-complete',
    );
    expect(
      state.storyEvents.some((eventId) => eventId.startsWith('joao.m3.')),
    ).toBe(false);
  });
});
