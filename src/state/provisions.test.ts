import type { Ship } from '../game/world/fleets';
import {
  getDailyProvisionConsumption,
  getProvisionSummary,
  getProvisionTotals,
  planProvisionConsumption,
} from './provisions';

const ship = (
  crew: number,
  cargo: Ship['cargo'] = [],
  name = 'Test ship',
): Ship => ({
  id: '6',
  name,
  crew,
  cargo,
  durability: 25,
});

describe('fleet provision rules', () => {
  test.each([
    [0, 0],
    [10, 1],
    [11, 2],
    [20, 2],
  ])('rounds %i crew to %i unit(s) per day', (crew, expected) => {
    expect(getDailyProvisionConsumption([ship(crew)])).toBe(expected);
  });

  test('totals provisions across ships and ignores trade goods', () => {
    const ships = [
      ship(6, [
        { type: 'water', quantity: 2 },
        { type: 'food', quantity: 3 },
        { type: '1', quantity: 9 },
      ]),
      ship(5, [
        { type: 'water', quantity: 5 },
        { type: 'lumber', quantity: 4 },
        { type: 'shot', quantity: 7 },
      ]),
    ];

    expect(getProvisionTotals(ships)).toEqual({
      water: 7,
      food: 3,
      lumber: 4,
      shot: 7,
    });
  });

  test('calculates normal, low, sub-day, exhausted, and zero-crew summaries', () => {
    expect(
      getProvisionSummary([
        ship(10, [
          { type: 'water', quantity: 4 },
          { type: 'food', quantity: 5 },
        ]),
      ]),
    ).toMatchObject({
      dailyConsumption: 1,
      daysRemaining: 4,
      status: 'normal',
    });

    expect(
      getProvisionSummary([
        ship(10, [
          { type: 'water', quantity: 3 },
          { type: 'food', quantity: 8 },
        ]),
      ]),
    ).toMatchObject({ dailyConsumption: 1, daysRemaining: 3, status: 'low' });

    expect(
      getProvisionSummary([
        ship(11, [
          { type: 'water', quantity: 1 },
          { type: 'food', quantity: 1 },
        ]),
      ]),
    ).toMatchObject({ dailyConsumption: 2, daysRemaining: 0, status: 'low' });

    expect(
      getProvisionSummary([ship(10, [{ type: 'food', quantity: 8 }])]),
    ).toMatchObject({ daysRemaining: 0, status: 'exhausted' });

    expect(getProvisionSummary([ship(0)])).toMatchObject({
      dailyConsumption: 0,
      daysRemaining: null,
      status: 'normal',
    });
  });

  test('plans flagship-first deductions and continues to later ships', () => {
    const ships = [
      ship(6, [
        { type: 'water', quantity: 1 },
        { type: 'food', quantity: 4 },
        { type: 'lumber', quantity: 3 },
      ]),
      ship(5, [
        { type: 'water', quantity: 5 },
        { type: 'food', quantity: 5 },
        { type: 'shot', quantity: 2 },
      ]),
    ];

    expect(planProvisionConsumption(ships, 1)).toEqual([
      { shipNumber: 0, provision: 'water', quantity: 1 },
      { shipNumber: 1, provision: 'water', quantity: 1 },
      { shipNumber: 0, provision: 'food', quantity: 2 },
    ]);

    expect(planProvisionConsumption(ships, 3)).toEqual([
      { shipNumber: 0, provision: 'water', quantity: 1 },
      { shipNumber: 1, provision: 'water', quantity: 5 },
      { shipNumber: 0, provision: 'food', quantity: 4 },
      { shipNumber: 1, provision: 'food', quantity: 2 },
    ]);
  });

  test('does not mutate ships while planning', () => {
    const ships = [
      ship(10, [
        { type: 'water', quantity: 2 },
        { type: 'food', quantity: 2 },
      ]),
    ];
    const before = JSON.stringify(ships);

    planProvisionConsumption(ships, 1);

    expect(JSON.stringify(ships)).toBe(before);
  });
});
