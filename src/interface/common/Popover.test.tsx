import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';
import Popover from './Popover';
import Menu from './Menu';
import Acknowledge from './Acknowledge';
import Confirm from './Confirm';
import Input from '../../input';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let mockRetainExitingBackdrop = false;
jest.mock('../../assets', () => ({
  __esModule: true,
  default: { images: () => ({ toDataURL: () => 'data:image/png;base64,' }) },
}));
jest.mock('@headlessui/react', () => ({
  Transition: ({
    show,
    children,
  }: {
    show: boolean;
    children: React.ReactNode;
  }) => (show || mockRetainExitingBackdrop ? children : null),
}));

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  mockRetainExitingBackdrop = false;
  localStorage.setItem('uw2.locale', 'en');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const open = () =>
  act(() => {
    Array.from(container.querySelectorAll('div'))
      .find((node) => node.textContent === 'Journal')!
      .click();
  });
const key = (value: string) =>
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: value, bubbles: true }),
    );
  });

test.each(['Escape', 'contextmenu'])(
  'closing a sidebar with %s keeps the underlying building open',
  (value) => {
    const exit = jest.fn();
    act(() =>
      root.render(
        <>
          <Menu
            options={[{ label: 'Job', value: 'job' }]}
            onSelect={() => undefined}
            onCancel={exit}
          />
          <Popover label="Journal">
            <div>Chapter progress</div>
          </Popover>
        </>,
      ),
    );
    open();
    expect(Input.isSuspended('overlay')).toBe(true);
    if (value === 'Escape') key(value);
    else
      act(() => {
        document.dispatchEvent(
          new MouseEvent('contextmenu', { bubbles: true }),
        );
      });
    expect(container.textContent).not.toContain('Chapter progress');
    expect(exit).not.toHaveBeenCalled();
    expect(Input.isSuspended()).toBe(false);
  },
);

test('keyboard selection belongs to the sidebar menu while the building menu is covered', () => {
  const outer = jest.fn();
  const inner = jest.fn();
  const acknowledge = jest.fn();
  act(() =>
    root.render(
      <>
        <Menu options={[{ label: 'Job', value: 'job' }]} onSelect={outer} />
        <Acknowledge onAcknowledge={acknowledge} />
        <Popover label="Journal">
          <Menu options={[{ label: 'Log', value: 'log' }]} onSelect={inner} />
        </Popover>
      </>,
    ),
  );
  open();
  key('Enter');
  expect(inner).toHaveBeenCalledWith('log');
  expect(outer).not.toHaveBeenCalled();
  expect(acknowledge).not.toHaveBeenCalled();
});

test('a covered confirmation cannot accept a building action', () => {
  const yes = jest.fn();
  act(() =>
    root.render(
      <>
        <Confirm
          onYes={yes}
          onNo={() => undefined}
          initialPosition={{ x: 0, y: 0 }}
        />
        <Popover label="Journal">
          <div>Chapter progress</div>
        </Popover>
      </>,
    ),
  );
  open();
  key('Enter');
  expect(yes).not.toHaveBeenCalled();
});

test('a fading backdrop releases pointer input as soon as its panel closes', () => {
  // Transition libraries may keep the exiting node mounted for the animation.
  mockRetainExitingBackdrop = true;
  act(() =>
    root.render(
      <Popover label="Journal">
        <div>Chapter progress</div>
      </Popover>,
    ),
  );
  open();
  key('Escape');
  expect(container.querySelector('[data-overlay-panel]')).toBeNull();
  expect(Input.isSuspended()).toBe(false);
  const backdrop = container.querySelector('.fixed')!;
  expect(window.getComputedStyle(backdrop).pointerEvents).toBe('none');
});
