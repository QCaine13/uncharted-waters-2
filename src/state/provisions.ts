import { CargoType, Provisions, Ship, provisions } from '../game/world/fleets';
import { regularPorts, supplyPorts } from '../data/portData';
import type { Position } from '../types';
import type { ProvisionsType } from './state';

export const LOW_PROVISIONS_DAYS = 3;

// Tuning values for the starvation penalty — see design section 2.4.
// Expect to retune after play.
export const STARVATION_DEATH_RATE = 0.1;
export const BOTH_SHORT_MULTIPLIER = 2;

export type ConsumableProvision = 'water' | 'food';
export type ProvisionStatus = 'normal' | 'low' | 'exhausted';

export interface CrewLoss {
  shipNumber: number;
  deaths: number;
}

export interface ProvisionSummary {
  provisions: ProvisionsType;
  dailyConsumption: number;
  daysRemaining: number | null;
  status: ProvisionStatus;
  // Only set on the summary settleDailyProvisions returns — the outcome of
  // that day’s settlement, not a property of the fleet’s current provisions.
  starvationDays?: number;
  crewLosses?: CrewLoss[];
  adrift?: boolean;
}

export interface ProvisionDeduction {
  shipNumber: number;
  provision: ConsumableProvision;
  quantity: number;
}

export interface ProvisionSettlementPlan {
  deductions: ProvisionDeduction[];
  starvationDays: number;
  crewLosses: CrewLoss[];
  adrift: boolean;
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

const shipProvisionTotal = (ship: Ship, provision: ConsumableProvision) =>
  ship.cargo
    .filter((item) => item.type === provision)
    .reduce((total, item) => total + Math.max(0, item.quantity), 0);

// Drains `amount` of a provision across ships in fleet order, taking
// whatever a ship has before moving to the next — the same greedy order a
// starvation day and a fully-provisioned day both use, so “deduct what’s
// available, draining to zero” falls out of the same code as a normal
// deduction rather than needing its own branch.
const drainAcrossShips = (
  ships: Ship[],
  provision: ConsumableProvision,
  amount: number,
): void => {
  let remaining = amount;

  ships.forEach((ship) => {
    for (let i = 0; i < ship.cargo.length && remaining > 0; i += 1) {
      const item = ship.cargo[i];

      if (item.type === provision && item.quantity > 0) {
        const take = Math.min(item.quantity, remaining);
        item.quantity -= take;
        remaining -= take;
      }
    }
  });
};

// Removes crew one at a time from whichever ship currently has the most,
// recomputing the max after every removal. That’s what makes losses land on
// the largest ship first *and* leaves the fleet balanced, rather than
// bankrupting a single ship — see design section 2.2. Ties favour the lower
// ship index so the result is deterministic.
const findLargestCrewShip = (ships: Ship[]): Ship | null =>
  ships.reduce<Ship | null>((largest, ship) => {
    if (ship.crew > 0 && (!largest || ship.crew > largest.crew)) {
      return ship;
    }
    return largest;
  }, null);

const killLargestCrewFirst = (ships: Ship[], deaths: number): void => {
  let remaining = deaths;

  while (remaining > 0) {
    const target = findLargestCrewShip(ships);

    if (!target) {
      break;
    }

    target.crew -= 1;
    remaining -= 1;
  }
};

export const planDailyProvisionSettlement = (
  ships: Ship[],
  days: number,
): ProvisionSettlementPlan => {
  const daysToSettle = Math.max(0, Math.floor(days));

  // Crew deaths lower tomorrow’s consumption, so the span has to be walked
  // one day at a time on a working clone — the ships passed in must come
  // back untouched (see the “does not mutate” test).
  const workingShips: Ship[] = ships.map((ship) => ({
    ...ship,
    cargo: ship.cargo.map((item) => ({ ...item })),
  }));

  let starvationDays = 0;
  let adrift = false;

  for (let day = 0; day < daysToSettle; day += 1) {
    const totalCrew = workingShips.reduce(
      (total, ship) => total + ship.crew,
      0,
    );

    if (totalCrew === 0) {
      adrift = true;
      break;
    }

    const consumption = getDailyProvisionConsumption(workingShips);
    const totals = getProvisionTotals(workingShips);
    const waterShort = totals.water < consumption;
    const foodShort = totals.food < consumption;

    consumableProvisions.forEach((provision) => {
      drainAcrossShips(workingShips, provision, consumption);
    });

    if (waterShort || foodShort) {
      starvationDays += 1;

      const rate =
        waterShort && foodShort
          ? STARVATION_DEATH_RATE * BOTH_SHORT_MULTIPLIER
          : STARVATION_DEATH_RATE;
      const deaths = Math.min(totalCrew, Math.ceil(totalCrew * rate));

      killLargestCrewFirst(workingShips, deaths);

      const survivingCrew = workingShips.reduce(
        (total, ship) => total + ship.crew,
        0,
      );

      if (survivingCrew === 0) {
        adrift = true;
        break;
      }
    }
  }

  const deductions: ProvisionDeduction[] = [];

  consumableProvisions.forEach((provision) => {
    ships.forEach((ship, shipNumber) => {
      const quantity =
        shipProvisionTotal(ship, provision) -
        shipProvisionTotal(workingShips[shipNumber], provision);

      if (quantity > 0) {
        deductions.push({ shipNumber, provision, quantity });
      }
    });
  });

  const crewLosses: CrewLoss[] = [];

  ships.forEach((ship, shipNumber) => {
    const deaths = ship.crew - workingShips[shipNumber].crew;

    if (deaths > 0) {
      crewLosses.push({ shipNumber, deaths });
    }
  });

  return { deductions, starvationDays, crewLosses, adrift };
};

// Straight-line nearest port from a world position, breaking ties by
// ascending port id — the same “regularPorts then supplyPorts, 1-indexed”
// id scheme every other port lookup in the codebase uses (see
// game/port/portUtils.ts’s getPortData/portAdjacentAt).
export const nearestPortId = (position: Position): string => {
  const ports = [...regularPorts, ...supplyPorts];

  let bestId = '1';
  let bestDistance = Infinity;

  ports.forEach(({ position: portPosition }, index) => {
    const deltaX = portPosition.x - position.x;
    const deltaY = portPosition.y - position.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = String(index + 1);
    }
  });

  return bestId;
};
