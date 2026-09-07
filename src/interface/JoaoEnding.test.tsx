import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import { setLocale } from '../localization';
import JoaoEnding from './JoaoEnding';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

test.each([
  [
    'en' as const,
    'João returned home with his family’s accusation resolved, Lucia rescued, and the alliance victorious.',
    'The main story is complete. You can continue exploring.',
  ],
  [
    'zh-CN' as const,
    '约翰回到了家，家族所受的指控已经洗清，路琪亚获救，联盟也赢得了胜利。',
    '约翰主线已完成，仍可继续自由探索。',
  ],
])('renders the durable home ending in %s', (locale, result, continuation) => {
  setLocale(locale);
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(<JoaoEnding />));

  const ending = container.querySelector('[data-test=joaoEnding]');
  expect(ending?.textContent).toContain(result);
  expect(ending?.textContent).toContain(continuation);
  expect(ending?.className).toContain('break-words');
  expect(ending?.querySelector('button, input, textarea, select')).toBeNull();

  act(() => root.unmount());
});
