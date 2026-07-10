import { CargoType, Provisions, Ship, provisions } from '../game/world/fleets';
import type { ProvisionsType } from './state';

export const LOW_PROVISIONS_DAYS = 3;

export type ConsumableProvision = 'water' | 'food';
export type ProvisionStatus = 'normal' | 'low' | 'exhausted';

export interface ProvisionSummary {
  provisions: ProvisionsType;
  dailyConsumption: number;
  daysRemaining: number | null;
  status: ProvisionStatus;
}

export interface ProvisionDeduction {
  shipNumber: number;
  provision: ConsumableProvision;
  quantity: number;
}

const consumableProvisions: ConsumableProvision[] = ['water', 'food'];

const emptyProvisions = (): ProvisionsType => ({
  water: 0,
  food: 0,
  lumber: 0,
  shot: 0,
});

const isProvision = (type: CargoType): type is Provisions =>
  (provisions as readonly CargoType[]).includes(type);

export const getProvisionTotals = (ships: Ship[]): ProvisionsType => {
  const totals = emptyProvisions();

  ships.forEach((ship) => {
    ship.cargo.forEach((item) => {
      if (isProvision(item.type)) {
        totals[item.type] += item.quantity;
      }
    });
  });

  return totals;
};

export const getDailyProvisionConsumption = (ships: Ship[]): number => {
  const crew = ships.reduce((total, current) => total + current.crew, 0);
  return Math.ceil(Math.max(0, crew) / 10);
};

export const getProvisionSummary = (ships: Ship[]): ProvisionSummary => {
  const totals = getProvisionTotals(ships);
  const dailyConsumption = getDailyProvisionConsumption(ships);

  if (dailyConsumption === 0) {
    return {
      provisions: totals,
      dailyConsumption,
      daysRemaining: null,
      status: 'normal',
    };
  }

  const daysRemaining = Math.floor(
    Math.min(totals.water, totals.food) / dailyConsumption,
  );
  let status: ProvisionStatus = 'normal';

  if (totals.water === 0 || totals.food === 0) {
    status = 'exhausted';
  } else if (daysRemaining <= LOW_PROVISIONS_DAYS) {
    status = 'low';
  }

  return { provisions: totals, dailyConsumption, daysRemaining, status };
};

export const planProvisionConsumption = (
  ships: Ship[],
  days: number,
): ProvisionDeduction[] => {
  const daysToSettle = Math.max(0, Math.floor(days));
  const required = getDailyProvisionConsumption(ships) * daysToSettle;
  const deductions: ProvisionDeduction[] = [];

  consumableProvisions.forEach((provision) => {
    let remaining = required;

    ships.forEach((ship, shipNumber) => {
      if (remaining === 0) {
        return;
      }

      const available = ship.cargo
        .filter((item) => item.type === provision)
        .reduce((total, item) => total + Math.max(0, item.quantity), 0);
      const quantity = Math.min(available, remaining);

      if (quantity > 0) {
        deductions.push({ shipNumber, provision, quantity });
        remaining -= quantity;
      }
    });
  });

  return deductions;
};
