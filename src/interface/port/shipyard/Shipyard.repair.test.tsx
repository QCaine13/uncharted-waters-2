import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { setLocale } from '../../../localization';
import state from '../../../state/state';
import updateInterface from '../../../state/updateInterface';
import Shipyard from './Shipyard';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('../../../assets', () => ({
  __esModule: true,
  default: {
    buildings: () => 'shipyard.png',
    images: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  },
}));
jest.mock('../../quest/useQuestStep', () => ({
  __esModule: true,
  default: () => null,
}));

test('quotes affordable damage, confirms repair, and reports the actual result', () => {
  setLocale('en');
  state.activeCombat = null;
  state.gold = 50;
  updateInterface.general = jest.fn();
  state.fleets = {
    '1': {
      position: undefined,
      ships: [
        { id: '6', name: 'Esperanza', crew: 20, durability: 23, cargo: [] },
      ],
    },
  };
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const click = (label: string) => {
    const target = Array.from(container.querySelectorAll('[role=button]')).find(
      (node) => node.textContent === label,
    ) as HTMLElement | undefined;
    expect(target).toBeDefined();
    act(() => target!.click());
  };

  act(() => root.render(<Shipyard />));
  click('Repair');
  expect(container.textContent).toContain(
    'Esperanza — 7 damage — 5 affordable',
  );
  click('Esperanza — 7 damage — 5 affordable');
  expect(container.textContent).toContain(
    'You can afford 5 of the 7 damaged hull points.',
  );
  expect(container.textContent).toContain('Repair 5 hull for 50 gold?');
  click('Yes');

  expect(state.fleets['1'].ships[0].durability).toBe(28);
  expect(state.gold).toBe(0);
  expect(container.textContent).toContain('Repaired 5 hull for 50 gold.');

  act(() => root.unmount());
  container.remove();
  setLocale('zh-CN');
});
