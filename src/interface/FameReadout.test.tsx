import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import state from '../state/state';
import updateInterface from '../state/updateInterface';
import FameReadout from './FameReadout';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe('FameReadout', () => {
  test('renders all three fame tracks, including the two with no source yet', () => {
    state.fame = { adventure: 30, pirate: 0, trade: 0 };

    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(<FameReadout />));

    expect(
      container.querySelector('[data-test=fame-adventure]')?.textContent,
    ).toBe('30');
    expect(
      container.querySelector('[data-test=fame-pirate]')?.textContent,
    ).toBe('0');
    expect(container.querySelector('[data-test=fame-trade]')?.textContent).toBe(
      '0',
    );

    act(() => root.unmount());
  });

  test('updates in place on the fame channel without remounting', () => {
    state.fame = { adventure: 30, pirate: 0, trade: 0 };

    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(<FameReadout />));

    const adventureNode = container.querySelector('[data-test=fame-adventure]');

    act(() => {
      updateInterface.fame({ adventure: 180, pirate: 15, trade: 0 });
    });

    expect(
      container.querySelector('[data-test=fame-adventure]')?.textContent,
    ).toBe('180');
    expect(
      container.querySelector('[data-test=fame-pirate]')?.textContent,
    ).toBe('15');
    // Same DOM node updated in place — proves this was a live re-render, not
    // the component tearing down and remounting.
    expect(container.querySelector('[data-test=fame-adventure]')).toBe(
      adventureNode,
    );

    act(() => root.unmount());
  });
});
