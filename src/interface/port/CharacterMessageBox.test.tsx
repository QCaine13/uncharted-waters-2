import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import CharacterMessageBox from './CharacterMessageBox';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const characterAsset = jest.fn((id: string) => `portrait:${id}`);

jest.mock('../../assets', () => ({
  __esModule: true,
  default: {
    characters: (id: string) => characterAsset(id),
    images: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  },
}));

afterEach(() => characterAsset.mockClear());

test('keeps the legacy portrait asset mapping unchanged', () => {
  localStorage.setItem('uw2.locale', 'en');
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() =>
    root.render(
      <CharacterMessageBox
        messageBox={{ body: 'Welcome.', characterId: 'domingo' }}
        position={1}
      />,
    ),
  );

  expect(container.querySelector('img[src="portrait:34"]')).not.toBeNull();
  expect(characterAsset).toHaveBeenCalledWith('34');
  expect(container.textContent).toContain('Domingo');

  act(() => root.unmount());
});

test('uses canonical localized presentation without dereferencing a portraitless sailor', () => {
  localStorage.setItem('uw2.locale', 'zh-CN');
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() =>
    root.render(
      <CharacterMessageBox
        messageBox={{
          body: 'Ready.',
          characterId: 'm2-relief-captain',
        }}
        position={2}
      />,
    ),
  );

  expect(container.textContent).toContain('代理船长');
  expect(
    container.querySelector('[data-test=character-portrait-placeholder]')
      ?.textContent,
  ).toBe('代理');
  expect(container.querySelector('.text-slate-600')).not.toBeNull();
  expect(characterAsset).not.toHaveBeenCalled();

  act(() => root.unmount());
});
