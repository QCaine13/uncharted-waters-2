import state from './state';
import updateInterface from './updateInterface';
import {
  completeLegacyQuestOnce,
  getSupplyLimit,
  supplyShip,
} from './actionsPort';

const ship = () => ({
  id: '6',
  name: 'Hermes II',
  crew: 10,
  cargo: [],
  durability: 25,
});

describe('harbor supply transactions', () => {
  beforeEach(() => {
    state.gold = 100;
    state.fleets = { '1': { position: undefined, ships: [ship()] } };
    updateInterface.general = jest.fn();
    window.localStorage.clear();
  });

  test('limits paid supplies by funds and water only by capacity', () => {
    expect(getSupplyLimit(0, 'food')).toBe(5);
    expect(getSupplyLimit(0, 'water')).toBe(110);
  });

  test.each([0, -1, 1.5, Number.NaN])(
    'rejects invalid quantity %s without mutation',
    (quantity) => {
      const before = JSON.stringify(state.fleets);
      expect(supplyShip(0, 'food', quantity)).toBe(false);
      expect(JSON.stringify(state.fleets)).toBe(before);
      expect(state.gold).toBe(100);
      expect(window.localStorage.length).toBe(0);
    },
  );

  test('rejects unaffordable or over-capacity quantities atomically', () => {
    expect(supplyShip(0, 'food', 6)).toBe(false);
    expect(supplyShip(0, 'water', 111)).toBe(false);
    expect(state.fleets['1'].ships[0].cargo).toEqual([]);
    expect(state.gold).toBe(100);
  });

  test('applies a valid purchase once and persists it', () => {
    expect(supplyShip(0, 'food', 5)).toBe(true);
    expect(state.fleets['1'].ships[0].cargo).toEqual([
      { type: 'food', quantity: 5 },
    ]);
    expect(state.gold).toBe(0);
    expect(window.localStorage.length).toBe(1);
  });
});

describe('legacy quest completion', () => {
  beforeEach(() => {
    state.quests = [];
  });

  test('records a completion marker only once', () => {
    completeLegacyQuestOnce('houseBeforeQuest');
    completeLegacyQuestOnce('houseBeforeQuest');

    expect(state.quests).toEqual(['houseBeforeQuest']);
  });
});
