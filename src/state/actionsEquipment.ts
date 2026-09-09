import { itemData, type ItemId } from '../data/itemData';
import { save } from './saveLoad';
import state from './state';

export type EquipmentSlot = 'weapon' | 'armor';

const weaponCategories = new Set(['1', '2', '3', '4']);

export const equipItem = (itemId: string): boolean => {
  if (state.activeCombat !== null || !state.items.includes(itemId as ItemId)) {
    return false;
  }

  const item = itemData[itemId as ItemId];
  if (!item) return false;

  let field: 'weaponId' | 'armorId';
  if (weaponCategories.has(item.categoryId)) field = 'weaponId';
  else if (item.categoryId === '7') field = 'armorId';
  else return false;

  if (state.equipment[field] === itemId) return false;
  state.equipment[field] = itemId;
  save();
  return true;
};

export const unequipItem = (slot: EquipmentSlot): boolean => {
  if (state.activeCombat !== null) return false;
  const field = slot === 'weapon' ? 'weaponId' : 'armorId';
  if (state.equipment[field] === null) return false;

  state.equipment[field] = null;
  save();
  return true;
};
