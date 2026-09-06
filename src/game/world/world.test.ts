import Assets from '../../assets';
import state, { SAVED_STATE_KEY, State } from '../../state/state';
import updateInterface from '../../state/updateInterface';
import { load, SAVE_VERSION } from '../../state/saveLoad';
import createWorld from './world';

const worldTilemap = new Uint8Array(2025 * 1080);
const windsCurrent = new Uint8Array(2700);
let now = 0;

const seaSave = (timePassed: number, position: { x: number; y: number }) => ({
  version: SAVE_VERSION,
  portId: null,
  buildingId: null,
  timePassed,
  fleets: {
    '1': {
      position,
      ships: [
        {
          id: '6',
          name: 'Flagship',
          crew: 20,
          cargo: [
            { type: 'water', quantity: 20 },
            { type: 'food', quantity: 20 },
          ],
          durability: 25,
        },
      ],
    },
  },
  dayAtSea: 1,
  gold: 1000,
  quests: [],
  usedShipsAtPort: {},
  savings: 0,
  debt: 0,
  items: [],
  mates: [{ sailorId: '1', role: 0 }],
  fame: { adventure: 0, pirate: 0, trade: 0 },
  marketPrices: {},
  discoveries: [],
});

describe('world creation weather boundary', () => {
  beforeEach(() => {
    windsCurrent.fill(0);
    document.body.innerHTML =
      '<canvas id="camera" width="800" height="640"></canvas>';
    const context = {
      canvas: document.getElementById('camera'),
      drawImage: jest.fn(),
    };
    jest
      .spyOn(global.HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(context as unknown as CanvasRenderingContext2D);
    jest
      .spyOn(Assets, 'images')
      .mockReturnValue(document.createElement('canvas'));
    jest
      .spyOn(Assets, 'data')
      .mockImplementation((id) =>
        id === 'worldTilemap' ? worldTilemap : windsCurrent,
      );
    jest.spyOn(Math, 'random').mockReturnValue(0);
    jest.spyOn(window.performance, 'now').mockImplementation(() => {
      now += 100;
      return now;
    });

    updateInterface.indicators = jest.fn();
    updateInterface.playerFleetDirection = jest.fn();
    updateInterface.playerFleetSpeed = jest.fn();
    updateInterface.discovery = jest.fn();
    updateInterface.fame = jest.fn();
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  test.each([220, 240])(
    'derives weather before updating and drawing a sea save at minute %i',
    (timePassed) => {
      window.localStorage.setItem(
        SAVED_STATE_KEY,
        JSON.stringify(seaSave(timePassed, { x: 100, y: 100 })),
      );
      state.wind = undefined as unknown as State['wind'];
      state.current = undefined as unknown as State['current'];

      expect(load()).toBe(true);
      const world = createWorld();

      expect(state.wind).toEqual({ direction: 0, speed: 0 });
      expect(state.current).toEqual({ direction: 0, speed: 0 });
      expect(() => world.update()).not.toThrow();
      expect(state.timePassed).toBe(timePassed + 20);
      expect(() => world.draw()).not.toThrow();
    },
  );

  test('replaces stale weather when a save reloads in another sea area', () => {
    windsCurrent[1] = 3;
    windsCurrent[451] = 5;
    windsCurrent[1801] = 6;
    windsCurrent[2251] = 2;
    state.wind = { direction: 7, speed: 7 };
    state.current = { direction: 7, speed: 7 };
    window.localStorage.setItem(
      SAVED_STATE_KEY,
      JSON.stringify(seaSave(240, { x: 72, y: 0 })),
    );

    expect(load()).toBe(true);
    createWorld();

    expect(state.wind).toEqual(
      expect.objectContaining({ direction: 3, speed: 5 }),
    );
    expect(state.current).toEqual({ direction: 6, speed: 2 });
  });
});
