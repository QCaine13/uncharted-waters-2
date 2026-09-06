import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import { itemData } from '../../data/itemData';
import { setLocale } from '../../localization';
import ItemInfo from './ItemInfo';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('../../assets', () => ({
  __esModule: true,
  default: { items: () => 'item.png' },
}));

const renderItem = (itemId: keyof typeof itemData) => {
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(<ItemInfo item={itemData[itemId]} />));
  return { container, root };
};

describe('localized item combat details', () => {
  afterEach(() => setLocale('zh-CN'));

  test('presents weapon attack and armor defense labels in Chinese', () => {
    setLocale('zh-CN');
    const weapon = renderItem('1');
    const armor = renderItem('79');

    expect(weapon.container.textContent).toContain('攻击力D');
    expect(armor.container.textContent).toContain('防御力☆');

    act(() => weapon.root.unmount());
    act(() => armor.root.unmount());
  });

  test('preserves the original English labels', () => {
    setLocale('en');
    const weapon = renderItem('1');
    const armor = renderItem('79');

    expect(weapon.container.textContent).toContain('AttackD');
    expect(armor.container.textContent).toContain('Defense☆');

    act(() => weapon.root.unmount());
    act(() => armor.root.unmount());
  });
});
