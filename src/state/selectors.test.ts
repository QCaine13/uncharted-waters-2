import state from './state';
import { canAfford } from './selectors';

describe('canAfford', () => {
  beforeEach(() => {
    state.gold = 2400;
  });

  test('allows a purchase costing exactly all available gold', () => {
    expect(canAfford(2400)).toBe(true);
  });

  test('rejects a purchase costing one gold too much', () => {
    expect(canAfford(2401)).toBe(false);
  });
});
