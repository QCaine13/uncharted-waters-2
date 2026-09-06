import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import state from '../../state/state';
import updateInterface from '../../state/updateInterface';
import Guild from './Guild';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('../../assets', () => ({
  __esModule: true,
  default: {
    buildings: () => 'guild.png',
    images: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  },
}));
const mockUseQuestStep = jest.fn();

jest.mock('../quest/useQuestStep', () => ({
  __esModule: true,
  default: () => mockUseQuestStep(),
}));

beforeEach(() => {
  mockUseQuestStep.mockReset();
  mockUseQuestStep.mockReturnValue(null);
});

test('reports pending discoveries through the Guild menu and shows a receipt', () => {
  localStorage.setItem('uw2.locale', 'en');
  localStorage.clear();
  localStorage.setItem('uw2.locale', 'en');
  state.portId = '1';
  state.buildingId = '7';
  state.gold = 100;
  state.discoveries = ['strait-of-gibraltar'];
  state.reportedDiscoveries = [];
  updateInterface.general = jest.fn();
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() => root.render(<Guild />));

  expect(container.querySelector('[data-test=guild]')).not.toBeNull();
  const report = Array.from(container.querySelectorAll('[role=button]')).find(
    (node) => node.textContent === 'Report Discoveries',
  );
  expect(report?.getAttribute('aria-disabled')).not.toBe('true');

  act(() => {
    report?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

  expect(state.gold).toBe(400);
  expect(state.reportedDiscoveries).toEqual(['strait-of-gibraltar']);
  expect(
    container.querySelector('[data-test=guild-report-receipt]')?.textContent,
  ).toContain('Reported 1 discovery. The Guild pays 300g.');

  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
  });
  expect(
    container.querySelector('[data-test=guild-report-receipt]'),
  ).toBeNull();
  expect(container.textContent).toContain('Report Discoveries');

  act(() => root.unmount());
});

test('assignment action re-resolves an eligible chapter after commission acceptance', () => {
  localStorage.setItem('uw2.locale', 'en');
  state.portId = '1';
  state.buildingId = '7';
  state.storyEvents = [
    'joao.lisbon-opening.harbor-final',
    'joao.first-voyage.commission-accepted',
    'joao.first-voyage.domingo-met',
    'joao.first-voyage.domingo-recruited',
  ];
  state.mates = [
    { sailorId: '1', role: 0 },
    { sailorId: '34', role: null },
  ];
  state.reportedDiscoveries = ['strait-of-gibraltar'];
  mockUseQuestStep.mockReturnValueOnce(null).mockReturnValue({
    messageBoxes: [{ body: 'Chapter reward ready.' }, null, null],
  });
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() => root.render(<Guild />));
  const assignments = Array.from(
    container.querySelectorAll('[role=button]'),
  ).find((node) => node.textContent === 'Job Assignment');
  expect(assignments?.className).not.toContain('text-gray-400');

  act(() => {
    assignments?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

  expect(container.textContent).toContain('Chapter reward ready.');

  act(() => root.unmount());
});
