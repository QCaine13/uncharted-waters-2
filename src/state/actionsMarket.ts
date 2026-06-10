import state from './state';
import { goodData, GoodId } from '../data/goodsData';
import {
  getMarketBuyPrice,
  getMarketSellPrice,
  marketGoodsData,
} from '../data/marketGoodsData';
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

export const getMarketGoods = () => {
  const marketId = getMarketId();
  if (!marketId) return [];

  const market = marketGoodsData[marketId];
  const allGoods = Object.keys(goodData) as GoodId[];

  return allGoods.map((goodId) => {
    const good = goodData[goodId];
    const buyPrice = getMarketBuyPrice(marketId, goodId, good.basePrice);
    const isSupply = market.supplies.includes(goodId);
    const isDemand = market.demands.includes(goodId);

    return {
      id: goodId,
      name: good.name,
      category: good.category,
      buyPrice,
      isSupply,
      isDemand,
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

      const sellPrice = marketId
        ? getMarketSellPrice(marketId, goodId, good.basePrice)
        : Math.floor(good.basePrice * 0.8);

      result.push({
        shipNumber,
        cargoIndex,
        id: goodId,
        name: good.name,
        quantity: cargoItem.quantity,
        sellPrice,
      });
    });
  });

  return result;
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
  const unitPrice = getMarketBuyPrice(marketId, goodId, good.basePrice);
  const totalCost = unitPrice * quantity;

  if (totalCost > state.gold) return false;

  const availableSpace = getAvailableCargoSpace();
  if (availableSpace <= 0) return false;

  const actualQuantity = Math.min(quantity, availableSpace);
  const actualCost = unitPrice * actualQuantity;

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
  const unitPrice = marketId
    ? getMarketSellPrice(marketId, goodId, good.basePrice)
    : Math.floor(good.basePrice * 0.8);
  const totalRevenue = unitPrice * actualQuantity;

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
