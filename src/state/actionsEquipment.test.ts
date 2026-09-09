import state from './state';
import { equipItem, unequipItem } from './actionsEquipment';

describe('equipment actions', () => {
  beforeEach(() => {
    window.localStorage.clear();
    state.items = ['4', '17', '21'];
    state.equipment = { weaponId: null, armorId: null };
    state.activeCombat = null;
  });

  test('equips owned weapons and armor and persists each change', () => {
    expect(equipItem('4')).toBe(true);
    expect(equipItem('17')).toBe(true);

    expect(state.equipment).toEqual({ weaponId: '4', armorId: '17' });
    expect(
      JSON.parse(window.localStorage.getItem('savedState')!),
    ).toMatchObject({ equipment: { weaponId: '4', armorId: '17' } });
  });

  test('rejects unknown, unowned, non-combat and already-equipped items', () => {
    expect(equipItem('future-item')).toBe(false);
    expect(equipItem('18')).toBe(false);
    expect(equipItem('21')).toBe(false);
    expect(equipItem('4')).toBe(true);
    const saved = window.localStorage.getItem('savedState');

    expect(equipItem('4')).toBe(false);
    expect(window.localStorage.getItem('savedState')).toBe(saved);
  });

  test('unequips only populated combat slots', () => {
    state.equipment = { weaponId: '4', armorId: '17' };

    expect(unequipItem('weapon')).toBe(true);
    expect(unequipItem('weapon')).toBe(false);
    expect(unequipItem('armor')).toBe(true);
    expect(state.equipment).toEqual({ weaponId: null, armorId: null });
  });

  test('rejects equipment changes during combat', () => {
    state.activeCombat = {
      kind: 'duel',
      encounterId: 'joao.m2.kahn-house',
    } as typeof state.activeCombat;
    state.equipment = { weaponId: '4', armorId: '17' };

    expect(equipItem('4')).toBe(false);
    expect(unequipItem('armor')).toBe(false);
    expect(state.equipment).toEqual({ weaponId: '4', armorId: '17' });
    expect(window.localStorage.getItem('savedState')).toBeNull();
  });
});
