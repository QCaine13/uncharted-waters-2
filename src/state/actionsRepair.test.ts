import type { Ship } from '../game/world/fleets';
import state from './state';
import updateInterface from './updateInterface';
import { getRepairQuote, repairShip } from './actionsRepair';

const ship = (durability: number): Ship => ({
  id: '6',
  name: 'Flagship',
  crew: 10,
  durability,
  cargo: [{ type: 'shot', quantity: 3 }],
});

describe('ship repair actions', () => {
  beforeEach(() => {
    window.localStorage.clear();
    state.fleets = {
      '1': {
        position: { x: 840, y: 356 },
        ships: [ship(23), { ...ship(18), name: 'Consort' }],
      },
    };
    state.gold = 55;
    state.activeCombat = null;
    updateInterface.general = jest.fn();
  });

  test('quotes missing hull and caps repair points by affordable whole points', () => {
    expect(getRepairQuote(0)).toEqual({ missing: 7, points: 5, cost: 50 });
    expect(getRepairQuote(99)).toEqual({ missing: 0, points: 0, cost: 0 });
  });

  test('repairs the selected ship without touching another ship and saves once', () => {
    const otherBefore = JSON.stringify(state.fleets['1'].ships[1]);

    expect(repairShip(0)).toBe(true);

    expect(state.fleets['1'].ships[0].durability).toBe(28);
    expect(JSON.stringify(state.fleets['1'].ships[1])).toBe(otherBefore);
    expect(state.gold).toBe(5);
    expect(updateInterface.general).toHaveBeenCalledTimes(1);
    expect(
      JSON.parse(window.localStorage.getItem('savedState')!),
    ).toMatchObject({ gold: 5 });
  });

  test('does no work or persistence when full, broke, invalid, or in combat', () => {
    state.fleets['1'].ships[0].durability = 30;
    expect(repairShip(0)).toBe(false);
    state.fleets['1'].ships[0].durability = 20;
    state.gold = 9;
    expect(repairShip(0)).toBe(false);
    expect(repairShip(99)).toBe(false);
    state.gold = 100;
    state.activeCombat = {
      kind: 'duel',
      encounterId: 'joao.m2.kahn-house',
    } as typeof state.activeCombat;
    expect(repairShip(0)).toBe(false);

    expect(window.localStorage.getItem('savedState')).toBeNull();
    expect(updateInterface.general).not.toHaveBeenCalled();
  });
});
