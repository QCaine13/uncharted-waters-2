import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import state from '../state/state';
import Discoveries, { formatLatitude, formatLongitude } from './Discoveries';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

// MessageBox (via Discoveries) draws its corner art from Assets, which is
// never loaded in this environment — mirrors Provisions.test.tsx's mock.
jest.mock('../assets', () => ({
  __esModule: true,
  default: {
    images: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  },
}));

describe('formatLatitude', () => {
  test.each([
    [-34.36, '34.4° S'],
    [37.8, '37.8° N'],
  ])('formats %p as %p', (latitude, expected) => {
    expect(formatLatitude(latitude)).toBe(expected);
  });
});

describe('formatLongitude', () => {
  test.each([
    [18.47, '18.5° E'],
    [-25.5, '25.5° W'],
  ])('formats %p as %p', (longitude, expected) => {
    expect(formatLongitude(longitude)).toBe(expected);
  });
});

describe('Discoveries', () => {
  test('shows the empty state when nothing has been discovered', () => {
    state.discoveries = [];
    state.reportedDiscoveries = [];

    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(<Discoveries />));

    expect(container.textContent).toBe('You have no discoveries.');

    act(() => root.unmount());
  });

  test('lists discoveries in insertion order and defaults detail to the first', () => {
    // Deliberately not the landmarkSeeds table order, so this also catches a
    // bug that iterated the landmark table instead of state.discoveries.
    state.discoveries = ['cape-of-good-hope', 'strait-of-gibraltar'];
    state.reportedDiscoveries = [];

    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(<Discoveries />));

    const labels = Array.from(container.querySelectorAll('[role=button]')).map(
      (el) => el.textContent,
    );

    expect(labels).toEqual(['Cape of Good Hope', 'Strait of Gibraltar']);
    expect(container.textContent).toContain('+150 adventure fame');
    expect(container.textContent).toContain(
      'Unreported — 1500g pending at Lisbon Guild',
    );
    expect(container.textContent).toContain('34.4° S, 18.5° E');

    act(() => root.unmount());
  });

  test('switches the detail pane to whichever discovery is selected', () => {
    state.discoveries = ['cape-of-good-hope', 'strait-of-gibraltar'];
    state.reportedDiscoveries = ['strait-of-gibraltar'];

    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(<Discoveries />));

    const options = container.querySelectorAll('[role=button]');

    act(() => {
      options[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Reward and coordinates only ever appear in the detail pane, so this
    // proves selection actually swapped which landmark is shown, not just
    // that Gibraltar's name is present somewhere (it already is, in the
    // menu).
    expect(container.textContent).toContain('+30 adventure fame');
    expect(container.textContent).toContain('Reported — 300g paid');
    expect(container.textContent).not.toContain('+150 adventure fame');

    act(() => root.unmount());
  });
});
