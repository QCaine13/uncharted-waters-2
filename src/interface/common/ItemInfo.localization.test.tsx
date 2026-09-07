import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import { itemData } from '../../data/itemData';
import { setLocale } from '../../localization';
import ItemInfo from './ItemInfo';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const itemAsset = jest.fn((slice: number) => `item-${slice}.png`);

jest.mock('../../assets', () => ({
  __esModule: true,
  default: { items: (slice: number) => itemAsset(slice) },
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

  test.each([
    ['zh-CN', '圣者之杖', '皮耶德托付给约翰、须交还马沙华统治者的圣杖。'],
    [
      'en',
      'Staff of the Saint',
      'The Staff entrusted to João for the ruler of Massawa.',
    ],
  ] as const)(
    'renders the portraitless Staff emblem and %s text',
    (locale, name, description) => {
      setLocale(locale);
      itemAsset.mockClear();
      const staff = renderItem(
        'm3-staff-of-the-saint' as keyof typeof itemData,
      );

      expect(staff.container.textContent).toContain(name);
      expect(staff.container.textContent).toContain(description);
      expect(
        staff.container.querySelector('[data-test=item-emblem]')?.textContent,
      ).toBe('✦');
      expect(itemAsset).not.toHaveBeenCalled();

      act(() => staff.root.unmount());
    },
  );

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
