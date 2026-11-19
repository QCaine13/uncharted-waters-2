export type DirectionKey = 'w' | 'a' | 's' | 'd';
export type PortRoute = readonly (readonly [DirectionKey, number])[];
type MapPosition = { x: number; y: number };

type DoorEntryTrace = {
  context: string;
  key: DirectionKey;
  modeledFrom: MapPosition;
  modeledDoor: MapPosition;
  frames: number;
  attempts: {
    attempt: number;
    startedFrame: number;
    endedFrame: number;
    heldMs: number;
    releaseReason: 'retry' | 'building-rendered' | 'failure-bound';
  }[];
  modeledRegionChanged: boolean;
  elapsedMs: number;
  failureReason: string | null;
  outcome: 'success' | 'failure';
};

let modeledPosition: MapPosition = { x: 54, y: 68 };

export const setModeledPortPosition = (position: MapPosition) => {
  modeledPosition = { ...position };
};

const pixelChecksum = (regions: Uint8ClampedArray[]) => {
  let checksum = 0;
  regions.forEach((pixels) => {
    for (let i = 0; i < pixels.length; i += 17)
      checksum = (checksum * 31 + pixels[i]) >>> 0;
  });
  return checksum;
};

const screenPosition = ({ x, y }: MapPosition) => {
  const cameraX = Math.max(0, Math.min(x + 1 - 20, 56));
  const cameraY = Math.max(0, Math.min(y + 1 - 12.5, 71));
  return {
    x: Math.floor((x - cameraX) * 32),
    y: Math.floor((y - cameraY) * 32),
  };
};

// The port scene renders to the WebGL #camera-port canvas, so pixels are
// read back through a 2D snapshot.
const snapshot2d = (canvas: HTMLCanvasElement) => {
  const snapshot = canvas.ownerDocument.createElement('canvas');
  snapshot.width = canvas.width;
  snapshot.height = canvas.height;
  const context = snapshot.getContext('2d')!;
  context.drawImage(canvas, 0, 0);
  return context;
};

const playerFrame = (canvas: HTMLCanvasElement, position: MapPosition) => {
  const context = snapshot2d(canvas);
  const screen = screenPosition(position);
  return pixelChecksum([context.getImageData(screen.x, screen.y, 64, 64).data]);
};

const movementRect = (from: MapPosition, to: MapPosition) => {
  const fromScreen = screenPosition(from);
  const toScreen = screenPosition(to);
  return {
    x: Math.min(fromScreen.x, toScreen.x),
    y: Math.min(fromScreen.y, toScreen.y),
    width: Math.abs(fromScreen.x - toScreen.x) + 64,
    height: Math.abs(fromScreen.y - toScreen.y) + 64,
  };
};

// Weather, water shimmer and other animated overlays repaint only a few
// pixels per frame, while a walking character repaints thousands, so
// movement is detected by counting substantially-changed bytes instead of
// comparing exact checksums (measured on the HD build: rain ≤ ~270
// bytes/frame, a one-tile move leaves ~1900+ bytes).
const PIXEL_DELTA = 8;
const MOVED_BYTES = 1200;
const QUIET_BYTES = 400;

const countChangedBytes = (
  before: Uint8ClampedArray,
  after: Uint8ClampedArray,
) => {
  let changed = 0;
  for (let i = 0; i < before.length; i += 1) {
    if (Math.abs(before[i] - after[i]) > PIXEL_DELTA) changed += 1;
  }
  return changed;
};

const playerPixels = (canvas: HTMLCanvasElement, position: MapPosition) => {
  const screen = screenPosition(position);
  return snapshot2d(canvas).getImageData(screen.x, screen.y, 64, 64).data;
};

const movementPixels = (
  canvas: HTMLCanvasElement,
  from: MapPosition,
  to: MapPosition,
) => {
  const rect = movementRect(from, to);
  return snapshot2d(canvas).getImageData(
    rect.x,
    rect.y,
    rect.width,
    rect.height,
  ).data;
};

const nextPosition = (
  { x, y }: MapPosition,
  key: DirectionKey,
): MapPosition => ({
  x: x + (key === 'd' ? 1 : key === 'a' ? -1 : 0),
  y: y + (key === 's' ? 1 : key === 'w' ? -1 : 0),
});

export const advanceModeledPortPosition = (key: DirectionKey) => {
  modeledPosition = nextPosition(modeledPosition, key);
};

export const enterAdjacentPortBuilding = (
  key: DirectionKey,
  context = 'adjacent port building',
) =>
  cy
    .window({ log: false })
    .then(
      { timeout: 12_000 },
      (window) =>
        new Cypress.Promise<DoorEntryTrace>((resolve) => {
          const document = window.document;
          const canvas = document.getElementById(
            'camera-port',
          ) as HTMLCanvasElement;
          const startedAt = window.performance.now();
          const modeledFrom = { ...modeledPosition };
          const modeledDoor = nextPosition(modeledFrom, key);
          const startingFrame = playerFrame(canvas, modeledFrom);
          let frames = 0;
          const attempts: DoorEntryTrace['attempts'] = [];
          let activeAttempt: {
            startedAt: number;
            startedFrame: number;
          } | null = null;
          let modeledRegionChanged = false;
          let settled = false;
          let watchdog: number | undefined;

          const releaseAttempt = (
            reason: DoorEntryTrace['attempts'][number]['releaseReason'],
          ) => {
            if (!activeAttempt) return;
            document.dispatchEvent(
              new window.KeyboardEvent('keyup', { key, bubbles: true }),
            );
            attempts.push({
              attempt: attempts.length + 1,
              startedFrame: activeAttempt.startedFrame,
              endedFrame: frames,
              heldMs: Math.round(
                window.performance.now() - activeAttempt.startedAt,
              ),
              releaseReason: reason,
            });
            activeAttempt = null;
          };
          const beginAttempt = () => {
            // A keydown received while the System overlay is still releasing is
            // deliberately suppressed until a paired keyup. Reissue the same
            // ordinary input in a bounded loop; a canvas-region change is not
            // proof that the requested destination was scheduled.
            document.dispatchEvent(
              new window.KeyboardEvent('keyup', { key, bubbles: true }),
            );
            document.dispatchEvent(
              new window.KeyboardEvent('keydown', { key, bubbles: true }),
            );
            activeAttempt = {
              startedAt: window.performance.now(),
              startedFrame: frames,
            };
          };
          const snapshot = (
            outcome: DoorEntryTrace['outcome'],
            failureReason: string | null = null,
          ): DoorEntryTrace => ({
            context,
            key,
            modeledFrom,
            modeledDoor,
            frames,
            attempts: [...attempts],
            modeledRegionChanged,
            elapsedMs: Math.round(window.performance.now() - startedAt),
            failureReason,
            outcome,
          });
          const finish = () => {
            if (settled) return;
            settled = true;
            releaseAttempt('building-rendered');
            if (watchdog !== undefined) window.clearTimeout(watchdog);
            resolve(snapshot('success'));
          };
          const fail = (reason: string) => {
            if (settled) return;
            settled = true;
            releaseAttempt('failure-bound');
            if (watchdog !== undefined) window.clearTimeout(watchdog);
            resolve(snapshot('failure', reason));
          };
          const observe = () => {
            if (settled) return;
            frames += 1;
            modeledRegionChanged =
              modeledRegionChanged ||
              playerFrame(canvas, modeledFrom) !== startingFrame;
            if (document.querySelector('[data-test=building]')) {
              finish();
              return;
            }
            if (frames >= 60) {
              fail(`Port building did not render after entering ${context}`);
              return;
            }

            const activeForMs = activeAttempt
              ? window.performance.now() - activeAttempt.startedAt
              : 0;
            const activeForFrames = activeAttempt
              ? frames - activeAttempt.startedFrame
              : 0;
            if (
              attempts.length < 7 &&
              (activeForMs >= 200 || activeForFrames >= 6)
            ) {
              releaseAttempt('retry');
              // Recheck immediately before another keydown so a building that
              // rendered during release can never receive menu navigation.
              if (document.querySelector('[data-test=building]')) {
                finish();
                return;
              }
              beginAttempt();
            }
            window.requestAnimationFrame(observe);
          };

          beginAttempt();
          watchdog = window.setTimeout(
            () =>
              fail(`Port building entry exceeded its wall bound at ${context}`),
            10_000,
          );
          window.requestAnimationFrame(observe);
        }),
    )
    .then((trace) => {
      const diagnosticPath = Cypress.expose('portEntryDiagnosticPath') as
        string | undefined;
      const persisted = diagnosticPath
        ? cy.writeFile(diagnosticPath, `${JSON.stringify(trace)}\n`, {
            flag: 'a+',
            log: false,
          })
        : cy.wrap(null, { log: false });
      return persisted.then(() => {
        if (trace.outcome === 'failure')
          throw new Error(`${trace.failureReason}: ${JSON.stringify(trace)}`);
        advanceModeledPortPosition(key);
      });
    });

export const moveOnePortTile = (key: DirectionKey, context: string) =>
  cy.window({ log: false }).then(
    { timeout: 12_000 },
    (window) =>
      new Cypress.Promise<void>((resolve, reject) => {
        const canvas = window.document.getElementById(
          'camera-port',
        ) as HTMLCanvasElement;
        const from = { ...modeledPosition };
        const to = nextPosition(from, key);
        const startingPlayerPixels = playerPixels(canvas, from);
        const startingMovementPixels = movementPixels(canvas, from, to);
        window.document.dispatchEvent(
          new window.KeyboardEvent('keydown', { key, bubbles: true }),
        );
        const settle = (
          previous: Uint8ClampedArray,
          stable: number,
          remaining = 600,
        ) => {
          window.requestAnimationFrame(() => {
            if (!remaining) {
              window.document.dispatchEvent(
                new window.KeyboardEvent('keyup', { key, bubbles: true }),
              );
              reject(new Error(`Movement ${key} did not settle at ${context}`));
              return;
            }
            const current = movementPixels(canvas, from, to);
            const nextStable =
              countChangedBytes(previous, current) < QUIET_BYTES
                ? stable + 1
                : 0;
            if (nextStable >= 6) {
              if (
                countChangedBytes(startingMovementPixels, current) < MOVED_BYTES
              )
                reject(new Error(`Movement ${key} was blocked at ${context}`));
              else {
                modeledPosition = to;
                resolve();
              }
              return;
            }
            settle(current, nextStable, remaining - 1);
          });
        };
        const start = (remaining = 600) => {
          window.requestAnimationFrame(() => {
            if (!remaining) {
              window.document.dispatchEvent(
                new window.KeyboardEvent('keyup', { key, bubbles: true }),
              );
              reject(
                new Error(`Movement ${key} was not handled at ${context}`),
              );
              return;
            }
            if (
              countChangedBytes(
                startingPlayerPixels,
                playerPixels(canvas, from),
              ) < MOVED_BYTES
            ) {
              start(remaining - 1);
              return;
            }
            window.document.dispatchEvent(
              new window.KeyboardEvent('keyup', { key, bubbles: true }),
            );
            settle(movementPixels(canvas, from, to), 0);
          });
        };
        start();
      }),
  );

export const walkPortRoute = (route: PortRoute, label = 'port route') => {
  route.forEach(([key, count], segment) => {
    for (let step = 0; step < count; step += 1)
      moveOnePortTile(key, `${label} segment ${segment} tile ${step}`);
  });
};

export const enterPortBuilding = (route: PortRoute, label = 'building') => {
  const steps = route.flatMap(([key, count]) => Array(count).fill(key));
  const doorKey = steps.pop();
  steps.forEach((key, step) =>
    moveOnePortTile(key, `${label} approach tile ${step}`),
  );
  if (!doorKey) throw new Error(`Route for ${label} is empty`);
  enterAdjacentPortBuilding(doorKey, label);
};
