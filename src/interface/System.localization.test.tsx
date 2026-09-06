import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import state from '../state/state';
import { setLocale } from '../localization';
import System from './System';
import Menu from './common/Menu';
import useCancel from './port/hooks/useCancel';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

test('switches language without changing the current game state', () => {
  setLocale('zh-CN');
  state.gold = 4321;
  state.buildingId = '2';
  const before = JSON.stringify(state, (key, value) =>
    ['port', 'world'].includes(key) ? undefined : value,
  );
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() => root.render(<System />));
  expect(container.textContent).toContain('语言');
  expect(container.textContent).toContain('保存');

  const select = container.querySelector('select')!;
  act(() => {
    select.value = 'en';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });

  expect(container.textContent).toContain('Language');
  expect(container.textContent).toContain('Save');
  expect(
    JSON.stringify(state, (key, value) =>
      ['port', 'world'].includes(key) ? undefined : value,
    ),
  ).toBe(before);

  act(() => root.unmount());
});

test('language select keys do not operate a background menu', () => {
  const onSelect = jest.fn();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <>
        <Menu
          options={[{ label: 'Save', value: 'save' }]}
          onSelect={onSelect}
        />
        <System />
      </>,
    ),
  );
  const select = container.querySelector('select')!;
  act(() => {
    select.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    select.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
  });
  expect(onSelect).not.toHaveBeenCalled();
  act(() => root.unmount());
  container.remove();
});

function CancelInput({ onCancel }: { onCancel: () => void }) {
  useCancel(onCancel);
  return <input aria-label="existing game input" />;
}

test('Escape still cancels an existing game input', () => {
  const onCancel = jest.fn();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<CancelInput onCancel={onCancel} />));
  const input = container.querySelector('input')!;
  act(() => {
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
  });
  expect(onCancel).toHaveBeenCalledTimes(1);
  act(() => root.unmount());
  container.remove();
});
