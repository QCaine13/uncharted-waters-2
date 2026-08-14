import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import state from '../../state/state';
import updateInterface from '../../state/updateInterface';
import type { ProvisionSummary } from '../../state/provisions';
import Provisions, {
  getProvisionStatusText,
  getStarvationReportText,
} from './Provisions';

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

  test.each<[ProvisionSummary, string | null]>([
    [summary('normal', 5), null],
    [
      { ...summary('normal', 5), crewLosses: [{ shipNumber: 0, deaths: 1 }] },
      'Lost 1 crew member to starvation',
    ],
    [
      {
        ...summary('normal', 5),
        crewLosses: [
          { shipNumber: 0, deaths: 2 },
          { shipNumber: 1, deaths: 1 },
        ],
      },
      'Lost 3 crew members to starvation',
    ],
    [
      {
        ...summary('normal', 5),
        crewLosses: [{ shipNumber: 0, deaths: 1 }],
        adrift: true,
      },
      'Lost 1 crew member to starvation — the fleet drifted into port',
    ],
  ])('maps a settlement outcome to starvation copy', (value, expected) => {
    expect(getStarvationReportText(value)).toBe(expected);
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

  test('renders the starvation report when present and clears it on the next update', () => {
    state.fleets = {
      '1': {
        position: { x: 100, y: 100 },
        ships: [
          {
            id: '6',
            name: 'Flagship',
            crew: 9,
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
      container.querySelector('[data-test=provisionStarvation]'),
    ).toBeNull();

    act(() => {
      updateInterface.provisions({
        provisions: { water: 6, food: 6, lumber: 0, shot: 0 },
        dailyConsumption: 1,
        daysRemaining: 6,
        status: 'normal',
        starvationDays: 1,
        crewLosses: [{ shipNumber: 0, deaths: 1 }],
        adrift: false,
      });
    });

    expect(
      container.querySelector('[data-test=provisionStarvation]')?.textContent,
    ).toBe('Lost 1 crew member to starvation');

    // A later, uneventful settlement replaces the summary outright — the
    // report shouldn’t linger from a previous day.
    act(() => {
      updateInterface.provisions({
        provisions: { water: 5, food: 5, lumber: 0, shot: 0 },
        dailyConsumption: 1,
        daysRemaining: 5,
        status: 'normal',
      });
    });

    expect(
      container.querySelector('[data-test=provisionStarvation]'),
    ).toBeNull();

    act(() => root.unmount());
  });
});
