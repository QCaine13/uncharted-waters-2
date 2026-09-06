import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import state from '../state/state';
import Fleet from './Fleet';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
jest.mock('../assets', () => ({
  __esModule: true,
  default: {
    ships: (id: string) => `ship:${id}`,
    images: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  },
}));

test.each([4, 9])(
  'renders every ship in an expanded fleet of %i without a fixed-position crash',
  (count) => {
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: jest.fn(),
    } as unknown as CanvasRenderingContext2D);
    jest
      .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      .mockReturnValue('data:image/png;base64,');
    state.fleets = {
      '1': {
        position: undefined,
        ships: Array.from({ length: count }, (_, i) => ({
          id: '6',
          name: `Ship ${i + 1}`,
          crew: 10,
          cargo: [],
          durability: 25,
        })),
      },
    };
    const container = document.createElement('div');
    const root = createRoot(container);
    try {
      act(() => root.render(<Fleet />));
      expect(container.querySelectorAll('img[src="ship:6"]')).toHaveLength(
        count,
      );
    } finally {
      act(() => root.unmount());
      jest.restoreAllMocks();
    }
  },
);
