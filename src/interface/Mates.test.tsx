import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import state from '../state/state';
import Mates from './Mates';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('../assets', () => ({
  __esModule: true,
  default: {
    characters: (id: string) => `portrait:${id}`,
    images: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  },
}));

test('renders the recruited four-person roster and Domingo portrait safely', () => {
  state.fleets = {
    '1': {
      position: undefined,
      ships: [
        { id: '6', name: 'Hermes II', crew: 20, cargo: [], durability: 30 },
      ],
    },
  };
  state.mates = [
    { sailorId: '1', role: 0 },
    { sailorId: '32', role: 'firstMate' },
    { sailorId: '33', role: 'bookKeeper' },
    { sailorId: '34', role: null },
  ];
  localStorage.setItem('uw2.locale', 'en');
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() => root.render(<Mates />));

  expect(
    Array.from(container.querySelectorAll('[role=button]')).map(
      (node) => node.textContent,
    ),
  ).toEqual([
    'João Franco',
    'Rocco Alemkel',
    'Enrico Malione',
    'Domingo Manana',
  ]);

  act(() => {
    container
      .querySelectorAll('[role=button]')[3]
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

  expect(container.querySelector('img[src="portrait:34"]')).not.toBeNull();
  expect(container.textContent).toContain('Domingo Manana');
  expect(container.textContent).toContain('Age 17');
  expect(container.textContent).toContain('Negotiation');

  act(() => root.unmount());
});

test('shows effective battle level and accumulated battle experience', () => {
  state.fleets = {
    '1': {
      position: undefined,
      ships: [
        { id: '6', name: 'Hermes II', crew: 20, cargo: [], durability: 30 },
      ],
    },
  };
  state.mates = [{ sailorId: '1', role: 0 }];
  state.mateProgress = { '1': { battleExperience: 250 } };
  localStorage.setItem('uw2.locale', 'en');
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() => root.render(<Mates />));

  expect(container.querySelector('[data-test=battle-level]')?.textContent).toBe(
    '3',
  );
  expect(
    container.querySelector('[data-test=battle-experience]')?.textContent,
  ).toBe('250');

  act(() => root.unmount());
});
