import {
  DEFAULT_INDEX,
  MIN_INDEX,
  MAX_INDEX,
  IMPACT_UNITS_PER_POINT,
  getCurrentIndex,
  getBuyPrice,
  getSellPrice,
  settleBuy,
  settleSell,
} from './marketPricing';

describe('lazy regression toward the default index', () => {
  test.each([
    ['no stored entry defaults to 100', undefined, 0, DEFAULT_INDEX],
    [
      'above default holds with no elapsed days',
      { index: 130, updatedDay: 10 },
      10,
      130,
    ],
    [
      'above default regresses exactly to 100 after enough days',
      { index: 130, updatedDay: 10 },
      40,
      100,
    ],
    [
      'above default never overshoots below 100 on a huge gap',
      { index: 130, updatedDay: 10 },
      1000,
      100,
    ],
    [
      'below default holds with no elapsed days',
      { index: 70, updatedDay: 5 },
      5,
      70,
    ],
    [
      'below default regresses exactly to 100 after enough days',
      { index: 70, updatedDay: 5 },
      35,
      100,
    ],
    [
      'below default never overshoots above 100 on a huge gap',
      { index: 70, updatedDay: 5 },
      10000,
      100,
    ],
    ['already at default stays there', { index: 100, updatedDay: 5 }, 50, 100],
  ] as const)('%s', (_label, entry, currentDay, expected) => {
    expect(getCurrentIndex(entry, currentDay)).toBe(expected);
  });
});

describe('buy/sell price from an index', () => {
  test.each([
    [40, 44, 36],
    [100, 110, 90],
    [200, 220, 180],
  ])('reference 100 at index %i buys at %i and sells at %i', (index, buy, sell) => {
    expect(getBuyPrice(100, index)).toBe(buy);
    expect(getSellPrice(100, index)).toBe(sell);
  });

  // Different floors on purpose: a shared floor of 1 would make buy and sell
  // equal at a degenerate reference price, breaking the buy > sell invariant.
  test('buy floors at 1 and sell floors at 0, keeping buy above sell', () => {
    expect(getBuyPrice(0, 100)).toBe(1);
    expect(getSellPrice(0, 100)).toBe(0);
  });
});

describe('chunked trade settlement', () => {
  test('buying raises the index by one point per chunk', () => {
    const { totalPrice, nextIndex } = settleBuy(
      100,
      100,
      IMPACT_UNITS_PER_POINT,
    );
    expect(nextIndex).toBe(101);
    expect(totalPrice).toBe(getBuyPrice(100, 100) * IMPACT_UNITS_PER_POINT);
  });

  test('selling lowers the index by one point per chunk', () => {
    const { totalPrice, nextIndex } = settleSell(
      100,
      100,
      IMPACT_UNITS_PER_POINT,
    );
    expect(nextIndex).toBe(99);
    expect(totalPrice).toBe(getSellPrice(100, 100) * IMPACT_UNITS_PER_POINT);
  });

  test('buying clamps at MAX_INDEX', () => {
    expect(settleBuy(100, MAX_INDEX, IMPACT_UNITS_PER_POINT).nextIndex).toBe(
      MAX_INDEX,
    );
  });

  test('selling clamps at MIN_INDEX', () => {
    expect(settleSell(100, MIN_INDEX, IMPACT_UNITS_PER_POINT).nextIndex).toBe(
      MIN_INDEX,
    );
  });

  test('a multi-chunk trade does not settle at a single unit price', () => {
    const quantity = IMPACT_UNITS_PER_POINT * 2;
    const { totalPrice } = settleBuy(100, 100, quantity);
    const flatPrice = getBuyPrice(100, 100) * quantity;

    // Marginal units cost more once the first chunk has raised the index.
    expect(totalPrice).not.toBe(flatPrice);
    expect(totalPrice).toBeGreaterThan(flatPrice);
  });

  test('selling 2q yields strictly less than twice the revenue of selling q, before clamping', () => {
    const q = IMPACT_UNITS_PER_POINT;
    const sellQ = settleSell(100, 100, q).totalPrice;
    const sell2Q = settleSell(100, 100, q * 2).totalPrice;

    expect(sell2Q).toBeLessThan(sellQ * 2);
  });

  test('a zero-quantity trade settles for nothing and leaves the index unchanged', () => {
    expect(settleBuy(100, 100, 0)).toEqual({ totalPrice: 0, nextIndex: 100 });
    expect(settleSell(100, 100, 0)).toEqual({
      totalPrice: 0,
      nextIndex: 100,
    });
  });
});
