import Assets from '../assets';
import Input from '../input';
import state from './state';
import updateInterface from './updateInterface';
import { updateGeneral } from './actionsPort';
import {
  refreshProvisionInterface,
  settleDailyProvisions,
} from './actionsProvisions';
import { save } from './saveLoad';
import { setSail, worldTimeTick } from './actionsWorld';
import { landmarks } from '../data/discoveryData';

jest.mock('../input', () => ({
  __esModule: true,
  default: { reset: jest.fn() },
}));
jest.mock('../game/port/port', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./actionsPort', () => ({ updateGeneral: jest.fn() }));
jest.mock('./actionsProvisions', () => ({
  refreshProvisionInterface: jest.fn(),
  settleDailyProvisions: jest.fn(),
}));
jest.mock('./saveLoad', () => ({ save: jest.fn() }));

const mockedRefresh = refreshProvisionInterface as jest.MockedFunction<
  typeof refreshProvisionInterface
>;
const mockedSettle = settleDailyProvisions as jest.MockedFunction<
  typeof settleDailyProvisions
>;
const mockedSave = save as jest.MockedFunction<typeof save>;
const mockedUpdateGeneral = updateGeneral as jest.MockedFunction<
  typeof updateGeneral
>;

describe('world provision settlement', () => {
  beforeEach(() => {
    jest.spyOn(Assets, 'data').mockReturnValue(new Uint8Array(2700));
    state.portId = null;
    state.buildingId = null;
    state.timePassed = 1400;
    state.dayAtSea = 2;
    state.fleets = {
      '1': {
        position: { x: 100, y: 100 },
        ships: [
          {
            id: '6',
            name: 'Flagship',
            crew: 11,
            cargo: [
              { type: 'water', quantity: 8 },
              { type: 'food', quantity: 8 },
            ],
            durability: 25,
          },
        ],
      },
    };
    updateInterface.dayAtSea = jest.fn();
    updateInterface.indicators = jest.fn();
    mockedRefresh.mockReset();
    mockedSettle.mockReset();
    mockedSave.mockReset();
    mockedUpdateGeneral.mockReset();
    (Input.reset as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('does not settle before crossing a day boundary', () => {
    worldTimeTick();

    expect(state.timePassed).toBe(1420);
    expect(state.dayAtSea).toBe(2);
    expect(mockedSettle).not.toHaveBeenCalled();
    expect(mockedUpdateGeneral).not.toHaveBeenCalled();
    expect(updateInterface.dayAtSea).not.toHaveBeenCalled();
  });

  test('settles once when the default tick crosses midnight', () => {
    state.timePassed = 1420;

    worldTimeTick();

    expect(state.timePassed).toBe(1440);
    expect(state.dayAtSea).toBe(3);
    expect(mockedSettle).toHaveBeenCalledTimes(1);
    expect(mockedSettle).toHaveBeenCalledWith(1);
    expect(mockedUpdateGeneral).toHaveBeenCalledTimes(1);
    expect(updateInterface.dayAtSea).toHaveBeenCalledTimes(1);
    expect(updateInterface.dayAtSea).toHaveBeenCalledWith(3);
  });

  test('aggregates multiple crossed days into one settlement call', () => {
    state.timePassed = 1420;

    worldTimeTick(2900);

    expect(state.timePassed).toBe(4320);
    expect(state.dayAtSea).toBe(5);
    expect(mockedSettle).toHaveBeenCalledTimes(1);
    expect(mockedSettle).toHaveBeenCalledWith(3);
    expect(mockedUpdateGeneral).toHaveBeenCalledTimes(1);
    expect(updateInterface.dayAtSea).toHaveBeenCalledTimes(1);
  });

  test('refreshes provisions and preserves one save when setting sail', () => {
    state.portId = '1';
    state.buildingId = '4';

    setSail();

    expect(state.portId).toBeNull();
    expect(state.buildingId).toBeNull();
    expect(mockedRefresh).toHaveBeenCalledTimes(1);
    expect(mockedSave).toHaveBeenCalledTimes(1);
    expect(Input.reset).toHaveBeenCalledTimes(1);
  });

  describe('landmark discovery', () => {
    const gibraltar = landmarks.find(
      (landmark) => landmark.id === 'strait-of-gibraltar',
    )!;

    beforeEach(() => {
      state.gold = 0;
      state.fame = { adventure: 0, pirate: 0, trade: 0 };
      state.discoveries = [];
      // Real values under test — worldTimeTick now pushes discoveries onto
      // these two channels, and nothing else in this describe block mounts
      // the interface components that normally assign them.
      updateInterface.discovery = jest.fn();
      updateInterface.fame = jest.fn();
    });

    test('sailing into a landmark adds its fame and gold once and saves', () => {
      state.fleets['1'].position = { ...gibraltar.position };

      worldTimeTick();

      expect(state.discoveries).toEqual([gibraltar.id]);
      expect(state.fame.adventure).toBe(gibraltar.fame);
      expect(state.gold).toBe(gibraltar.gold);
      expect(mockedSave).toHaveBeenCalledTimes(1);
      expect(updateInterface.discovery).toHaveBeenCalledTimes(1);
      expect(updateInterface.discovery).toHaveBeenCalledWith([gibraltar]);
      expect(updateInterface.fame).toHaveBeenCalledTimes(1);
      expect(updateInterface.fame).toHaveBeenCalledWith({
        adventure: gibraltar.fame,
        pirate: 0,
        trade: 0,
      });
    });

    test('a second tick at the same position discovers nothing further', () => {
      state.fleets['1'].position = { ...gibraltar.position };

      worldTimeTick();
      mockedSave.mockClear();
      (updateInterface.discovery as jest.Mock).mockClear();
      (updateInterface.fame as jest.Mock).mockClear();

      worldTimeTick(1);

      expect(state.discoveries).toEqual([gibraltar.id]);
      expect(state.fame.adventure).toBe(gibraltar.fame);
      expect(state.gold).toBe(gibraltar.gold);
      expect(mockedSave).not.toHaveBeenCalled();
      expect(updateInterface.discovery).not.toHaveBeenCalled();
      expect(updateInterface.fame).not.toHaveBeenCalled();
    });

    test('does not detect discoveries while docked', () => {
      state.portId = '1';
      state.fleets['1'].position = { ...gibraltar.position };

      worldTimeTick();

      expect(state.discoveries).toEqual([]);
      expect(mockedSave).not.toHaveBeenCalled();
      expect(updateInterface.discovery).not.toHaveBeenCalled();
      expect(updateInterface.fame).not.toHaveBeenCalled();
    });
  });
});
