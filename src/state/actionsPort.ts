import updateInterface from './updateInterface';
import { sample } from '../utils';
import state, { type Role } from './state';
import {
  getAvailableNewShips,
  getPortInvestment,
  getTotalFame,
  getUsedShips,
  isDay,
} from './selectors';
import { getPortData } from '../game/port/portUtils';
import { shipData } from '../data/shipData';
import { Provisions, Ship } from '../game/world/fleets';
import { minutesUntilNextMorning } from '../interface/interfaceUtils';
import type { LegacyQuestCompletionKey } from '../story/legacy/lisbonCompletionKeys';
import {
  getAvailableSpace,
  getPlayerFleet,
  getPlayerFleetShip,
  getTotalCrew,
} from './selectorsFleet';
import { itemData, ItemId } from '../data/itemData';
import { save } from './saveLoad';

export const updateGeneral = () => {
  updateInterface.general?.({
    portId: state.portId,
    buildingId: state.buildingId,
    timePassed: state.timePassed,
    gold: state.gold,
  });
};

export const enterBuilding = (buildingId: string) => {
  state.buildingId = buildingId;

  updateGeneral();
};

export const exitBuildingWithoutSave = (sleep = false) => {
  if (!sleep) {
    state.timePassed += sample([40, 60, 80]);
  } else {
    state.timePassed += minutesUntilNextMorning(state.timePassed);
  }

  state.buildingId = null;

  if (isDay()) {
    state.port.characters().spawnNpcs();
  } else {
    state.port.characters().despawnNpcs();
  }
};

export const exitBuilding = (sleep = false) => {
  exitBuildingWithoutSave(sleep);
  updateGeneral();
  save();
};

export const getAvailableSailorId = () =>
  state.mates.find(({ role }) => role === null || Number.isNaN(role))?.sailorId;

export const addShip = (ship: Omit<Ship, 'sailorId'>) => {
  const sailorId = getAvailableSailorId();
  const fleet = getPlayerFleet();

  if (!sailorId) {
    throw Error('Tried to add a ship to fleet despite no available sailors');
  }

  fleet.push(ship);

  for (let i = 0; i < state.mates.length; i += 1) {
    if (state.mates[i].sailorId === sailorId) {
      state.mates[i].role = fleet.length - 1;
      break;
    }
  }
};

const USED_SHIP_DURABILITY = 0.85;

export const buyUsedShip = (id: string, shipName: string) => {
  const usedShip = getUsedShips();
  const { durability, basePrice } = shipData[usedShip[id]];

  state.gold -= basePrice;

  addShip({
    id: usedShip[id],
    name: shipName,
    crew: 0,
    cargo: [],
    durability: Math.floor(durability * USED_SHIP_DURABILITY),
  });

  delete usedShip[id];

  updateGeneral();
  save();
};

export const SELL_SHIP_MODIFIER = 0.5;

export const sellShipNumber = (shipNumber: number) => {
  const { id } = getPlayerFleetShip(shipNumber);

  const fleet = getPlayerFleet();
  fleet.splice(shipNumber, 1);

  const sellPrice = shipData[id].basePrice * SELL_SHIP_MODIFIER;
  state.gold += sellPrice;

  for (let i = 0; i < state.mates.length; i += 1) {
    if (state.mates[i].role === shipNumber) {
      state.mates[i].role = null;
      break;
    }
  }

  if (fleet.length && shipNumber === 0) {
    const mate = state.mates.find(({ role }) => role === 1);

    if (mate) {
      mate.role = null;
    }

    state.mates[0].role = 0;
  }

  updateGeneral();
  save();
};

export const provisionCost: { [key in Provisions]: number } = {
  water: 0,
  food: 20,
  lumber: 90,
  shot: 120,
};

export const getSupplyLimit = (
  shipNumber: number,
  provision: Provisions,
): number => {
  const ship = state.fleets['1']?.ships[shipNumber];
  if (!ship) return 0;

  const availableSpace = getAvailableSpace(shipNumber);
  const unitCost = provisionCost[provision];
  const affordable =
    unitCost === 0 ? availableSpace : Math.floor(state.gold / unitCost);

  return Math.max(0, Math.min(availableSpace, affordable));
};

export const supplyShip = (
  shipNumber: number,
  provision: Provisions,
  quantity: number,
): boolean => {
  if (
    !Number.isFinite(quantity) ||
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    quantity > getSupplyLimit(shipNumber, provision)
  ) {
    return false;
  }

  const targetShip = state.fleets['1'].ships[shipNumber];
  const existing = targetShip.cargo.find((item) => item.type === provision);

  if (existing) existing.quantity += quantity;
  else targetShip.cargo.push({ type: provision, quantity });

  state.gold -= provisionCost[provision] * quantity;
  updateGeneral();
  save();
  return true;
};

export const completeLegacyQuestOnce = (id: LegacyQuestCompletionKey) => {
  if (!state.quests.includes(id)) {
    state.quests.push(id);
  }
};

export const receiveGold = (amount: number) => {
  state.gold += amount;

  updateGeneral();
};

export const receiveStoryGold = (amount: number) => {
  state.gold += amount;
};

export const checkIn = () => {
  updateInterface.fade(() => {
    exitBuilding(true);
  });
};

export const receiveStoryShip = (id: string, name: string) => {
  const { durability } = shipData[id];

  addShip({
    id,
    name,
    crew: 0,
    cargo: [],
    durability: Math.floor(durability * USED_SHIP_DURABILITY),
  });
};

export const addStoryCompanion = (sailorId: string) => {
  state.mates.push({ sailorId, role: null });
};

export const assignStoryMateRole = (sailorId: string, role: Role) => {
  const mate = state.mates.find((candidate) => candidate.sailorId === sailorId);
  if (mate && Number.isNaN(mate.role)) {
    mate.role = role;
  }
};

export const deposit = (amount: number) => {
  state.savings += amount;
  state.gold -= amount;

  updateGeneral();
  save();
};

export const withdraw = (amount: number) => {
  state.savings -= amount;
  state.gold += amount;

  updateGeneral();
  save();
};

export const borrow = (amount: number) => {
  state.debt += amount;
  state.gold += amount;

  updateGeneral();
  save();
};

export const repay = (amount: number) => {
  state.debt -= amount;
  state.gold -= amount;

  updateGeneral();
  save();
};

// TODO implement luck
export const pray = () => {};

export const donate = (amount: number) => {
  const percent = (amount / state.gold) * 100;
  state.gold -= amount;

  updateGeneral();
  save();

  return percent;
};

export const buyItem = (id: ItemId, gift = false) => {
  if (!gift) {
    const { price } = itemData[id];

    if (price > state.gold) {
      return false;
    }

    state.gold -= price;
  }

  state.items.push(id);

  updateGeneral();
  save();

  return true;
};

export const receiveStoryItem = (id: ItemId) => {
  state.items.push(id);
};

export const consumeStoryItem = (id: ItemId): boolean => {
  const index = state.items.indexOf(id);
  if (index < 0) return false;

  state.items.splice(index, 1);
  if (!state.items.includes(id)) {
    if (state.equipment.weaponId === id) state.equipment.weaponId = null;
    if (state.equipment.armorId === id) state.equipment.armorId = null;
  }
  return true;
};

export const ITEM_SHOP_SELL_MULTIPLIER = 0.5;

export const sellItem = (i: number) => {
  const id = state.items[i];
  const item = itemData[id];
  if (!item || item.sellable === false) return false;

  state.gold += item.price * ITEM_SHOP_SELL_MULTIPLIER;
  state.items.splice(i, 1);

  updateGeneral();
  save();

  return true;
};

// cost in the original game is economy / 20 + 5
export const CREW_COST = 40;

export const recruitCrew = (amount: number) => {
  let remaining = amount;

  const ships = getPlayerFleet();

  for (let i = 0; i < ships.length; i += 1) {
    if (!remaining) {
      save();
      return;
    }

    let assign = Math.max(0, shipData[ships[i].id].minimumCrew - ships[i].crew);

    if (assign > remaining) {
      assign = remaining;
    }

    ships[i].crew += assign;
    remaining -= assign;
  }

  state.gold -= amount * CREW_COST;

  updateGeneral();
  save();
};

export const dismissCrew = (amount: number): boolean => {
  if (
    !Number.isFinite(amount) ||
    !Number.isInteger(amount) ||
    amount <= 0 ||
    amount > getTotalCrew()
  ) {
    return false;
  }

  let remaining = amount;
  const ships = getPlayerFleet();

  for (let i = ships.length - 1; i >= 0 && remaining > 0; i -= 1) {
    const remove = Math.min(ships[i].crew, remaining);
    ships[i].crew -= remove;
    remaining -= remove;
  }

  updateGeneral();
  save();
  return true;
};

export const TREAT_COST = 100;

export const treatPub = (): { cost: number; bonusCrew: number } | null => {
  if (state.gold <= 0) return null;
  const cost = Math.min(state.gold, TREAT_COST);
  state.gold -= cost;

  let bonusCrew = 0;
  const ships = getPlayerFleet();
  if (ships.length > 0 && cost >= TREAT_COST) {
    const flagship = ships[0];
    const maxNormalCrew = shipData[flagship.id]?.usedCrew ?? 0;
    const room = Math.max(0, maxNormalCrew - flagship.crew);
    bonusCrew = Math.min(5, room);
    flagship.crew += bonusCrew;
  }

  updateGeneral();
  save();
  return { cost, bonusCrew };
};

export const buyNewShip = (shipId: string, shipName: string): boolean => {
  const model = shipData[shipId];
  if (!model || !state.portId) return false;
  if (!getAvailableNewShips(state.portId).includes(shipId)) return false;
  if (state.gold < model.basePrice || !getAvailableSailorId()) return false;

  state.gold -= model.basePrice;
  addShip({
    id: shipId,
    name: shipName,
    crew: 0,
    cargo: [],
    durability: model.durability,
    guns: model.usedGuns,
  });

  updateGeneral();
  save();
  return true;
};

export const REMODEL_GUN_COST = 50;

export interface RemodelQuote {
  currentGuns: number;
  maxGuns: number;
  addedGuns: number;
  cost: number;
}

export const getRemodelQuote = (shipNumber: number): RemodelQuote => {
  const ship = getPlayerFleetShip(shipNumber);
  if (!ship) {
    return { currentGuns: 0, maxGuns: 0, addedGuns: 0, cost: 0 };
  }
  const model = shipData[ship.id];
  const currentGuns = ship.guns ?? model.usedGuns;
  const maxGuns = model.maximumGuns;
  const addedGuns = Math.max(0, maxGuns - currentGuns);
  return {
    currentGuns,
    maxGuns,
    addedGuns,
    cost: addedGuns * REMODEL_GUN_COST,
  };
};

export const remodelShip = (shipNumber: number): boolean => {
  const ship = getPlayerFleetShip(shipNumber);
  if (!ship) return false;
  const quote = getRemodelQuote(shipNumber);
  if (quote.addedGuns <= 0 || state.gold < quote.cost) return false;

  state.gold -= quote.cost;
  ship.guns = quote.maxGuns;

  updateGeneral();
  save();
  return true;
};

export const investInMarket = (amount: number): boolean => {
  if (
    !state.portId ||
    !Number.isFinite(amount) ||
    !Number.isInteger(amount) ||
    amount <= 0 ||
    amount > state.gold
  ) {
    return false;
  }
  const port = getPortData(state.portId);
  if (port.isSupplyPort) return false;

  const current = getPortInvestment(state.portId);
  const points = Math.max(1, Math.floor(amount / 10));
  const maxAddable = Math.max(0, 1000 - port.economy);
  if (!state.portInvestments) state.portInvestments = {};
  state.portInvestments[state.portId] = {
    economy: Math.min(maxAddable, current.economy + points),
    industry: current.industry,
  };

  state.gold -= amount;
  state.fame.trade += Math.max(1, Math.floor(amount / 100));

  updateGeneral();
  save();
  return true;
};

export const investInShipyard = (amount: number): boolean => {
  if (
    !state.portId ||
    !Number.isFinite(amount) ||
    !Number.isInteger(amount) ||
    amount <= 0 ||
    amount > state.gold
  ) {
    return false;
  }
  const port = getPortData(state.portId);
  if (port.isSupplyPort) return false;

  const current = getPortInvestment(state.portId);
  const points = Math.max(1, Math.floor(amount / 10));
  const maxAddable = Math.max(0, 1000 - port.industry);
  if (!state.portInvestments) state.portInvestments = {};
  state.portInvestments[state.portId] = {
    economy: current.economy,
    industry: Math.min(maxAddable, current.industry + points),
  };

  state.gold -= amount;
  state.fame.trade += Math.max(1, Math.floor(amount / 100));
  delete state.usedShipsAtPort[state.portId];

  updateGeneral();
  save();
  return true;
};

export const ROYAL_FUNDING_GRANT = 500;

export const requestRoyalFunding = (): number => {
  if (state.gold >= ROYAL_FUNDING_GRANT || getTotalFame() < 20) {
    return 0;
  }
  state.gold += ROYAL_FUNDING_GRANT;
  updateGeneral();
  save();
  return ROYAL_FUNDING_GRANT;
};
