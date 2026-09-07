import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import state from '../state/state';
import QuestJournal from './QuestJournal';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('../assets', () => ({
  __esModule: true,
  default: {
    images: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  },
}));

test('renders completed progress and the current concrete next step', () => {
  localStorage.setItem('uw2.locale', 'en');
  state.storyEvents = ['joao.lisbon-opening.house-introduction'];
  state.discoveries = [];
  state.reportedDiscoveries = [];
  state.mates = [{ sailorId: '1', role: 0 }];
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() => root.render(<QuestJournal />));

  expect(container.querySelector('[data-test=questJournal]')).not.toBeNull();
  expect(
    container.querySelector('[data-test=journal-entry-opening-house]')
      ?.textContent,
  ).toContain('Complete');
  expect(
    container.querySelector('[data-test=journal-entry-opening-pub]')
      ?.textContent,
  ).toContain('Current objective');
  expect(container.textContent).toContain('Visit Carlotta at the Lisbon pub.');

  act(() => root.unmount());
});

test('puts the current M2 step and preparation before completed M1 history', () => {
  localStorage.setItem('uw2.locale', 'en');
  state.storyEvents = ['joao.first-voyage.chapter-complete'];
  state.discoveries = ['strait-of-gibraltar'];
  state.reportedDiscoveries = ['strait-of-gibraltar'];
  state.items = ['4'];
  state.equipment = { weaponId: null, armorId: null };
  state.combatResults = {};
  state.activeCombat = null;
  state.mates = [
    { sailorId: '1', role: 0 },
    { sailorId: '34', role: null },
  ];
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() => root.render(<QuestJournal />));

  const currentEntry = container.querySelector(
    '[data-test=journal-entry-m2-domingo-missing]',
  );
  const preparation = container.querySelector(
    '[data-test=journal-entry-m2-preparation]',
  );
  const history = container.querySelector(
    '[data-test=journal-entry-opening-house]',
  );
  expect(currentEntry?.textContent).toContain('Current objective');
  expect(preparation?.textContent).toContain('Preparation');
  expect(history?.textContent).toContain('Complete');
  const orderedIds = Array.from(
    container.querySelectorAll('[data-test^=journal-entry]'),
  ).map((entry) => entry.getAttribute('data-test'));
  expect(orderedIds.indexOf('journal-entry-m2-domingo-missing')).toBeLessThan(
    orderedIds.indexOf('journal-entry-m2-preparation'),
  );
  expect(orderedIds.indexOf('journal-entry-m2-preparation')).toBeLessThan(
    orderedIds.indexOf('journal-entry-opening-house'),
  );

  act(() => root.unmount());
});
