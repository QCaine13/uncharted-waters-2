import { itemData } from '../data/itemData';
import { sailorData } from '../data/sailorData';
import type {
  DuelCombatantStats,
  Equipment,
  MateProgress,
  WeaponCategory,
} from './types';

export interface CreatePlayerDuelStatsParams {
  sailorId: string;
  equipment: Equipment;
  ownedItemIds: readonly string[];
  mateProgress: MateProgress;
}

export const createPlayerDuelStats = ({
  sailorId,
  equipment,
  ownedItemIds,
  mateProgress,
}: CreatePlayerDuelStatsParams): DuelCombatantStats => {
  const sailor = sailorData[sailorId];
  const owns = new Set(ownedItemIds);
  const weapon =
    equipment.weaponId !== null && owns.has(equipment.weaponId)
      ? itemData[equipment.weaponId as keyof typeof itemData]
      : undefined;
  const armor =
    equipment.armorId !== null && owns.has(equipment.armorId)
      ? itemData[equipment.armorId as keyof typeof itemData]
      : undefined;
  const validWeapon =
    weapon && ['1', '2', '3', '4'].includes(weapon.categoryId)
      ? weapon
      : undefined;
  const validArmor = armor?.categoryId === '7' ? armor : undefined;
  const experience = mateProgress[sailorId]?.battleExperience ?? 0;

  return {
    swordplay: sailor?.stats.swordplay ?? 0,
    level:
      (sailor?.battleLevel ?? 1) +
      Math.floor(
        Math.max(0, Number.isFinite(experience) ? experience : 0) / 100,
      ),
    weaponRating: validWeapon?.rating ?? 0,
    armorRating: validArmor?.rating ?? 0,
    weaponCategory: (validWeapon?.categoryId as WeaponCategory) ?? null,
  };
};
