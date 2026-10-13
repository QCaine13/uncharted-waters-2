import state from './state';
import { shipData } from '../data/shipData';
import { getProvisionSummary } from './provisions';

export const getPlayerFleet = () => state.fleets['1'].ships;

export const getPlayerFleetShip = (shipNumber: number) =>
  state.fleets['1'].ships[shipNumber];

export const getAvailableSpace = (shipNumber: number) => {
  const ship = state.fleets['1'].ships[shipNumber];
  const { capacity, minimumCrew } = shipData[ship.id];

  const cargo = ship.cargo.reduce((p, c) => p + c.quantity, 0);
  const availableSpace = capacity - minimumCrew;

  return availableSpace - cargo;
};

export const getLoadPercent = (shipNumber: number) => {
  const ship = state.fleets['1'].ships[shipNumber];
  const { capacity, minimumCrew } = shipData[ship.id];

  const cargo = ship.cargo.reduce((p, c) => p + c.quantity, 0);

  return ((cargo + minimumCrew) / capacity) * 100;
};

export const hasCrewAssigned = () =>
  state.fleets['1'].ships.every((ship) => ship.crew > 0);

export const getDaysProvisionsWillLast = () =>
  getProvisionSummary(getPlayerFleet()).daysRemaining ?? 0;

export const getCrewNeeded = () => {
  let count = 0;

  getPlayerFleet().forEach((ship) => {
    count += Math.max(0, shipData[ship.id].minimumCrew - ship.crew);
  });

  return count;
};

export const getTotalCrew = () =>
  getPlayerFleet().reduce((total, ship) => total + ship.crew, 0);

export const getExtraCrewCapacity = () =>
  getPlayerFleet().reduce(
    (total, ship) =>
      total + Math.max(0, shipData[ship.id].usedCrew - ship.crew),
    0,
  );

export const getShipGuns = (shipNumber: number): number => {
  const ship = getPlayerFleetShip(shipNumber);
  if (!ship) return 0;
  return ship.guns ?? shipData[ship.id].usedGuns;
};
