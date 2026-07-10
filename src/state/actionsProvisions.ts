import state from './state';
import updateInterface from './updateInterface';
import { save } from './saveLoad';
import {
  getProvisionSummary,
  planProvisionConsumption,
} from './provisions';
import type { ProvisionDeduction, ProvisionSummary } from './provisions';

const getShips = () => state.fleets['1'].ships;

const applyDeduction = ({
  shipNumber,
  provision,
  quantity,
}: ProvisionDeduction): void => {
  const ship = getShips()[shipNumber];
  let remaining = quantity;

  for (let i = 0; i < ship.cargo.length && remaining > 0; i += 1) {
    const item = ship.cargo[i];

    if (item.type === provision) {
      const deduction = Math.min(item.quantity, remaining);
      ship.cargo[i] = { ...item, quantity: item.quantity - deduction };
      remaining -= deduction;
    }
  }

  ship.cargo = ship.cargo.filter(
    (item) => !(item.type === provision && item.quantity === 0),
  );
};

export const refreshProvisionInterface = (): ProvisionSummary => {
  const summary = getProvisionSummary(getShips());
  updateInterface.provisions(summary);
  return summary;
};

export const settleDailyProvisions = (days: number): ProvisionSummary => {
  planProvisionConsumption(getShips(), days).forEach(applyDeduction);
  const summary = refreshProvisionInterface();
  save();
  return summary;
};
