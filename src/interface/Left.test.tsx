import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import state from '../state/state';
import updateInterface from '../state/updateInterface';
import Left from './Left';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('./sound/Sound', () => ({
  __esModule: true,
  default: () => null,
}));

test('shows the persisted sea day and reacts to live day updates', () => {
  state.dayAtSea = 6;
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() => {
    root.render(
      <Left portId={null} buildingId={null} timePassed={0} gold={0} />,
    );
  });

  expect(container.querySelector('[data-test=dayAtSea]')?.textContent).toBe(
    'Day 6',
  );

  act(() => updateInterface.dayAtSea(7));

  expect(container.querySelector('[data-test=dayAtSea]')?.textContent).toBe(
    'Day 7',
  );

  act(() => root.unmount());
});
