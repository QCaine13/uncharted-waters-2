import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { setupSeaStory } from '../../../tests/seaStoryFixture';
import Input from '../../input';
import SeaStory from './SeaStory';
import { setLocale } from '../../localization';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let mockController: ReturnType<typeof setupSeaStory>['controller'];
jest.mock('../../story/seaStory', () => ({
  ...jest.requireActual('../../story/seaStory'),
  getSeaStorySession: () => mockController.getSnapshot(),
  subscribeSeaStory: (listener: () => void) =>
    mockController.subscribe(listener),
  advanceSeaStory: (...args: Parameters<typeof mockController.advance>) =>
    mockController.advance(...args),
}));
jest.mock('../../assets', () => ({
  __esModule: true,
  default: {
    images: () => ({ toDataURL: () => 'data:image/png;base64,' }),
    characters: () => 'data:image/png;base64,',
  },
}));

test.each(['yes', 'no'])(
  'renders and advances a real sea choice (%s), isolated from an open journal',
  (choice) => {
    const fixture = setupSeaStory();
    mockController = fixture.controller;
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    act(() => root.render(<SeaStory />));
    expect(container.querySelector('[role=dialog]')).toBeNull();
    act(() => {
      mockController.start();
    });
    expect(container.textContent).toContain('Someone is aboard.');
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });
    expect(container.textContent).toContain('Welcome him?');
    const release = Input.suspend('overlay');
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });
    expect(mockController.getSnapshot()?.stepIndex).toBe(1);
    release();
    act(() => setLocale('zh-CN'));
    expect(container.querySelector('[data-test=confirmYes]')?.textContent).toBe(
      '是',
    );
    act(() => setLocale('en'));
    expect(container.querySelector('[data-test=confirmYes]')?.textContent).toBe(
      'Yes',
    );
    // Keyboard Escape is the real No action; Enter is the default Yes action.
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: choice === 'yes' ? 'Enter' : 'Escape',
        }),
      );
    });
    expect(container.querySelector('[role=dialog]')).toBeNull();
    expect(fixture.read().savedGold).toBe(choice === 'yes' ? 500 : 0);
    act(() => root.unmount());
    container.remove();
  },
);
