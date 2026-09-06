import state from './state';
import { save, load } from './saveLoad';
import { getLoadGeneration, subscribeGameLoad } from './saveEvents';

describe('save/load round trip', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('preserves a sparse marketPrices map', () => {
    state.marketPrices = {
      '1': { '10': { index: 130, updatedDay: 4 } },
      '2': { '3': { index: 70, updatedDay: 9 } },
    };

    save();
    state.marketPrices = {};

    expect(load()).toBe(true);
    expect(state.marketPrices).toEqual({
      '1': { '10': { index: 130, updatedDay: 4 } },
      '2': { '3': { index: 70, updatedDay: 9 } },
    });
  });

  test('preserves an empty marketPrices map', () => {
    state.marketPrices = {};

    save();
    state.marketPrices = { '1': { '10': { index: 130, updatedDay: 4 } } };

    expect(load()).toBe(true);
    expect(state.marketPrices).toEqual({});
  });

  test('preserves discoveries', () => {
    state.discoveries = ['strait-of-gibraltar', 'azores'];

    save();
    state.discoveries = [];

    expect(load()).toBe(true);
    expect(state.discoveries).toEqual(['strait-of-gibraltar', 'azores']);
  });

  test('preserves semantic story events and reported discoveries', () => {
    state.storyEvents = ['chapter.event', 'future.event'];
    state.reportedDiscoveries = ['strait-of-gibraltar', 'future-landmark'];

    save();
    state.storyEvents = [];
    state.reportedDiscoveries = [];

    expect(load()).toBe(true);
    expect(state.storyEvents).toEqual(['chapter.event', 'future.event']);
    expect(state.reportedDiscoveries).toEqual([
      'strait-of-gibraltar',
      'future-landmark',
    ]);
  });

  test('notifies subscribers after a successful load clears runtime objects', () => {
    save();
    state.world = {} as typeof state.world;
    state.port = {} as typeof state.port;
    const listener = jest.fn(() => {
      expect(state.world).toBeUndefined();
      expect(state.port).toBeUndefined();
    });
    const unsubscribe = subscribeGameLoad(listener);

    expect(load()).toBe(true);

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  test('does not advance the load generation for a failed load', () => {
    const before = getLoadGeneration();
    window.localStorage.setItem('savedState', '{broken');

    expect(load()).toBe(false);
    expect(getLoadGeneration()).toBe(before);
  });
});
