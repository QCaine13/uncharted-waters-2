import state from './state';
import updateInterface from './updateInterface';
import {
  buyGood,
  sellGood,
  getMarketGoods,
  getCargoGoods,
  getPortPriceIndex,
} from './actionsMarket';
import { getMarketReferencePrice } from '../data/marketGoodsData';
import {
  getBuyPrice,
  getSellPrice,
  settleBuy,
  settleSell,
  DEFAULT_INDEX,
} from '../data/marketPricing';
import { goodData } from '../data/goodsData';

const ship = () => ({
  id: '6',
  name: 'Hermes II',
  crew: 10,
  cargo: [],
  durability: 25,
});

describe('market trading actions', () => {
  beforeEach(() => {
    state.portId = '1'; // Lisbon, Iberia market
    state.timePassed = 480;
    state.gold = 100000;
    state.fleets = { '1': { position: undefined, ships: [ship()] } };
    state.marketPrices = {};
    updateInterface.general = jest.fn();
    window.localStorage.clear();
  });

  test('buyGood settles in chunks and writes the resulting index back to state', () => {
    const referencePrice = getMarketReferencePrice(
      '1',
      '1',
      goodData['1'].basePrice,
    ); // Wheat, neutral multiplier
    const expected = settleBuy(referencePrice, DEFAULT_INDEX, 6);

    const before = state.gold;
    expect(buyGood('1', 6)).toBe(true);

    expect(before - state.gold).toBe(expected.totalPrice);
    expect(state.marketPrices['1']['1']).toEqual({
      index: expected.nextIndex,
      updatedDay: 0,
    });
    expect(state.fleets['1'].ships[0].cargo).toEqual([
      { type: '1', quantity: 6 },
    ]);
  });

  test('buyGood rejects when the full requested quantity is unaffordable', () => {
    const referencePrice = getMarketReferencePrice(
      '1',
      '1',
      goodData['1'].basePrice,
    );
    const cost = settleBuy(referencePrice, DEFAULT_INDEX, 3).totalPrice;
    state.gold = cost - 1;
    const fleetBefore = JSON.stringify(state.fleets);

    expect(buyGood('1', 3)).toBe(false);

    expect(state.gold).toBe(cost - 1);
    expect(JSON.stringify(state.fleets)).toBe(fleetBefore);
    expect(window.localStorage.length).toBe(0);
  });

  test('buyGood clamps to available cargo space and only pays for what is loaded', () => {
    state.fleets['1'].ships[0].cargo = [{ type: '2', quantity: 108 }]; // leaves 2 space of 110
    const referencePrice = getMarketReferencePrice(
      '1',
      '1',
      goodData['1'].basePrice,
    );
    const expected = settleBuy(referencePrice, DEFAULT_INDEX, 2);

    const before = state.gold;
    expect(buyGood('1', 5)).toBe(true);

    expect(before - state.gold).toBe(expected.totalPrice);
    expect(state.fleets['1'].ships[0].cargo).toEqual([
      { type: '2', quantity: 108 },
      { type: '1', quantity: 2 },
    ]);
  });

  test('sellGood settles in chunks, writes a lower index back, and reduces cargo', () => {
    state.fleets['1'].ships[0].cargo = [{ type: '3', quantity: 10 }]; // Wine, supply multiplier
    const referencePrice = getMarketReferencePrice(
      '1',
      '3',
      goodData['3'].basePrice,
    );
    const expected = settleSell(referencePrice, DEFAULT_INDEX, 4);

    const before = state.gold;
    expect(sellGood(0, 0, 4)).toBe(true);

    expect(state.gold - before).toBe(expected.totalPrice);
    expect(expected.nextIndex).toBeLessThan(DEFAULT_INDEX);
    expect(state.marketPrices['1']['3']).toEqual({
      index: expected.nextIndex,
      updatedDay: 0,
    });
    expect(state.fleets['1'].ships[0].cargo).toEqual([
      { type: '3', quantity: 6 },
    ]);
  });

  test('selling the full quantity removes the cargo entry', () => {
    state.fleets['1'].ships[0].cargo = [{ type: '3', quantity: 4 }];

    expect(sellGood(0, 0, 4)).toBe(true);

    expect(state.fleets['1'].ships[0].cargo).toEqual([]);
  });

  test('sellGood at a supply port uses the flat fallback price and leaves marketPrices untouched', () => {
    state.portId = '102'; // Hekla, a supply port
    state.fleets['1'].ships[0].cargo = [{ type: '3', quantity: 4 }];

    const before = state.gold;
    expect(sellGood(0, 0, 4)).toBe(true);

    expect(state.gold - before).toBe(Math.floor(70 * 0.8) * 4);
    expect(state.marketPrices).toEqual({});
  });

  test('getMarketGoods reflects the current regressed index without mutating state', () => {
    state.marketPrices = { '1': { '1': { index: 130, updatedDay: 0 } } };
    state.timePassed = 1440 * 30; // 30 days later, fully regressed

    const wheat = getMarketGoods().find((good) => good.id === '1');

    expect(wheat?.buyPrice).toBe(getBuyPrice(40, DEFAULT_INDEX));
    expect(wheat?.index).toBe(DEFAULT_INDEX);
    expect(state.marketPrices).toEqual({
      '1': { '1': { index: 130, updatedDay: 0 } },
    });
  });

  test('getCargoGoods reflects the current index for owned cargo', () => {
    state.fleets['1'].ships[0].cargo = [{ type: '3', quantity: 5 }];
    state.marketPrices = { '1': { '3': { index: 70, updatedDay: 0 } } };

    const [wine] = getCargoGoods();

    expect(wine.sellPrice).toBe(getSellPrice(42, 70));
    expect(wine.index).toBe(70);
  });

  test('getCargoGoods reports the default index at a supply port (no market)', () => {
    state.portId = '102'; // Hekla, a supply port
    state.fleets['1'].ships[0].cargo = [{ type: '3', quantity: 4 }];

    const [wine] = getCargoGoods();

    expect(wine.index).toBe(DEFAULT_INDEX);
  });

  describe('same-port round trip', () => {
    test.each(['1', '3', '10'] as const)(
      'buying then immediately selling good %s at the same port never profits',
      (goodId) => {
        state.gold = 1000000;

        expect(buyGood(goodId, 5)).toBe(true);
        const cargoIndex = state.fleets['1'].ships[0].cargo.findIndex(
          (item) => item.type === goodId,
        );
        expect(sellGood(0, cargoIndex, 5)).toBe(true);

        expect(state.gold).toBeLessThan(1000000);
      },
    );
  });

  describe('getPortPriceIndex', () => {
    test('averages every good’s current index at the given port, independent of state.portId', () => {
      state.portId = '3'; // currently docked somewhere else entirely
      state.marketPrices = { '1': { '1': { index: 130, updatedDay: 0 } } };

      const goodCount = Object.keys(goodData).length;
      const expectedMean = Math.round(
        (130 + DEFAULT_INDEX * (goodCount - 1)) / goodCount,
      );

      expect(getPortPriceIndex('1')).toBe(expectedMean);
    });

    test('returns null at a supply port', () => {
      expect(getPortPriceIndex('102')).toBeNull(); // Hekla, a supply port
    });
  });
});
