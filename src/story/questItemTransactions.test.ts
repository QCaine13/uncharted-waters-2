import { itemData, type ItemId } from '../data/itemData';
import { sellItem } from '../state/actionsPort';
import state from '../state/state';
import updateInterface from '../state/updateInterface';
import { executeStoryEffects } from './core/effects';
import { storyEventId, type StoryEffect } from './core/types';
import { storyRuntimeActions } from './storyRuntimeActions';

const STAFF_ID = 'm3-staff-of-the-saint' as ItemId;
const COMPLETION_ID = storyEventId('joao.lisbon-opening.harbor-final');

describe('quest item transactions', () => {
  beforeEach(() => {
    state.timePassed = 600;
    state.gold = 0;
    state.items = [];
    state.storyEvents = [];
    state.storyEventTimes = {};
    state.equipment = { weaponId: null, armorId: null };
    updateInterface.general = jest.fn();
    window.localStorage.clear();
  });

  afterEach(() => jest.restoreAllMocks());

  test('receives and consumes the Staff before completing in one saved group', () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    const effects = [
      { type: 'receiveItem', itemId: STAFF_ID },
      { type: 'consumeItem', itemId: STAFF_ID },
      { type: 'completeEvent', eventId: COMPLETION_ID },
    ] as unknown as StoryEffect[];

    expect(executeStoryEffects(effects, storyRuntimeActions)).toEqual({
      ok: true,
      executed: 3,
    });
    expect(state.items).not.toContain(STAFF_ID);
    expect(state.storyEvents).toContain(COMPLETION_ID);
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  test('rejects consuming a missing Staff before gold, completion, or save changes', () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    const before = JSON.stringify(state);
    const effects = [
      { type: 'receiveGold', amount: 500 },
      { type: 'consumeItem', itemId: STAFF_ID },
      { type: 'completeEvent', eventId: COMPLETION_ID },
    ] as unknown as StoryEffect[];

    expect(executeStoryEffects(effects, storyRuntimeActions)).toEqual({
      ok: false,
      executed: 0,
      diagnostics: [expect.objectContaining({ code: 'missing-item' })],
    });
    expect(JSON.stringify(state)).toBe(before);
    expect(setItem).not.toHaveBeenCalled();
  });

  test('rejects consuming one owned Staff twice before the first effect', () => {
    state.items = [STAFF_ID];
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    const before = JSON.stringify(state);
    const effects = [
      { type: 'receiveGold', amount: 500 },
      { type: 'consumeItem', itemId: STAFF_ID },
      { type: 'consumeItem', itemId: STAFF_ID },
    ] as unknown as StoryEffect[];

    expect(executeStoryEffects(effects, storyRuntimeActions)).toEqual({
      ok: false,
      executed: 0,
      diagnostics: [expect.objectContaining({ code: 'missing-item' })],
    });
    expect(JSON.stringify(state)).toBe(before);
    expect(setItem).not.toHaveBeenCalled();
  });

  test('keeps equipment for another copy and clears it when the last copy is consumed', () => {
    state.items = ['4', '4'];
    state.equipment.weaponId = '4';
    const consumeRapier = [
      { type: 'consumeItem', itemId: '4' },
    ] as unknown as StoryEffect[];

    expect(executeStoryEffects(consumeRapier, storyRuntimeActions)).toEqual({
      ok: true,
      executed: 1,
    });
    expect(state.items).toEqual(['4']);
    expect(state.equipment.weaponId).toBe('4');

    expect(executeStoryEffects(consumeRapier, storyRuntimeActions)).toEqual({
      ok: true,
      executed: 1,
    });
    expect(state.items).toEqual([]);
    expect(state.equipment.weaponId).toBeNull();
  });

  test('refuses to sell the Staff without changing gold, items, or saved data', () => {
    state.gold = 75;
    state.items = ['4', STAFF_ID, '4'];
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    expect(sellItem(1)).toBe(false);
    expect(state.gold).toBe(75);
    expect(state.items).toEqual(['4', STAFF_ID, '4']);
    expect(setItem).not.toHaveBeenCalled();
  });

  test('retains legacy Crown pricing and sells the selected ordinary duplicate', () => {
    state.items = ['4', '45', '4'];

    expect(sellItem(1)).toBe(true);
    expect(state.gold).toBe(150_000);
    expect(state.items).toEqual(['4', '4']);

    expect(sellItem(1)).toBe(true);
    expect(state.gold).toBe(151_500);
    expect(state.items).toEqual(['4']);
    expect(itemData['45'].price).toBe(300_000);
  });
});
