import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import state from '../../state/state';
import updateInterface from '../../state/updateInterface';
import type { ProvisionSummary } from '../../state/provisions';
import Provisions, { getProvisionStatusText } from './Provisions';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('../../assets', () => ({
  __esModule: true,
  default: {
    images: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  },
}));

const summary = (
  status: ProvisionSummary['status'],
  daysRemaining: number | null,
  dailyConsumption = 1,
): ProvisionSummary => ({
  provisions: { water: 3, food: 3, lumber: 0, shot: 0 },
  dailyConsumption,
  daysRemaining,
  status,
});

describe('Provisions', () => {
  test.each([
    [summary('normal', 5), '5 days remaining'],
    [summary('low', 3), 'Only 3 days remaining'],
    [summary('low', 1), 'Only 1 day remaining'],
    [summary('low', 0), 'Less than 1 day remaining'],
    [summary('exhausted', 0), 'Supplies exhausted'],
    [summary('normal', null, 0), null],
  ] as const)('maps a summary to status copy', (value, expected) => {
    expect(getProvisionStatusText(value)).toBe(expected);
  });

  test('initializes from loaded cargo and reacts to an exhausted update', () => {
    state.fleets = {
      '1': {
        position: { x: 100, y: 100 },
        ships: [
          {
            id: '6',
            name: 'Flagship',
            crew: 11,
            cargo: [
              { type: 'water', quantity: 7 },
              { type: 'food', quantity: 7 },
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
    ).toBe('7');
    expect(
      container.querySelector('[data-test=provisionStatus]')?.textContent,
    ).toBe('Only 3 days remaining');
    expect(
      container
        .querySelector('[data-test=provision-water]')
        ?.parentElement?.classList.contains('text-orange-500'),
    ).toBe(true);

    act(() => {
      updateInterface.provisions({
        provisions: { water: 0, food: 3, lumber: 0, shot: 0 },
        dailyConsumption: 2,
        daysRemaining: 0,
        status: 'exhausted',
      });
    });

    expect(
      container.querySelector('[data-test=provisionStatus]')?.textContent,
    ).toBe('Supplies exhausted');
    expect(
      container
        .querySelector('[data-test=provision-food]')
        ?.parentElement?.classList.contains('text-red-600'),
    ).toBe(true);

    act(() => root.unmount());
  });
});
