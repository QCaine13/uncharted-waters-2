import state from './state';
import { goodData, GoodId } from '../data/goodsData';
import {
  getMarketBuyPrice,
  getMarketSellPrice,
  getMarketReferencePrice,
  marketGoodsData,
} from '../data/marketGoodsData';
import {
  getCurrentIndex,
  settleBuy,
  settleSell,
  DEFAULT_INDEX,
} from '../data/marketPricing';
import { MarketId } from '../data/portExtraData';
import { getPortData } from '../game/port/portUtils';
import { getPlayerFleet } from './selectorsFleet';
import { shipData } from '../data/shipData';
import updateInterface from './updateInterface';
import { save } from './saveLoad';
import { provisions } from '../game/world/fleets';

const getMarketId = () => {
  const port = getPortData(state.portId!);
  if (port.isSupplyPort) return null;
  return port.marketId;
};

const getCurrentDay = () => Math.floor(state.timePassed / 1440);

const getPriceIndex = (marketId: MarketId, goodId: GoodId): number =>
  getCurrentIndex(state.marketPrices[marketId]?.[goodId], getCurrentDay());

const setPriceIndex = (
  marketId: MarketId,
  goodId: GoodId,
  index: number,
): void => {
  if (!state.marketPrices[marketId]) {
    state.marketPrices[marketId] = {};
  }
  state.marketPrices[marketId][goodId] = { index, updatedDay: getCurrentDay() };
};

export const getMarketGoods = () => {
  const marketId = getMarketId();
  if (!marketId) return [];

  const market = marketGoodsData[marketId];
  const allGoods = Object.keys(goodData) as GoodId[];

  return allGoods.map((goodId) => {
    const good = goodData[goodId];
    const index = getPriceIndex(marketId, goodId);
    const buyPrice = getMarketBuyPrice(marketId, goodId, good.basePrice, index);
    const isSupply = market.supplies.includes(goodId);
    const isDemand = market.demands.includes(goodId);

    return {
      id: goodId,
      name: good.name,
      category: good.category,
      buyPrice,
      isSupply,
      isDemand,
      index,
    };
  });
};

export const getCargoGoods = () => {
  const marketId = getMarketId();
  const fleet = getPlayerFleet();
  const result: {
    shipNumber: number;
    cargoIndex: number;
    id: GoodId;
    name: string;
    quantity: number;
    sellPrice: number;
    index: number;
  }[] = [];

  fleet.forEach((ship, shipNumber) => {
    ship.cargo.forEach((cargoItem, cargoIndex) => {
      const isProvision = (provisions as readonly string[]).includes(
        cargoItem.type,
      );
      if (isProvision) return;

      const goodId = cargoItem.type as GoodId;
      const good = goodData[goodId];
      if (!good) return;

      // Supply ports have no dynamic pricing at all (flat 0.8 fallback), so
      // there's no index to report there beyond the neutral default.
      const index = marketId ? getPriceIndex(marketId, goodId) : DEFAULT_INDEX;
      const sellPrice = marketId
        ? getMarketSellPrice(marketId, goodId, good.basePrice, index)
        : Math.floor(good.basePrice * 0.8);

      result.push({
        shipNumber,
        cargoIndex,
        id: goodId,
        name: good.name,
        quantity: cargoItem.quantity,
        sellPrice,
        index,
      });
    });
  });

  return result;
};

// For PortInfo, which can be asked about any port — not necessarily the one
// the player is currently docked at — so this takes portId explicitly
// instead of going through getMarketId()'s reliance on state.portId.
export const getPortPriceIndex = (portId: string): number | null => {
  const port = getPortData(portId);
  if (port.isSupplyPort) return null;

  const { marketId } = port;
  const currentDay = getCurrentDay();
  const indexes = (Object.keys(goodData) as GoodId[]).map((goodId) =>
    getCurrentIndex(state.marketPrices[marketId]?.[goodId], currentDay),
  );

  return Math.round(
    indexes.reduce((sum, index) => sum + index, 0) / indexes.length,
  );
};

export const getAvailableCargoSpace = () => {
  const fleet = getPlayerFleet();

  return fleet.reduce((total, ship) => {
    const { capacity, minimumCrew } = shipData[ship.id];
    const used = ship.cargo.reduce((sum, c) => sum + c.quantity, 0);
    return total + (capacity - minimumCrew - used);
  }, 0);
};

export const buyGood = (goodId: GoodId, quantity: number): boolean => {
  const marketId = getMarketId();
  if (!marketId) return false;

  const good = goodData[goodId];
  const referencePrice = getMarketReferencePrice(
    marketId,
    goodId,
    good.basePrice,
  );
  const index = getPriceIndex(marketId, goodId);
  const totalCost = settleBuy(referencePrice, index, quantity).totalPrice;

  if (totalCost > state.gold) return false;

  const availableSpace = getAvailableCargoSpace();
  if (availableSpace <= 0) return false;

  const actualQuantity = Math.min(quantity, availableSpace);
  const { totalPrice: actualCost, nextIndex } = settleBuy(
    referencePrice,
    index,
    actualQuantity,
  );

  let remaining = actualQuantity;
  const fleet = getPlayerFleet();

  for (let i = 0; i < fleet.length && remaining > 0; i += 1) {
    const ship = fleet[i];
    const { capacity, minimumCrew } = shipData[ship.id];
    const used = ship.cargo.reduce((sum, c) => sum + c.quantity, 0);
    const shipSpace = capacity - minimumCrew - used;

    if (shipSpace > 0) {
      const addToShip = Math.min(remaining, shipSpace);
      const existing = ship.cargo.find((c) => c.type === goodId);

      if (existing) {
        existing.quantity += addToShip;
      } else {
        ship.cargo.push({ type: goodId, quantity: addToShip });
      }

      remaining -= addToShip;
    }
  }

  state.gold -= actualCost;
  if (actualQuantity > 0) {
    setPriceIndex(marketId, goodId, nextIndex);
  }

  updateInterface.general({
    portId: state.portId,
    buildingId: state.buildingId,
    timePassed: state.timePassed,
    gold: state.gold,
  });

  save();
  return true;
};

export const sellGood = (
  shipNumber: number,
  cargoIndex: number,
  quantity: number,
): boolean => {
  const marketId = getMarketId();
  const fleet = getPlayerFleet();
  const ship = fleet[shipNumber];

  if (!ship) return false;

  const cargoItem = ship.cargo[cargoIndex];
  if (!cargoItem) return false;

  const goodId = cargoItem.type as GoodId;
  const good = goodData[goodId];
  if (!good) return false;

  const actualQuantity = Math.min(quantity, cargoItem.quantity);

  let totalRevenue: number;

  if (marketId) {
    const referencePrice = getMarketReferencePrice(
      marketId,
      goodId,
      good.basePrice,
    );
    const index = getPriceIndex(marketId, goodId);
    const settlement = settleSell(referencePrice, index, actualQuantity);
    totalRevenue = settlement.totalPrice;

    if (actualQuantity > 0) {
      setPriceIndex(marketId, goodId, settlement.nextIndex);
    }
  } else {
    totalRevenue = Math.floor(good.basePrice * 0.8) * actualQuantity;
  }

  state.gold += totalRevenue;

  if (actualQuantity >= cargoItem.quantity) {
    ship.cargo.splice(cargoIndex, 1);
  } else {
    cargoItem.quantity -= actualQuantity;
  }

  updateInterface.general({
    portId: state.portId,
    buildingId: state.buildingId,
    timePassed: state.timePassed,
    gold: state.gold,
  });

  save();
  return true;
};
