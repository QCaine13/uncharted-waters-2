import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import Confirm from './Confirm';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('../../assets', () => ({
  __esModule: true,
  default: {
    images: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  },
}));

describe('Confirm listener lifecycle', () => {
  test('removes the same document drag handlers on unmount', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => {
      root.render(
        <Confirm
          onYes={jest.fn()}
          onNo={jest.fn()}
          initialPosition={{ x: 10, y: 20 }}
        />,
      );
    });

    const mousemove = addSpy.mock.calls.find(([type]) => type === 'mousemove');
    const mouseup = addSpy.mock.calls.find(([type]) => type === 'mouseup');

    expect(mousemove).toBeDefined();
    expect(mouseup).toBeDefined();

    act(() => root.unmount());

    expect(removeSpy).toHaveBeenCalledWith('mousemove', mousemove?.[1]);
    expect(removeSpy).toHaveBeenCalledWith('mouseup', mouseup?.[1]);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
