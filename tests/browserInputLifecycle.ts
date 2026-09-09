export type BrowserInputLifecycle = {
  readonly isSettled: boolean;
  keyDown: (key: string) => void;
  keyUp: (key: string) => void;
  requestFrame: (callback: FrameRequestCallback) => number | null;
  setTimer: (callback: () => void, delayMs: number) => number | null;
  settle: (options: { releaseOwnedKeys: boolean }) => boolean;
};

export const createBrowserInputLifecycle = (
  window: Window & typeof globalThis,
  ownedKeys: readonly string[],
): BrowserInputLifecycle => {
  const timers = new Set<number>();
  const frames = new Set<number>();
  let settled = false;
  const dispatchKey = (type: 'keydown' | 'keyup', key: string) => {
    window.document.dispatchEvent(
      new window.KeyboardEvent(type, { key, bubbles: true }),
    );
  };

  return {
    get isSettled() {
      return settled;
    },
    keyDown(key) {
      if (!settled) dispatchKey('keydown', key);
    },
    keyUp(key) {
      if (!settled) dispatchKey('keyup', key);
    },
    requestFrame(callback) {
      if (settled) return null;
      let frame = 0;
      frame = window.requestAnimationFrame((time) => {
        frames.delete(frame);
        if (!settled) callback(time);
      });
      frames.add(frame);
      return frame;
    },
    setTimer(callback, delayMs) {
      if (settled) return null;
      let timer = 0;
      timer = window.setTimeout(() => {
        timers.delete(timer);
        if (!settled) callback();
      }, delayMs);
      timers.add(timer);
      return timer;
    },
    settle({ releaseOwnedKeys }) {
      if (settled) return false;
      settled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      frames.forEach((frame) => window.cancelAnimationFrame(frame));
      frames.clear();
      if (releaseOwnedKeys)
        new Set(ownedKeys).forEach((key) => dispatchKey('keyup', key));
      return true;
    },
  };
};
