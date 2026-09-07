import state, { SAVED_STATE_KEY } from '../state/state';
import { load } from '../state/saveLoad';
import updateInterface from '../state/updateInterface';
import { compiledStoryContent } from '.';
import { advanceQuestSession } from './advanceSession';
import { executeStoryEffects } from './core/effects';
import { createStoryContext, resolveStoryEvent } from './core/resolver';
import { createStorySession, getStoryFrame } from './core/runtime';
import { storyEventId, type StoryEvent } from './core/types';
import { storyRuntimeActions } from './storyRuntimeActions';

const prefix = 'joao.massawa.';
const priorComplete = ['joao.conflict-and-growth.chapter-complete'];

const event = (suffix: string): StoryEvent => {
  const found = compiledStoryContent.eventsById.get(
    storyEventId(`${prefix}${suffix}`),
  );
  if (!found) throw new Error(`Missing Massawa event ${suffix}`);
  return found;
};

const finish = (target: StoryEvent, choiceId?: 'yes' | 'no'): void => {
  let session = createStorySession(target);
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

describe('Massawa production effects', () => {
  beforeEach(() => {
    localStorage.clear();
    state.portId = '1';
    state.buildingId = '8';
    state.timePassed = 75_000;
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
      { sailorId: '32', role: null },
      { sailorId: '33', role: null },
    ];
    state.mateProgress = {};
    state.fame = { adventure: 30, pirate: 0, trade: 0 };
    state.marketPrices = {};
    state.usedShipsAtPort = {};
    state.savings = 0;
    state.debt = 0;
    state.fleets = {
      '1': {
        position: { x: 1154, y: 530 },
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
  });

  afterEach(() => jest.restoreAllMocks());

  test('commissions Pietro without giving an item or adding a companion', () => {
    const originalMates = JSON.parse(JSON.stringify(state.mates));
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    finish(event('pietro-commissioned'));

    expect(state.items).toEqual(['4']);
    expect(state.mates).toEqual(originalMates);
    expect(state.storyEvents).toContain(`${prefix}pietro-commissioned`);
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  test('records the Massawa return as the independent wait timestamp', () => {
    state.timePassed = 76_000;
    finish(event('pietro-commissioned'));
    state.timePassed = 82_000;
    finish(event('waiting-for-pietro'));

    expect(state.storyEventTimes[`${prefix}pietro-commissioned`]).toBe(76_000);
    expect(state.storyEventTimes[`${prefix}waiting-for-pietro`]).toBe(82_000);
  });

  test('records readiness on yes, preserves preparation on no, and starts in the battle area', () => {
    state.portId = '75';
    state.buildingId = '4';
    state.storyEvents.push(`${prefix}invasion-authorized`);
    const readiness = resolve();
    expect(readiness?.id).toBe(`${prefix}first-sortie-ready`);
    finish(readiness!, 'no');
    expect(state.storyEvents).not.toContain(`${prefix}first-sortie-ready`);
    expect(state.activeCombat).toBeNull();
    expect(resolve()?.id).toBe(`${prefix}first-sortie-ready`);

    finish(readiness!, 'yes');
    expect(state.storyEvents).toContain(`${prefix}first-sortie-ready`);
    expect(state.activeCombat).toBeNull();

    state.portId = null;
    state.buildingId = null;
    const start = resolve();
    expect(start?.id).toBe(`${prefix}ottoman-one-start`);
    finish(start!);
    expect(state.storyEvents).toContain(`${prefix}ottoman-one-start`);
    expect(state.activeCombat?.encounterId).toBe('joao.m3.ottoman-one');
  });

  test('keeps the separate second preparation available until its affirmative choice', () => {
    state.portId = '75';
    state.buildingId = '4';
    state.storyEvents.push(`${prefix}ottoman-one-start`);
    state.combatResults['joao.m3.ottoman-one'] = 'retreat';

    const readiness = resolve();
    expect(readiness?.id).toBe(`${prefix}second-sortie-ready`);
    finish(readiness!, 'no');
    expect(state.storyEvents).not.toContain(`${prefix}second-sortie-ready`);
    expect(state.activeCombat).toBeNull();
    expect(resolve()?.id).toBe(`${prefix}second-sortie-ready`);

    finish(readiness!, 'yes');
    expect(state.storyEvents).toContain(`${prefix}second-sortie-ready`);
    expect(state.activeCombat).toBeNull();
  });

  test.each(['ottoman-one', 'ottoman-two'] as const)(
    'retries %s immediately from Massawa after a real defeat',
    (encounter) => {
      state.portId = '75';
      state.buildingId = '4';
      state.combatResults[`joao.m3.${encounter}`] = 'defeat';

      const retry = event(`${encounter}-retry`);
      finish(retry, 'no');
      expect(state.activeCombat).toBeNull();

      finish(retry, 'yes');
      expect(state.activeCombat?.encounterId).toBe(`joao.m3.${encounter}`);
    },
  );

  test('receives one Staff, reloads it, then consumes it for one Crown and 5000 adventure fame', () => {
    const originalMates = JSON.parse(JSON.stringify(state.mates));
    state.portId = '75';
    state.buildingId = '2';
    state.storyEvents.push(`${prefix}defense-reported`);
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    const pickup = resolve();
    expect(pickup?.id).toBe(`${prefix}staff-received`);
    finish(pickup!);
    expect(
      state.items.filter((itemId) => itemId === 'm3-staff-of-the-saint'),
    ).toHaveLength(1);
    expect(setItem).toHaveBeenCalledTimes(1);

    expect(load()).toBe(true);
    expect(
      state.items.filter((itemId) => itemId === 'm3-staff-of-the-saint'),
    ).toHaveLength(1);
    state.buildingId = '8';
    const handIn = resolve();
    expect(handIn?.id).toBe(`${prefix}staff-returned`);
    finish(handIn!);

    expect(state.items).not.toContain('m3-staff-of-the-saint');
    expect(state.items.filter((itemId) => itemId === '45')).toHaveLength(1);
    expect(state.fame.adventure).toBe(5030);
    expect(state.mates).toEqual(originalMates);
    expect(state.storyEvents).toContain(`${prefix}staff-returned`);
    expect(setItem).toHaveBeenCalledTimes(2);

    expect(load()).toBe(true);
    expect(state.items.filter((itemId) => itemId === '45')).toHaveLength(1);
    expect(state.fame.adventure).toBe(5030);
    expect(resolve()?.id).not.toBe(`${prefix}staff-returned`);
  });

  test('preflights an invalid hand-in before granting the Crown, fame, completion, or save', () => {
    const handIn = event('staff-returned');
    const effects = handIn.steps.find((step) => step.type === 'effect');
    if (!effects || effects.type !== 'effect')
      throw new Error('Missing hand-in effects');
    const before = JSON.stringify(state);
    const savedBefore = localStorage.getItem(SAVED_STATE_KEY);
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    expect(executeStoryEffects(effects.effects, storyRuntimeActions)).toEqual({
      ok: false,
      executed: 0,
      diagnostics: [expect.objectContaining({ code: 'missing-item' })],
    });
    expect(JSON.stringify(state)).toBe(before);
    expect(localStorage.getItem(SAVED_STATE_KEY)).toBe(savedBefore);
    expect(setItem).not.toHaveBeenCalled();
  });

  test('unlocks reconciliation only after the Staff consumption marker', () => {
    state.portId = '75';
    state.buildingId = '4';
    state.storyEvents.push(`${prefix}staff-received`);
    state.items.push('m3-staff-of-the-saint');
    expect(resolve()?.id).not.toBe(`${prefix}chapter-complete`);

    state.storyEvents.push(`${prefix}staff-returned`);
    state.items = state.items.filter(
      (itemId) => itemId !== 'm3-staff-of-the-saint',
    );
    expect(resolve()?.id).toBe(`${prefix}chapter-complete`);
    finish(resolve()!);
    expect(state.storyEvents).toContain(`${prefix}chapter-complete`);
  });
});
