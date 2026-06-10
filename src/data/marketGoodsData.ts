import { GoodId } from './goodsData';
import { MarketId } from './portExtraData';

export const SUPPLY_BUY_MULTIPLIER = 0.6;
export const DEMAND_SELL_MULTIPLIER = 1.8;
export const NEUTRAL_BUY_MULTIPLIER = 1.0;
export const NEUTRAL_SELL_MULTIPLIER = 0.8;

interface MarketGoodsEntry {
  supplies: GoodId[];
  demands: GoodId[];
}

export const marketGoodsData: Record<MarketId, MarketGoodsEntry> = {
  // Iberia (Lisbon, Seville, etc.)
  '1': {
    supplies: ['3', '4', '7', '2'],   // Wine, Olive Oil, Wool, Salt
    demands: ['10', '11', '8', '14', '20'], // Pepper, Cinnamon, Silk, Gold, Tea
  },
  // Northern Europe (London, Antwerp, Hamburg, etc.)
  '2': {
    supplies: ['7', '18', '19', '17'], // Wool, Iron, Lumber, Copper
    demands: ['3', '10', '5', '8', '12'], // Wine, Pepper, Sugar, Silk, Cloves
  },
  // The Mediterranean (Genoa, Venice, etc.)
  '3': {
    supplies: ['22', '3', '9', '4'],  // Glassware, Wine, Dye, Olive Oil
    demands: ['10', '8', '14', '6', '13'], // Pepper, Silk, Gold, Cotton, Nutmeg
  },
  // North Africa
  '4': {
    supplies: ['2', '17', '14'],       // Salt, Copper, Gold
    demands: ['7', '18', '22', '3'],   // Wool, Iron, Glassware, Wine
  },
  // Ottoman Empire (Istanbul, Alexandria)
  '5': {
    supplies: ['6', '9', '23'],        // Cotton, Dye, Coffee
    demands: ['7', '18', '22', '16'],  // Wool, Iron, Glassware, Ivory
  },
  // West Africa
  '6': {
    supplies: ['14', '16', '10'],      // Gold, Ivory, Pepper
    demands: ['6', '18', '3', '22'],   // Cotton, Iron, Wine, Glassware
  },
  // Central America
  '7': {
    supplies: ['5', '14', '2'],        // Sugar, Gold, Salt
    demands: ['7', '18', '3', '6'],    // Wool, Iron, Wine, Cotton
  },
  // South America
  '8': {
    supplies: ['5', '15', '19'],       // Sugar, Silver, Lumber
    demands: ['18', '3', '7', '22'],   // Iron, Wine, Wool, Glassware
  },
  // East Africa
  '9': {
    supplies: ['16', '12', '23'],      // Ivory, Cloves, Coffee
    demands: ['6', '18', '7', '22'],   // Cotton, Iron, Wool, Glassware
  },
  // Middle East
  '10': {
    supplies: ['23', '10', '9'],       // Coffee, Pepper, Dye
    demands: ['8', '22', '18', '7'],   // Silk, Glassware, Iron, Wool
  },
  // India (Calicut, Goa, etc.)
  '11': {
    supplies: ['10', '11', '6', '9'], // Pepper, Cinnamon, Cotton, Dye
    demands: ['14', '15', '8', '16'], // Gold, Silver, Silk, Ivory
  },
  // Southeast Asia (Malacca, etc.)
  '12': {
    supplies: ['12', '13', '11', '20'], // Cloves, Nutmeg, Cinnamon, Tea
    demands: ['6', '18', '21', '14'],   // Cotton, Iron, Porcelain, Gold
  },
  // Far East (Japan, China)
  '13': {
    supplies: ['20', '21', '8', '15'], // Tea, Porcelain, Silk, Silver
    demands: ['14', '10', '16', '24'], // Gold, Pepper, Ivory, Fur
  },
};

export const getMarketBuyPrice = (
  marketId: MarketId,
  goodId: GoodId,
  basePrice: number,
): number => {
  const market = marketGoodsData[marketId];
  if (market.supplies.includes(goodId)) {
    return Math.floor(basePrice * SUPPLY_BUY_MULTIPLIER);
  }
  return Math.floor(basePrice * NEUTRAL_BUY_MULTIPLIER);
};

export const getMarketSellPrice = (
  marketId: MarketId,
  goodId: GoodId,
  basePrice: number,
): number => {
  const market = marketGoodsData[marketId];
  if (market.demands.includes(goodId)) {
    return Math.floor(basePrice * DEMAND_SELL_MULTIPLIER);
  }
  return Math.floor(basePrice * NEUTRAL_SELL_MULTIPLIER);
};
