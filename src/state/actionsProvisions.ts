import state from './state';
import updateInterface from './updateInterface';
import { save } from './saveLoad';
import Input from '../input';
import createPort from '../game/port/port';
import { updateGeneral } from './actionsPort';
import { positionAdjacentToPort } from './selectors';
import {
  getProvisionSummary,
  nearestPortId,
  planDailyProvisionSettlement,
} from './provisions';
import type { CrewLoss, ProvisionDeduction, ProvisionSummary } from './provisions';

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

const applyCrewLoss = ({ shipNumber, deaths }: CrewLoss): void => {
  getShips()[shipNumber].crew -= deaths;
};

// Zero crew leaves navigationCrewFactor at 0 (see game/world/shipSpeed.ts),
// so the fleet can never move again if left alone. Ending the voyage here —
// same state changes dock() makes, minus the position-derived portId lookup
// since we already know where we’re headed — turns that soft-lock into a
// normal, if unplanned, arrival. Cargo, gold, items and story are untouched.
const arriveAdrift = (): void => {
  const fleet = state.fleets['1'];
  const { position } = fleet;

  if (!position) {
    throw Error('Adrift fleet has no position to search a port from');
  }

  const portId = nearestPortId(position);

  fleet.position = positionAdjacentToPort(portId);
  state.port = createPort(portId);
  state.portId = portId;

  Input.reset();
  updateGeneral();

  state.dayAtSea = 0;
  updateInterface.dayAtSea(state.dayAtSea);
};

export const refreshProvisionInterface = (): ProvisionSummary => {
  const summary = getProvisionSummary(getShips());
  updateInterface.provisions(summary);
  return summary;
};

export const settleDailyProvisions = (days: number): ProvisionSummary => {
  const plan = planDailyProvisionSettlement(getShips(), days);

  plan.deductions.forEach(applyDeduction);
  plan.crewLosses.forEach(applyCrewLoss);

  if (plan.adrift) {
    arriveAdrift();
  }

  const summary: ProvisionSummary = {
    ...getProvisionSummary(getShips()),
    starvationDays: plan.starvationDays,
    crewLosses: plan.crewLosses,
    adrift: plan.adrift,
  };

  updateInterface.provisions(summary);
  save();

  return summary;
};
