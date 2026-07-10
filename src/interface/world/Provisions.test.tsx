import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import state from '../../state/state';
import updateInterface from '../../state/updateInterface';
import Provisions from './Provisions';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('../../assets', () => ({
  __esModule: true,
  default: {
    images: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  },
}));

test('initializes from loaded fleet state and accepts summary updates', () => {
  state.fleets = {
    '1': {
      position: { x: 100, y: 100 },
      ships: [
        {
          id: '6',
          name: 'Flagship',
          crew: 10,
          cargo: [
            { type: 'water', quantity: 2 },
            { type: 'food', quantity: 3 },
          ],
          durability: 25,
        },
      ],
    },
  };
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() => root.render(<Provisions hidden={false} />));
  expect(
    container.querySelector('[data-test=provision-water]')?.textContent,
  ).toBe('2');

  act(() => {
    updateInterface.provisions({
      provisions: { water: 1, food: 2, lumber: 0, shot: 0 },
      dailyConsumption: 1,
      daysRemaining: 1,
      status: 'low',
    });
  });
  expect(
    container.querySelector('[data-test=provision-water]')?.textContent,
  ).toBe('1');

  act(() => root.unmount());
});
