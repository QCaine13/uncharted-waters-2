import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import type { ItemId } from '../../data/itemData';
import { setLocale } from '../../localization';
import state from '../../state/state';
import updateInterface from '../../state/updateInterface';
import ItemShop from './ItemShop';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('../quest/useQuestStep', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../assets', () => ({
  __esModule: true,
  default: {
    buildings: () => 'building.png',
    items: () => 'item.png',
    images: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  },
}));

const press = (key: string) => {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
  });
};

test('explains why the Staff is disabled while ordinary items keep their inventory indices', () => {
  state.portId = '1';
  state.buildingId = '10';
  state.gold = 0;
  state.items = ['m3-staff-of-the-saint' as ItemId, '4'];
  state.storyEvents = [];
  state.quests = [];
  state.activeCombat = null;
  updateInterface.general = jest.fn();
  window.localStorage.clear();
  setLocale('en');
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(<ItemShop />));

  press('ArrowDown');
  press('Enter');

  expect(container.textContent).toContain(
    'Staff of the Saint · Quest item — cannot be sold',
  );
  const staffOption = Array.from(
    container.querySelectorAll('[role=button]'),
  ).find((element) => element.textContent?.includes('Staff of the Saint'));
  expect(staffOption?.className).toContain('text-gray-400');

  press('ArrowDown');
  press('Enter');
  expect(container.textContent).toContain('I’ll take it for 1500 gold pieces.');

  const yes = container.querySelector('[data-test=confirmYes]');
  act(() => {
    yes?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  expect(state.items).toEqual(['m3-staff-of-the-saint']);
  expect(state.gold).toBe(1500);

  act(() => root.unmount());
  setLocale('zh-CN');
});
