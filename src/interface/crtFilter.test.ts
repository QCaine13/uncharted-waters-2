import {
  CRT_FILTER_STORAGE_KEY,
  isCrtFilterEnabled,
  setCrtFilterEnabled,
  toggleCrtFilter,
  subscribeCrtFilter,
} from './crtFilter';

describe('crtFilter state management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('defaults to false when no key is set', () => {
    expect(isCrtFilterEnabled()).toBe(false);
  });

  test('reads enabled state from localStorage', () => {
    localStorage.setItem(CRT_FILTER_STORAGE_KEY, 'true');
    expect(isCrtFilterEnabled()).toBe(true);
  });

  test('sets and persists enabled state', () => {
    setCrtFilterEnabled(true);
    expect(isCrtFilterEnabled()).toBe(true);
    expect(localStorage.getItem(CRT_FILTER_STORAGE_KEY)).toBe('true');

    setCrtFilterEnabled(false);
    expect(isCrtFilterEnabled()).toBe(false);
    expect(localStorage.getItem(CRT_FILTER_STORAGE_KEY)).toBe('false');
  });

  test('toggles state', () => {
    expect(isCrtFilterEnabled()).toBe(false);
    expect(toggleCrtFilter()).toBe(true);
    expect(isCrtFilterEnabled()).toBe(true);
    expect(toggleCrtFilter()).toBe(false);
    expect(isCrtFilterEnabled()).toBe(false);
  });

  test('notifies subscribers upon state change', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeCrtFilter(listener);

    setCrtFilterEnabled(true);
    expect(listener).toHaveBeenCalledTimes(1);

    toggleCrtFilter();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    setCrtFilterEnabled(false);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
