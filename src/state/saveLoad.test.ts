import state from './state';
import { save, load } from './saveLoad';
import { getLoadGeneration, subscribeGameLoad } from './saveEvents';
import { advanceDuel, createDuel } from '../combat/duel';
import { advanceNaval, createNaval } from '../combat/naval';
import type { DuelCombatantStats } from '../combat/types';

const fighter: DuelCombatantStats = {
  swordplay: 82,
  level: 3,
  weaponRating: 15,
  armorRating: 20,
  weaponCategory: '2',
};

describe('save/load round trip', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('preserves a sparse marketPrices map', () => {
    state.marketPrices = {
      '1': { '10': { index: 130, updatedDay: 4 } },
      '2': { '3': { index: 70, updatedDay: 9 } },
    };

    save();
    state.marketPrices = {};

    expect(load()).toBe(true);
    expect(state.marketPrices).toEqual({
      '1': { '10': { index: 130, updatedDay: 4 } },
      '2': { '3': { index: 70, updatedDay: 9 } },
    });
  });

  test('preserves an empty marketPrices map', () => {
    state.marketPrices = {};

    save();
    state.marketPrices = { '1': { '10': { index: 130, updatedDay: 4 } } };

    expect(load()).toBe(true);
    expect(state.marketPrices).toEqual({});
  });

  test('preserves discoveries', () => {
    state.discoveries = ['strait-of-gibraltar', 'azores'];

    save();
    state.discoveries = [];

    expect(load()).toBe(true);
    expect(state.discoveries).toEqual(['strait-of-gibraltar', 'azores']);
  });

  test('preserves semantic story events and reported discoveries', () => {
    state.storyEvents = ['chapter.event', 'future.event'];
    state.reportedDiscoveries = ['strait-of-gibraltar', 'future-landmark'];

    save();
    state.storyEvents = [];
    state.reportedDiscoveries = [];

    expect(load()).toBe(true);
    expect(state.storyEvents).toEqual(['chapter.event', 'future.event']);
    expect(state.reportedDiscoveries).toEqual([
      'strait-of-gibraltar',
      'future-landmark',
    ]);
  });

  test('preserves equipment, unknown progress/results, and an ongoing duel exactly', () => {
    state.items = ['4', '18'];
    state.equipment = { weaponId: '4', armorId: '18' };
    state.mateProgress = {
      '1': { battleExperience: 240 },
      'future-mate': { battleExperience: 7 },
    };
    state.combatResults = {
      'joao.m2.kahn-house': 'victory',
      'future.encounter': 'draw',
    };
    state.activeCombat = advanceDuel(
      createDuel({
        encounterId: 'joao.m2.kahn-house',
        player: fighter,
        enemy: fighter,
      }),
      { type: 'attack', attack: 'thrust' },
    );
    const expected = JSON.parse(JSON.stringify(state.activeCombat));

    save();
    state.equipment = { weaponId: null, armorId: null };
    state.mateProgress = {};
    state.combatResults = {};
    state.activeCombat = null;

    expect(load()).toBe(true);
    expect(state.equipment).toEqual({ weaponId: '4', armorId: '18' });
    expect(state.mateProgress).toEqual({
      '1': { battleExperience: 240 },
      'future-mate': { battleExperience: 7 },
    });
    expect(state.combatResults).toEqual({
      'joao.m2.kahn-house': 'victory',
      'future.encounter': 'draw',
    });
    expect(state.activeCombat).toEqual(expected);
  });

  test('preserves an ongoing naval challenge through a JSON round trip', () => {
    const naval = createNaval({
      encounterId: 'joao.m2.kahn-shipyard',
      player: { hull: 30, maxHull: 30, crew: 20, guns: 8, shot: 3, lumber: 2 },
      playerDuel: fighter,
    });
    state.activeCombat = advanceNaval(
      { ...naval, range: 0 },
      { type: 'challenge' },
    );
    const expected = JSON.parse(JSON.stringify(state.activeCombat));

    save();
    state.activeCombat = null;

    expect(load()).toBe(true);
    expect(state.activeCombat).toEqual(expected);
  });

  test('defaults missing v6 fields and discards malformed combat without minting results', () => {
    save();
    const saved = JSON.parse(window.localStorage.getItem('savedState')!);
    delete saved.equipment;
    delete saved.mateProgress;
    saved.combatResults = {
      validUnknown: 'retreat',
      invalidUnknown: 'win',
    };
    saved.activeCombat = {
      kind: 'naval',
      encounterId: 'future.encounter',
      outcome: 'victory',
    };
    window.localStorage.setItem('savedState', JSON.stringify(saved));

    expect(load()).toBe(true);
    expect(state.equipment).toEqual({ weaponId: null, armorId: null });
    expect(state.mateProgress).toEqual({});
    expect(state.combatResults).toEqual({ validUnknown: 'retreat' });
    expect(state.activeCombat).toBeNull();
  });

  test('notifies subscribers after a successful load clears runtime objects', () => {
    save();
    state.world = {} as typeof state.world;
    state.port = {} as typeof state.port;
    const listener = jest.fn(() => {
      expect(state.world).toBeUndefined();
      expect(state.port).toBeUndefined();
    });
    const unsubscribe = subscribeGameLoad(listener);

    expect(load()).toBe(true);

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  test('does not advance the load generation for a failed load', () => {
    const before = getLoadGeneration();
    const stateBefore = JSON.stringify(state);
    window.localStorage.setItem('savedState', '{broken');

    expect(load()).toBe(false);
    expect(getLoadGeneration()).toBe(before);
    expect(JSON.stringify(state)).toBe(stateBefore);
  });
});
