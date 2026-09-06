import { landmarks } from '../data/discoveryData';
import { reportDiscoveries } from './actionsDiscovery';
import { load } from './saveLoad';
import { migrate } from './saveMigrations';
import state from './state';
import updateInterface from './updateInterface';

const GIBRALTAR = 'strait-of-gibraltar';

describe('reportDiscoveries', () => {
  beforeEach(() => {
    localStorage.clear();
    state.portId = '1';
    state.buildingId = '7';
    state.gold = 100;
    state.quests = [];
    state.storyEvents = [];
    state.discoveries = [GIBRALTAR];
    state.reportedDiscoveries = [];
    updateInterface.general = jest.fn();
  });

  afterEach(() => jest.restoreAllMocks());

  test('pays Gibraltar 300g at the Lisbon Guild and saves once', () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    expect(reportDiscoveries()).toEqual({ ids: [GIBRALTAR], gold: 300 });
    expect(state.gold).toBe(400);
    expect(state.reportedDiscoveries).toEqual([GIBRALTAR]);
    expect(updateInterface.general).toHaveBeenCalledTimes(1);
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  test('a repeated report after reload pays zero', () => {
    expect(reportDiscoveries()).toEqual({ ids: [GIBRALTAR], gold: 300 });
    expect(load()).toBe(true);

    expect(reportDiscoveries()).toEqual({ ids: [], gold: 0 });
    expect(state.gold).toBe(400);
    expect(state.reportedDiscoveries).toEqual([GIBRALTAR]);
  });

  test.each([
    ['2', '7'],
    ['1', '9'],
    [null, null],
  ])('does not report from port %p building %p', (portId, buildingId) => {
    state.portId = portId;
    state.buildingId = buildingId;
    const setItem = jest.spyOn(Storage.prototype, 'setItem');

    expect(reportDiscoveries()).toEqual({ ids: [], gold: 0 });
    expect(state.gold).toBe(100);
    expect(state.reportedDiscoveries).toEqual([]);
    expect(setItem).not.toHaveBeenCalled();
  });

  test('a v4 Gibraltar discovery is treated as already paid', () => {
    const migrated = migrate({
      version: 4,
      gold: 100,
      quests: [],
      discoveries: [GIBRALTAR],
    });
    state.discoveries = migrated?.discoveries as string[];
    state.reportedDiscoveries = migrated?.reportedDiscoveries as string[];

    expect(reportDiscoveries()).toEqual({ ids: [], gold: 0 });
    expect(state.gold).toBe(100);
  });

  test('filters unknown and duplicate discovery ids before paying known rewards', () => {
    state.discoveries = ['unknown', GIBRALTAR, GIBRALTAR, landmarks[1].id];

    expect(reportDiscoveries()).toEqual({
      ids: [GIBRALTAR, landmarks[1].id],
      gold: 800,
    });
    expect(state.gold).toBe(900);
  });
});
