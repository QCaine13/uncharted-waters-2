import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import updateInterface from '../../state/updateInterface';
import { landmarks } from '../../data/discoveryData';
import DiscoveryBanner from './DiscoveryBanner';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const gibraltar = landmarks.find((l) => l.id === 'strait-of-gibraltar')!;
const azores = landmarks.find((l) => l.id === 'azores')!;

describe('DiscoveryBanner', () => {
  test('renders nothing before any discovery has happened', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(<DiscoveryBanner hidden={false} />));

    expect(
      container.querySelector('[data-test=discoveryBanner]')?.textContent,
    ).toBe('');

    act(() => root.unmount());
  });

  test('renders sighting fame and the pending Guild report reward', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(<DiscoveryBanner hidden={false} />));

    act(() => {
      updateInterface.discovery([gibraltar]);
    });

    expect(
      container.querySelector('[data-test=discoveryBanner]')?.textContent,
    ).toBe(
      'Discovered: Strait of Gibraltar — +30 adventure fame; report for 300g',
    );

    act(() => root.unmount());
  });

  test('shows every landmark discovered in the same tick', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(<DiscoveryBanner hidden={false} />));

    act(() => {
      updateInterface.discovery([gibraltar, azores]);
    });

    const text = container.querySelector(
      '[data-test=discoveryBanner]',
    )?.textContent;

    expect(text).toContain(
      'Discovered: Strait of Gibraltar — +30 adventure fame; report for 300g',
    );
    expect(text).toContain(
      'Discovered: The Azores — +50 adventure fame; report for 500g',
    );

    act(() => root.unmount());
  });

  test('clears on docking and stays clear until a new discovery happens', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(<DiscoveryBanner hidden={false} />));

    act(() => {
      updateInterface.discovery([gibraltar]);
    });

    expect(
      container.querySelector('[data-test=discoveryBanner]')?.textContent,
    ).not.toBe('');

    act(() => {
      // dock() clears the banner with an empty array (see actionsWorld.ts).
      updateInterface.discovery([]);
    });

    expect(
      container.querySelector('[data-test=discoveryBanner]')?.textContent,
    ).toBe('');

    act(() => {
      updateInterface.discovery([azores]);
    });

    expect(
      container.querySelector('[data-test=discoveryBanner]')?.textContent,
    ).toBe('Discovered: The Azores — +50 adventure fame; report for 500g');

    act(() => root.unmount());
  });
});
