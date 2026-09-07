import state from './state';
import { canAfford, getMateBattleLevel, getMates } from './selectors';

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

describe('mate battle progress', () => {
  beforeEach(() => {
    state.mates = [{ sailorId: '1', role: 0 }];
    state.mateProgress = { '1': { battleExperience: 250 } };
  });

  test('exposes earned experience and effective level without mutating sailor data', () => {
    expect(getMateBattleLevel('1')).toBe(3);
    expect(getMates()[0]).toMatchObject({
      sailorId: '1',
      battleExperience: 250,
      battleLevel: 3,
    });

    getMates()[0].battleLevel = 99;
    expect(getMateBattleLevel('1')).toBe(3);
  });
});
