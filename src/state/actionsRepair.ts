import { shipData } from '../data/shipData';
import { updateGeneral } from './actionsPort';
import { save } from './saveLoad';
import state from './state';

const REPAIR_COST_PER_POINT = 10;

export interface RepairQuote {
  missing: number;
  points: number;
  cost: number;
}

const noRepair: RepairQuote = { missing: 0, points: 0, cost: 0 };

export const getRepairQuote = (shipIndex: number): RepairQuote => {
  const ship = state.fleets['1']?.ships[shipIndex];
  const model = ship && shipData[ship.id];
  if (!ship || !model) return noRepair;

  const missing = Math.max(0, Math.floor(model.durability - ship.durability));
  const points = Math.min(
    missing,
    Math.floor(state.gold / REPAIR_COST_PER_POINT),
  );
  return { missing, points, cost: points * REPAIR_COST_PER_POINT };
};

export const repairShip = (shipIndex: number): boolean => {
  if (state.activeCombat !== null) return false;
  const quote = getRepairQuote(shipIndex);
  if (quote.points === 0) return false;

  const ship = state.fleets['1'].ships[shipIndex];
  const maximum = shipData[ship.id].durability;
  ship.durability = Math.min(maximum, ship.durability + quote.points);
  state.gold -= quote.cost;
  updateGeneral();
  save();
  return true;
};
