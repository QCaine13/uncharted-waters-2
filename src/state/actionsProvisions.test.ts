import type { Ship } from '../game/world/fleets';
import state from './state';
import updateInterface from './updateInterface';
import { save } from './saveLoad';
import Assets from '../assets';
import Input from '../input';
import { updateGeneral } from './actionsPort';
import {
  refreshProvisionInterface,
  settleDailyProvisions,
} from './actionsProvisions';

jest.mock('./saveLoad', () => ({ save: jest.fn() }));
jest.mock('../input', () => ({
  __esModule: true,
  default: { reset: jest.fn() },
}));
jest.mock('../game/port/port', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./actionsPort', () => ({ updateGeneral: jest.fn() }));

const mockedSave = save as jest.MockedFunction<typeof save>;
const mockedUpdateGeneral = updateGeneral as jest.MockedFunction<
  typeof updateGeneral
>;

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
    jest.spyOn(Assets, 'data').mockReturnValue(new Uint8Array(2700));
    state.fleets = {
      '1': { position: { x: 100, y: 100 }, ships: ships() },
    };
    updateInterface.provisions = jest.fn();
    updateInterface.dayAtSea = jest.fn();
    mockedSave.mockReset();
    mockedUpdateGeneral.mockReset();
    (Input.reset as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  test('applies crew losses from a starvation day and surfaces them on the summary', () => {
    state.fleets['1'].ships = [
      {
        id: '6',
        name: 'Flagship',
        crew: 10,
        durability: 25,
        cargo: [{ type: 'water', quantity: 100 }], // no food at all
      },
    ];

    const summary = settleDailyProvisions(1);

    expect(state.fleets['1'].ships[0].crew).toBe(9);
    expect(summary).toMatchObject({
      starvationDays: 1,
      crewLosses: [{ shipNumber: 0, deaths: 1 }],
      adrift: false,
    });
    expect(mockedSave).toHaveBeenCalledTimes(1);
    // The fleet survived, so no arrival should have happened.
    expect(mockedUpdateGeneral).not.toHaveBeenCalled();
    expect(Input.reset).not.toHaveBeenCalled();
  });

  test('moves the fleet to the nearest port and arrives normally when the crew is wiped out, leaving cargo, gold, and items untouched', () => {
    state.fleets = {
      '1': {
        position: { x: 840, y: 358 }, // Lisbon’s own position (port id ’1’)
        ships: [
          {
            id: '6',
            name: 'Flagship',
            crew: 1,
            durability: 25,
            cargo: [{ type: '1', quantity: 9 }],
          },
        ],
      },
    };
    state.portId = null;
    state.dayAtSea = 4;
    state.gold = 500;
    state.items = ['4'];

    const summary = settleDailyProvisions(5);

    expect(summary).toMatchObject({
      starvationDays: 1,
      crewLosses: [{ shipNumber: 0, deaths: 1 }],
      adrift: true,
    });
    expect(state.fleets['1'].ships[0].crew).toBe(0);
    expect(state.portId).toBe('1');
    expect(state.dayAtSea).toBe(0);
    expect(updateInterface.dayAtSea).toHaveBeenCalledWith(0);
    // Cargo, gold, and items are untouched by the forced arrival.
    expect(state.fleets['1'].ships[0].cargo).toEqual([
      { type: '1', quantity: 9 },
    ]);
    expect(state.gold).toBe(500);
    expect(state.items).toEqual(['4']);
    expect(mockedUpdateGeneral).toHaveBeenCalledTimes(1);
    expect(Input.reset).toHaveBeenCalledTimes(1);
    expect(mockedSave).toHaveBeenCalledTimes(1);
  });
});
