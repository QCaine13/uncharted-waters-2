import React, { useState } from 'react';

import { getPlayerItems } from '../state/selectors';
import { itemData } from '../data/itemData';
import MessageBox from './common/MessageBox';
import ItemInfo from './common/ItemInfo';
import Menu from './common/Menu';
import { t } from '../localization';
import { equipItem, unequipItem } from '../state/actionsEquipment';
import state from '../state/state';

const weaponCategories = new Set(['1', '2', '3', '4']);

export default function Items() {
  const items = getPlayerItems();

  const [selectedI, setSelectedI] = useState(0);
  const [, setEquipmentRevision] = useState(0);

  if (!items.length) {
    return (
      <MessageBox>
        <div className="text-2xl px-4 py-2 text-black w-64">
          {t('You have no items.')}
        </div>
      </MessageBox>
    );
  }

  const { id } = items[selectedI] || {};
  const item = itemData[id];
  let slot: 'weapon' | 'armor' | null = null;
  if (weaponCategories.has(item.categoryId)) slot = 'weapon';
  if (item.categoryId === '7') slot = 'armor';
  let equipped = false;
  if (slot === 'weapon') equipped = state.equipment.weaponId === id;
  if (slot === 'armor') equipped = state.equipment.armorId === id;
  const equipmentUnavailable = state.activeCombat !== null;

  const updateEquipment = () => {
    const changed = equipped ? unequipItem(slot!) : equipItem(id);
    if (changed) setEquipmentRevision((revision) => revision + 1);
  };

  return (
    <MessageBox>
      <div className="flex">
        <div className="w-[280px]">
          <Menu
            options={items.map(({ id: itemId, name }, i) => ({
              label: `${t(name)}${
                state.equipment.weaponId === itemId ||
                state.equipment.armorId === itemId
                  ? ` · ${t('Equipped')}`
                  : ''
              }`,
              value: i,
            }))}
            onSelect={() => {}}
            onActiveIndex={setSelectedI}
            translateLabels={false}
          />
        </div>
        <div
          className="relative w-[736px] h-[304px] overflow-y-auto"
          data-test="items-content"
        >
          <ItemInfo item={item} />
          {slot && (
            <div className="absolute bottom-6 right-8 text-right text-black">
              <button
                type="button"
                className="border-2 border-amber-900 bg-orange-100 px-4 py-2 text-xl font-bold disabled:opacity-50"
                data-test="equip-item"
                disabled={equipmentUnavailable}
                onClick={updateEquipment}
              >
                {equipped
                  ? t('Unequip')
                  : t(slot === 'weapon' ? 'Equip weapon' : 'Equip armor')}
              </button>
              {equipped && <div className="mt-1 text-lg">{t('Equipped')}</div>}
              {equipmentUnavailable && (
                <div className="mt-1 text-base text-red-800">
                  {t('Equipment cannot be changed during combat.')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MessageBox>
  );
}
