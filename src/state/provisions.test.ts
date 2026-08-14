import type { Ship } from '../game/world/fleets';
import {
  getDailyProvisionConsumption,
  getProvisionSummary,
  getProvisionTotals,
  nearestPortId,
  planDailyProvisionSettlement,
} from './provisions';

// A small, fully-controlled port list so nearest-port tests don’t depend on
// the real atlas’s coordinates or need to prove no other real port happens
// to be closer.
jest.mock('../data/portData', () => ({
  regularPorts: [
    { position: { x: 0, y: 0 } },
    { position: { x: 100, y: 0 } },
    { position: { x: 50, y: 0 } },
  ],
  supplyPorts: [{ position: { x: 100, y: 0 } }],
}));

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

  test('produces finite values at zero crew', () => {
    const summary = getProvisionSummary([ship(0)]);

    expect(Number.isFinite(summary.dailyConsumption)).toBe(true);
    expect(
      summary.daysRemaining === null || Number.isFinite(summary.daysRemaining),
    ).toBe(true);
  });

  describe('planDailyProvisionSettlement', () => {
    test('a fully provisioned fleet loses no crew, matching the pre-existing whole-span totals', () => {
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

      const oneDay = planDailyProvisionSettlement(ships, 1);

      expect(oneDay.deductions).toEqual([
        { shipNumber: 0, provision: 'water', quantity: 1 },
        { shipNumber: 1, provision: 'water', quantity: 1 },
        { shipNumber: 0, provision: 'food', quantity: 2 },
      ]);
      expect(oneDay).toMatchObject({
        starvationDays: 0,
        crewLosses: [],
        adrift: false,
      });

      const threeDays = planDailyProvisionSettlement(ships, 3);

      expect(threeDays.deductions).toEqual([
        { shipNumber: 0, provision: 'water', quantity: 1 },
        { shipNumber: 1, provision: 'water', quantity: 5 },
        { shipNumber: 0, provision: 'food', quantity: 4 },
        { shipNumber: 1, provision: 'food', quantity: 2 },
      ]);
      expect(threeDays).toMatchObject({
        starvationDays: 0,
        crewLosses: [],
        adrift: false,
      });
    });

    test('does not mutate ships while planning', () => {
      const ships = [
        ship(10, [
          { type: 'water', quantity: 2 },
          { type: 'food', quantity: 2 },
        ]),
      ];
      const before = JSON.stringify(ships);

      planDailyProvisionSettlement(ships, 1);

      expect(JSON.stringify(ships)).toBe(before);
    });

    test('resolves day by day: a 5-day span with 3 days of food produces exactly 2 starvation days', () => {
      // crew 10 -> 1 unit/day consumption, so “3 days of food” is unambiguous.
      // The old whole-span math (required = dailyConsumption * days) could
      // only ever see “short overall”, never which days ran out.
      const ships = [
        ship(10, [
          { type: 'water', quantity: 100 },
          { type: 'food', quantity: 3 },
        ]),
      ];

      const result = planDailyProvisionSettlement(ships, 5);

      expect(result.starvationDays).toBe(2);
      expect(result.adrift).toBe(false);
    });

    test('deaths compound across consecutive starvation days as the shrinking crew lowers consumption', () => {
      // crew 21, no provisions at all (both short every day). Consumption
      // steps down (3, then 2, then 2) as the deaths from each prior day
      // shrink the crew, which is exactly what the whole-span math couldn’t
      // express — so the marginal death count shrinks day over day too
      // (5, then 4, then 3).
      const fleet = () => [ship(21, [])];

      expect(planDailyProvisionSettlement(fleet(), 1).crewLosses).toEqual([
        { shipNumber: 0, deaths: 5 },
      ]);
      expect(planDailyProvisionSettlement(fleet(), 2).crewLosses).toEqual([
        { shipNumber: 0, deaths: 9 },
      ]);
      expect(planDailyProvisionSettlement(fleet(), 3)).toMatchObject({
        starvationDays: 3,
        crewLosses: [{ shipNumber: 0, deaths: 12 }],
        adrift: false,
      });
    });

    test('doubles the death rate when both provisions are short, not when only one is', () => {
      const oneShort = planDailyProvisionSettlement(
        [ship(10, [{ type: 'water', quantity: 100 }])],
        1,
      );
      const bothShort = planDailyProvisionSettlement([ship(10, [])], 1);

      expect(oneShort.crewLosses).toEqual([{ shipNumber: 0, deaths: 1 }]);
      expect(bothShort.crewLosses).toEqual([{ shipNumber: 0, deaths: 2 }]);
    });

    test('removes crew from the largest ship first, deterministically, and never negative', () => {
      // crew 10 and 8, nothing to eat or drink: 18 total crew -> consumption
      // 2, both short -> 4 deaths. Taken one at a time from whichever ship
      // is currently largest: 10->9->8 (tie) ->7 (index tie-break), then the
      // now-larger second ship 8->7. Ends perfectly balanced at 7 and 7,
      // proving the removals never dip below what each ship had.
      const result = planDailyProvisionSettlement(
        [ship(10, []), ship(8, [])],
        1,
      );

      expect(result.crewLosses).toEqual([
        { shipNumber: 0, deaths: 3 },
        { shipNumber: 1, deaths: 1 },
      ]);
    });

    test('reaching zero crew stops the simulation mid-span and reports adrift', () => {
      const result = planDailyProvisionSettlement([ship(1, [])], 5);

      expect(result.starvationDays).toBe(1);
      expect(result.adrift).toBe(true);
      expect(result.crewLosses).toEqual([{ shipNumber: 0, deaths: 1 }]);
    });
  });

  describe('nearestPortId', () => {
    test('returns the true minimum distance port, not just the first or last', () => {
      // id '3' (50,0) is 10 away from (60,0); id '2'/'4' are 40 away and
      // id '1' is 60 away — the nearest port is in the middle of the list.
      expect(nearestPortId({ x: 60, y: 0 })).toBe('3');
    });

    test('breaks ties by ascending port id', () => {
      // id '2' and (supply port) id '4' share the exact same position, both
      // at distance 0 from this query point.
      expect(nearestPortId({ x: 100, y: 0 })).toBe('2');
    });
  });
});
