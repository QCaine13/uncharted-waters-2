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
