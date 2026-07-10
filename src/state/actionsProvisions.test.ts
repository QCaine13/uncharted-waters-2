import type { Ship } from '../game/world/fleets';
import state from './state';
import updateInterface from './updateInterface';
import { save } from './saveLoad';
import {
  refreshProvisionInterface,
  settleDailyProvisions,
} from './actionsProvisions';

jest.mock('./saveLoad', () => ({ save: jest.fn() }));

const mockedSave = save as jest.MockedFunction<typeof save>;

const ships = (): Ship[] => [
  {
    id: '6',
    name: 'Flagship',
    crew: 6,
    durability: 25,
    cargo: [
      { type: 'water', quantity: 1 },
      { type: 'food', quantity: 2 },
      { type: 'lumber', quantity: 4 },
      { type: '1', quantity: 9 },
    ],
  },
  {
    id: '6',
    name: 'Consort',
    crew: 5,
    durability: 25,
    cargo: [
      { type: 'water', quantity: 5 },
      { type: 'food', quantity: 5 },
      { type: 'shot', quantity: 7 },
    ],
  },
];

describe('provision state actions', () => {
  beforeEach(() => {
    state.fleets = {
      '1': { position: { x: 100, y: 100 }, ships: ships() },
    };
    updateInterface.provisions = jest.fn();
    mockedSave.mockReset();
  });

  test('refreshes the summary without mutation or persistence', () => {
    const before = JSON.stringify(state.fleets);

    const summary = refreshProvisionInterface();

    expect(summary).toMatchObject({
      provisions: { water: 6, food: 7, lumber: 4, shot: 7 },
      dailyConsumption: 2,
      daysRemaining: 3,
      status: 'low',
    });
    expect(JSON.stringify(state.fleets)).toBe(before);
    expect(updateInterface.provisions).toHaveBeenCalledTimes(1);
    expect(updateInterface.provisions).toHaveBeenCalledWith(summary);
    expect(mockedSave).not.toHaveBeenCalled();
  });

  test('settles one day in fleet order, updates once, and saves once', () => {
    const summary = settleDailyProvisions(1);

    expect(state.fleets['1'].ships[0].cargo).toEqual([
      { type: 'lumber', quantity: 4 },
      { type: '1', quantity: 9 },
    ]);
    expect(state.fleets['1'].ships[1].cargo).toEqual([
      { type: 'water', quantity: 4 },
      { type: 'food', quantity: 5 },
      { type: 'shot', quantity: 7 },
    ]);
    expect(summary).toMatchObject({
      provisions: { water: 4, food: 5, lumber: 4, shot: 7 },
      dailyConsumption: 2,
      daysRemaining: 2,
      status: 'low',
    });
    expect(updateInterface.provisions).toHaveBeenCalledTimes(1);
    expect(updateInterface.provisions).toHaveBeenCalledWith(summary);
    expect(mockedSave).toHaveBeenCalledTimes(1);
  });

  test('settles multiple days, clamps shortages, and preserves unrelated cargo', () => {
    const summary = settleDailyProvisions(3);

    expect(state.fleets['1'].ships[0].cargo).toEqual([
      { type: 'lumber', quantity: 4 },
      { type: '1', quantity: 9 },
    ]);
    expect(state.fleets['1'].ships[1].cargo).toEqual([
      { type: 'food', quantity: 1 },
      { type: 'shot', quantity: 7 },
    ]);
    expect(summary).toMatchObject({
      provisions: { water: 0, food: 1, lumber: 4, shot: 7 },
      status: 'exhausted',
    });
    expect(updateInterface.provisions).toHaveBeenCalledTimes(1);
    expect(mockedSave).toHaveBeenCalledTimes(1);
  });

  test('continues a deduction across duplicate provision cargo entries', () => {
    state.fleets['1'].ships = [
      {
        id: '6',
        name: 'Flagship',
        crew: 11,
        durability: 25,
        cargo: [
          { type: 'water', quantity: 1 },
          { type: '1', quantity: 9 },
          { type: 'water', quantity: 4 },
          { type: 'lumber', quantity: 3 },
          { type: 'shot', quantity: 2 },
        ],
      },
    ];

    settleDailyProvisions(1);

    expect(state.fleets['1'].ships[0].cargo).toEqual([
      { type: '1', quantity: 9 },
      { type: 'water', quantity: 3 },
      { type: 'lumber', quantity: 3 },
      { type: 'shot', quantity: 2 },
    ]);
  });
});
