import state from './state';
import { save, load } from './saveLoad';

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
});
