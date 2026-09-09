import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';
import { setLocale } from '../localization';
import state from '../state/state';
import Items from './Items';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('../assets', () => ({
  __esModule: true,
  default: { items: () => 'item.png', images: () => ({ toDataURL: () => '' }) },
}));

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  setLocale('en');
  state.items = ['4', '17', '21'];
  state.equipment = { weaponId: null, armorId: null };
  state.activeCombat = null;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  state.activeCombat = null;
  setLocale('zh-CN');
});

const click = (label: string) => {
  const target = Array.from(
    container.querySelectorAll('[role=button], button'),
  ).find((node) => node.textContent === label) as HTMLElement | undefined;
  expect(target).toBeDefined();
  act(() => target!.click());
};

test('equips and unequips the selected combat item with a current marker', () => {
  act(() => root.render(<Items />));
  expect(
    container.querySelector('[data-test=items-content]')?.className,
  ).toContain('overflow-y-auto');
  click('Equip weapon');
  expect(state.equipment.weaponId).toBe('4');
  expect(container.textContent).toContain('Equipped');
  click('Unequip');
  expect(state.equipment.weaponId).toBeNull();

  click('Leather Armor');
  click('Equip armor');
  expect(state.equipment.armorId).toBe('17');
});

test('equipment controls explain why they are unavailable during combat', () => {
  state.activeCombat = {} as typeof state.activeCombat;
  act(() => root.render(<Items />));
  expect(
    container.querySelector<HTMLButtonElement>('[data-test=equip-item]')
      ?.disabled,
  ).toBe(true);
  expect(container.textContent).toContain(
    'Equipment cannot be changed during combat.',
  );
});
