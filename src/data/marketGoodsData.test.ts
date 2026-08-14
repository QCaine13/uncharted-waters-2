import { goodData, GoodId } from './goodsData';
import {
  marketGoodsData,
  getMarketBuyPrice,
  getMarketSellPrice,
  getMarketReferencePrice,
} from './marketGoodsData';
import { MarketId } from './portExtraData';
import { MIN_INDEX, MAX_INDEX } from './marketPricing';

const marketIds = Object.keys(marketGoodsData) as MarketId[];
const goodIds = Object.keys(goodData) as GoodId[];

describe('market goods table', () => {
  test('no good is both a supply and a demand of the same market', () => {
    marketIds.forEach((marketId) => {
      const { supplies, demands } = marketGoodsData[marketId];
      const overlap = supplies.filter((goodId) => demands.includes(goodId));

      expect(overlap).toEqual([]);
    });
  });

  // The shipped Market MVP let any good that was in `demands` but not
  // `supplies` sell for more than it bought in the same port — 55 such pairs
  // across all 13 markets. Sweep the whole index range, not samples.
  test('buy price exceeds sell price for every market, good, and index', () => {
    const violations: string[] = [];

    marketIds.forEach((marketId) => {
      goodIds.forEach((goodId) => {
        for (let index = MIN_INDEX; index <= MAX_INDEX; index += 1) {
          const { basePrice } = goodData[goodId];
          const buy = getMarketBuyPrice(marketId, goodId, basePrice, index);
          const sell = getMarketSellPrice(marketId, goodId, basePrice, index);

          if (buy <= sell) {
            violations.push(
              `market ${marketId} good ${goodId} index ${index}: buy ${buy} <= sell ${sell}`,
            );
          }
        }
      });
    });

    expect(violations).toEqual([]);
  });

  test('applies the supply, demand, and neutral multipliers by table membership', () => {
    // Iberia ('1'): Wine ('3') supplies, Pepper ('10') demands, Wheat ('1') neither.
    expect(getMarketReferencePrice('1', '3', goodData['3'].basePrice)).toBe(
      70 * 0.6,
    );
    expect(getMarketReferencePrice('1', '10', goodData['10'].basePrice)).toBe(
      150 * 1.8,
    );
    expect(getMarketReferencePrice('1', '1', goodData['1'].basePrice)).toBe(
      40 * 1.0,
    );
  });
});
