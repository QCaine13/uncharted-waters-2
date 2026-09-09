import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { createBrowserInputLifecycle } from './browserInputLifecycle';

describe('browser input lifecycle', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('releases owned keys and cancels late timer and frame work on failure settlement', () => {
    jest.useFakeTimers();
    const frames = new Map<number, FrameRequestCallback>();
    let nextFrame = 1;
    jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        const id = nextFrame;
        nextFrame += 1;
        frames.set(id, callback);
        return id;
      });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      frames.delete(id);
    });
    const inputEvents: string[] = [];
    const recordKeyDown = (event: KeyboardEvent) =>
      inputEvents.push(`down:${event.key}`);
    const recordRelease = (event: KeyboardEvent) =>
      inputEvents.push(`up:${event.key}`);
    document.addEventListener('keydown', recordKeyDown);
    document.addEventListener('keyup', recordRelease);
    const lateWork = jest.fn();
    const failures: string[] = [];

    const lifecycle = createBrowserInputLifecycle(window, ['d', 'e']);
    const lateAction = () => {
      lateWork();
      lifecycle.keyDown('w');
    };
    lifecycle.keyDown('d');
    lifecycle.setTimer(() => {
      if (lifecycle.settle({ releaseOwnedKeys: true }))
        failures.push('wall timeout');
    }, 100);
    lifecycle.setTimer(lateAction, 200);
    lifecycle.requestFrame(lateAction);
    const dequeuedFrames = [...frames.values()];

    jest.advanceTimersByTime(100);
    dequeuedFrames.forEach((callback) => callback(100));
    jest.advanceTimersByTime(100);
    expect(failures).toEqual(['wall timeout']);
    expect(lateWork).not.toHaveBeenCalled();
    expect(inputEvents).toEqual(
      expect.arrayContaining(['down:d', 'up:d', 'up:e']),
    );
    expect(inputEvents).not.toContain('down:w');
    expect(frames.size).toBe(0);
    expect(lifecycle.settle({ releaseOwnedKeys: true })).toBe(false);
    expect(lifecycle.setTimer(lateAction, 1)).toBeNull();
    expect(lifecycle.requestFrame(lateAction)).toBeNull();
    document.removeEventListener('keydown', recordKeyDown);
    document.removeEventListener('keyup', recordRelease);
  });

  it('can settle a successful unpaused heading without releasing it', () => {
    const released: string[] = [];
    const recordRelease = (event: KeyboardEvent) => released.push(event.key);
    document.addEventListener('keyup', recordRelease);

    const lifecycle = createBrowserInputLifecycle(window, ['a']);
    lifecycle.keyDown('a');
    expect(lifecycle.settle({ releaseOwnedKeys: false })).toBe(true);
    expect(released).not.toContain('a');
    document.removeEventListener('keyup', recordRelease);
  });
});
