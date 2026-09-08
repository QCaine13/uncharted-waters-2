import { SAVED_STATE_KEY, type State } from '../src/state/state';

const headingIndex: Record<string, number> = { w: 0, d: 2, s: 4, a: 6 };
const indicatorUrls = new WeakMap<Window, Promise<string[]>>();
let indicatorSheetDataUrl: string | null = null;
let lastRenderedHeading: string | null = null;

export type HeadingHandshakeTrace = {
  key: string;
  pauseAfterMs: number | null;
  stage:
    | 'image-loading'
    | 'overlay-release'
    | 'heading'
    | 'pulse'
    | 'pause'
    | 'interruption';
  imageResolvedMs: number | null;
  overlayFrames: number;
  headingAttempts: number;
  headingFrames: number;
  pauseFrames: number;
  observedDirectionIndex: number | null;
  desiredDirectionIndex: number | null;
  elapsedMs: number;
  outcome: CourseResumeOutcome | 'failure';
};

export type CourseResumeOutcome = 'heading' | 'seaStory' | 'combat';
export type DockCycleOutcome = 'docked' | 'paused' | 'seaStory' | 'combat';
export type CourseResumeTrace = Omit<HeadingHandshakeTrace, 'outcome'> & {
  outcome: CourseResumeOutcome;
};

const renderedCourseInterruption = (
  document: Document,
): Exclude<CourseResumeOutcome, 'heading'> | null => {
  if (document.querySelector('[data-test=combat]')) return 'combat';
  if (document.querySelector('[data-test=seaStory]')) return 'seaStory';
  return null;
};

export const renderedCourseHeading = () => lastRenderedHeading;

const expectedIndicatorUrls = (window: Window, sheetDataUrl: string) => {
  const cached = indicatorUrls.get(window);
  if (cached) return cached;
  const loaded = new Promise<string[]>((resolve, reject) => {
    const image = window.document.createElement('img');
    image.src = sheetDataUrl;
    image.onload = () => {
      resolve(
        Array.from({ length: 9 }, (_, direction) => {
          const canvas = window.document.createElement('canvas');
          canvas.width = 80;
          canvas.height = image.height;
          canvas
            .getContext('2d')!
            .drawImage(
              image,
              direction * 80,
              0,
              80,
              image.height,
              0,
              0,
              80,
              image.height,
            );
          return canvas.toDataURL();
        }),
      );
    };
    image.onerror = () =>
      reject(new Error('Could not load shipped heading indicators'));
  });
  indicatorUrls.set(window, loaded);
  return loaded;
};

const playerHeadingImage = (document: Document) => {
  const images = document.querySelectorAll<HTMLImageElement>('img.w-20.h-20');
  if (images.length < 3)
    throw new Error('Player fleet heading indicator is not rendered');
  return images[2];
};

const clickRenderedSystem = (document: Document) => {
  const trigger = Array.from(
    document.querySelectorAll<HTMLElement>('[data-test=left] div'),
  ).find(
    (candidate) =>
      candidate.classList.contains('cursor-pointer') &&
      /^(系统|System)$/.test(candidate.textContent?.trim() ?? ''),
  );
  if (!trigger) throw new Error('Rendered System trigger is not available');
  trigger.click();
};

export const readVoyageSave = () =>
  cy.window({ log: false }).then((window) => {
    const raw = window.localStorage.getItem(SAVED_STATE_KEY);
    expect(raw !== null, 'savedState exists').to.equal(true);
    return JSON.parse(raw!) as State & { version: number };
  });

// These helpers use normal player controls. Storage is only read to measure
// movement; the fresh journey never teleports or injects runtime state.
export const saveFromSystem = () => {
  cy.document({ log: false }).then((document) => {
    if (!document.getElementById('locale-select')) {
      // The game is followed by a long homepage. Re-anchor the document before
      // opening a bottom-anchored HUD item so Cypress does not scroll the
      // trigger while sampling its position during a port/world remount.
      cy.scrollTo('top', { ensureScrollable: false, log: false });
      cy.contains('[data-test=left] div', /^(系统|System)$/, { log: false })
        .should('be.visible')
        .click({
          scrollBehavior: false,
          waitForAnimations: false,
          log: false,
        });
    }
  });
  cy.contains('button', /^(保存|Save)$/, { log: false }).click({ log: false });
  return readVoyageSave();
};

export const closeSidebar = (settleMs = 160) => {
  cy.document({ log: false }).trigger('keydown', {
    key: 'Escape',
    log: false,
  });
  cy.document({ log: false }).trigger('keyup', {
    key: 'Escape',
    log: false,
  });
  cy.get('#locale-select', { log: false }).should('not.exist');
  if (settleMs) cy.wait(settleMs, { log: false });
};

export const finishSeaEncounter = (
  choice: 'Yes' | 'No' = 'Yes',
  remaining = 30,
): Cypress.Chainable<Document> => {
  if (!remaining) throw new Error('Sea encounter did not finish');
  return cy.document({ log: false }).then<void>((document) => {
    // A controlled sailing pulse pauses through the visible System panel. A
    // sea encounter can mount under that panel on the final world tick, so
    // release the ordinary overlay before interacting with the story.
    if (document.getElementById('locale-select')) {
      closeSidebar();
      return finishSeaEncounter(choice, remaining);
    }
    const story = document.querySelector('[data-test=seaStory]');
    if (!story) return;
    const before = story.textContent;
    if (story.querySelector('[data-test=confirmYes]')) {
      cy.get(`[data-test=seaStory] [data-test=confirm${choice}]`, {
        log: false,
      }).click({ log: false });
    } else {
      cy.get('[data-test=seaStory]', { log: false }).click({ log: false });
    }
    cy.document({ log: false }).should((next) => {
      expect(
        next.querySelector('[data-test=seaStory]')?.textContent,
      ).not.to.equal(before);
    });
    return finishSeaEncounter(choice, remaining - 1);
  });
};

const loadIndicatorSheet = (): Cypress.Chainable<string> => {
  if (indicatorSheetDataUrl)
    return cy.wrap(indicatorSheetDataUrl, { log: false });
  return cy
    .task<string>(
      'readBase64File',
      'src/interface/images/worldIndicators.png',
      { log: false },
    )
    .then((base64) => {
      indicatorSheetDataUrl = `data:image/png;base64,${base64}`;
      return indicatorSheetDataUrl;
    });
};

export const resumeCourse = (
  key: string,
  pauseAfterMs?: number,
): Cypress.Chainable<CourseResumeTrace> => {
  // Load the expected image while the visible System overlay still pauses the
  // world. This keeps Cypress task/asset latency outside the sailing pulse.
  return loadIndicatorSheet().then(
    (sheetDataUrl) =>
      cy
        .window({ log: false })
        .then(
          { timeout: (pauseAfterMs ?? 0) + 12_000 },
          (window) =>
            new Cypress.Promise<CourseResumeTrace>((resolve, reject) => {
              const startedAt = window.performance.now();
              const trace: Omit<
                HeadingHandshakeTrace,
                'elapsedMs' | 'outcome'
              > = {
                key,
                pauseAfterMs: pauseAfterMs ?? null,
                stage: 'image-loading',
                imageResolvedMs: null,
                overlayFrames: 0,
                headingAttempts: 0,
                headingFrames: 0,
                pauseFrames: 0,
                observedDirectionIndex: null,
                desiredDirectionIndex: headingIndex[key] ?? null,
              };
              const snapshot = <
                Outcome extends HeadingHandshakeTrace['outcome'],
              >(
                outcome: Outcome,
              ): Omit<HeadingHandshakeTrace, 'outcome'> & {
                outcome: Outcome;
              } => ({
                ...trace,
                elapsedMs: Math.round(window.performance.now() - startedAt),
                outcome,
              });
              let settled = false;
              let pulseTimeout: number | undefined;
              const finish = (outcome: CourseResumeOutcome) => {
                if (settled) return;
                settled = true;
                window.clearTimeout(watchdog);
                if (pulseTimeout !== undefined)
                  window.clearTimeout(pulseTimeout);
                resolve(snapshot(outcome));
              };
              const fail = (reason: string) => {
                if (settled) return;
                settled = true;
                window.clearTimeout(watchdog);
                if (pulseTimeout !== undefined)
                  window.clearTimeout(pulseTimeout);
                reject(
                  new Error(
                    `${reason}: ${JSON.stringify(snapshot('failure'))}`,
                  ),
                );
              };
              // Frame-count bounds remain the behavioral guard. This watchdog
              // makes browser scheduling stalls fail with stage/timing evidence
              // before Cypress can replace the useful error with cy.then's
              // generic callback timeout.
              const watchdog = window.setTimeout(
                () => fail('Course heading handshake exceeded its wall bound'),
                (pauseAfterMs ?? 0) + 10_000,
              );

              expectedIndicatorUrls(window, sheetDataUrl).then(
                (expected) => {
                  trace.imageResolvedMs = Math.round(
                    window.performance.now() - startedAt,
                  );
                  const desired = expected[headingIndex[key]];
                  if (!desired) {
                    fail(`No heading indicator mapping for ${key}`);
                    return;
                  }
                  const document = window.document;
                  const finishInterruption = () => {
                    const interruption = renderedCourseInterruption(document);
                    if (!interruption) return false;
                    trace.stage = 'interruption';
                    document.dispatchEvent(
                      new window.KeyboardEvent('keyup', { key, bubbles: true }),
                    );
                    finish(interruption);
                    return true;
                  };
                  document.dispatchEvent(
                    new window.KeyboardEvent('keydown', {
                      key: 'Escape',
                      bubbles: true,
                    }),
                  );
                  document.dispatchEvent(
                    new window.KeyboardEvent('keyup', {
                      key: 'Escape',
                      bubbles: true,
                    }),
                  );
                  trace.stage = 'overlay-release';
                  const observePause = (remaining = 60) => {
                    if (settled || finishInterruption()) return;
                    if (document.getElementById('locale-select')) {
                      finish('heading');
                      return;
                    }
                    if (!remaining) {
                      fail(
                        'Rendered System overlay did not reopen after pulse',
                      );
                      return;
                    }
                    trace.pauseFrames += 1;
                    window.requestAnimationFrame(() =>
                      observePause(remaining - 1),
                    );
                  };
                  const observeOverlayRelease = (remaining = 60) => {
                    if (settled || finishInterruption()) return;
                    if (
                      !document.getElementById('locale-select') &&
                      !document.querySelector('[data-overlay-panel]')
                    ) {
                      trace.stage = 'heading';
                      steer();
                      return;
                    }
                    if (!remaining) {
                      fail(
                        'Rendered System overlay did not release before heading',
                      );
                      return;
                    }
                    trace.overlayFrames += 1;
                    window.requestAnimationFrame(() =>
                      observeOverlayRelease(remaining - 1),
                    );
                  };
                  const beginPulse = () => {
                    const observeInterruption = () => {
                      if (settled || finishInterruption()) return;
                      window.requestAnimationFrame(observeInterruption);
                    };
                    window.requestAnimationFrame(observeInterruption);
                    pulseTimeout = window.setTimeout(() => {
                      if (settled || finishInterruption()) return;
                      document.dispatchEvent(
                        new window.KeyboardEvent('keyup', {
                          key,
                          bubbles: true,
                        }),
                      );
                      clickRenderedSystem(document);
                      trace.stage = 'pause';
                      observePause();
                    }, pauseAfterMs!);
                  };
                  const steer = (remaining = 20) => {
                    if (settled || finishInterruption()) return;
                    trace.headingAttempts += 1;
                    document.dispatchEvent(
                      new window.KeyboardEvent('keyup', { key, bubbles: true }),
                    );
                    document.dispatchEvent(
                      new window.KeyboardEvent('keydown', {
                        key,
                        bubbles: true,
                      }),
                    );
                    window.requestAnimationFrame(() =>
                      window.requestAnimationFrame(() => {
                        if (settled || finishInterruption()) return;
                        trace.headingFrames += 2;
                        trace.observedDirectionIndex = expected.indexOf(
                          playerHeadingImage(document).src,
                        );
                        if (
                          trace.observedDirectionIndex === headingIndex[key]
                        ) {
                          lastRenderedHeading = key;
                          if (pauseAfterMs === undefined) {
                            finish('heading');
                            return;
                          }
                          trace.stage = 'pulse';
                          beginPulse();
                          return;
                        }
                        if (remaining <= 1) {
                          document.dispatchEvent(
                            new window.KeyboardEvent('keyup', {
                              key,
                              bubbles: true,
                            }),
                          );
                          fail(`Rendered fleet heading did not accept ${key}`);
                          return;
                        }
                        steer(remaining - 1);
                      }),
                    );
                  };
                  observeOverlayRelease();
                },
                () => fail('Could not prepare shipped heading indicators'),
              );
            }),
        )
        .then((trace) => {
          const diagnosticPath = Cypress.env('headingDiagnosticPath') as
            | string
            | undefined;
          if (!diagnosticPath) return trace;
          return cy
            .writeFile(diagnosticPath, `${JSON.stringify(trace)}\n`, {
              flag: 'a+',
              log: false,
            })
            .then(() => trace);
        }) as unknown as Cypress.Chainable<CourseResumeTrace>,
  );
};

export const resumeCourseWithDockCycles = (
  key: string,
): Cypress.Chainable<DockCycleOutcome> =>
  loadIndicatorSheet().then((sheetDataUrl) =>
    cy.window({ log: false }).then({ timeout: 12_000 }, (window) =>
      expectedIndicatorUrls(window, sheetDataUrl).then(
        (expected) =>
          new Cypress.Promise<DockCycleOutcome>((resolve, reject) => {
            const desired = expected[headingIndex[key]];
            const document = window.document;
            let settled = false;
            const finish = (outcome: DockCycleOutcome) => {
              if (settled) return;
              settled = true;
              document.dispatchEvent(
                new window.KeyboardEvent('keyup', { key, bubbles: true }),
              );
              resolve(outcome);
            };
            const fail = (reason: string) => {
              if (settled) return;
              settled = true;
              document.dispatchEvent(
                new window.KeyboardEvent('keyup', { key, bubbles: true }),
              );
              reject(new Error(reason));
            };
            if (!desired) {
              fail(`No heading indicator mapping for ${key}`);
              return;
            }
            const finishInterruption = () => {
              const interruption = renderedCourseInterruption(document);
              if (!interruption) return false;
              document.dispatchEvent(
                new window.KeyboardEvent('keyup', {
                  key: 'e',
                  bubbles: true,
                }),
              );
              finish(interruption);
              return true;
            };
            document.dispatchEvent(
              new window.KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true,
              }),
            );
            document.dispatchEvent(
              new window.KeyboardEvent('keyup', {
                key: 'Escape',
                bubbles: true,
              }),
            );

            const pauseAndResolve = () => {
              if (settled || finishInterruption()) return;
              document.dispatchEvent(
                new window.KeyboardEvent('keyup', { key, bubbles: true }),
              );
              clickRenderedSystem(document);
              const observePause = (remaining = 60) => {
                if (settled || finishInterruption()) return;
                if (document.getElementById('locale-select')) {
                  finish('paused');
                  return;
                }
                if (!remaining) {
                  fail('System did not pause after moving dock attempt');
                  return;
                }
                window.requestAnimationFrame(() => observePause(remaining - 1));
              };
              observePause();
            };

            let totalFrames = 0;
            let framesWithDesiredHeading = 0;
            const startedAt = window.performance.now();
            const steerAndTryDock = () => {
              if (settled || finishInterruption()) return;
              // Dock releases begin at the same ordinary System-release
              // boundary as steering. If a pending destination carries the
              // fleet through the harbor diamond before the new heading is
              // rendered, one of these E cycles can still enter the port.
              document.dispatchEvent(
                new window.KeyboardEvent('keyup', {
                  key: 'e',
                  bubbles: true,
                }),
              );
              document.dispatchEvent(
                new window.KeyboardEvent('keydown', {
                  key: 'e',
                  bubbles: true,
                }),
              );
              document.dispatchEvent(
                new window.KeyboardEvent('keyup', {
                  key: 'e',
                  bubbles: true,
                }),
              );
              if (document.querySelector('[data-test=portName]')) {
                document.dispatchEvent(
                  new window.KeyboardEvent('keyup', {
                    key,
                    bubbles: true,
                  }),
                );
                finish('docked');
                return;
              }

              if (playerHeadingImage(document).src === desired) {
                lastRenderedHeading = key;
                framesWithDesiredHeading += 1;
              } else {
                framesWithDesiredHeading = 0;
                document.dispatchEvent(
                  new window.KeyboardEvent('keyup', { key, bubbles: true }),
                );
                document.dispatchEvent(
                  new window.KeyboardEvent('keydown', {
                    key,
                    bubbles: true,
                  }),
                );
              }
              // Four rendered frames can still commit only the destination
              // queued by the previous heading. Keep the ordinary E cycles
              // active through a bounded accepted-heading window so the
              // requested targetward step is observed at tight harbors.
              if (framesWithDesiredHeading >= 12) {
                pauseAndResolve();
                return;
              }
              totalFrames += 1;
              if (totalFrames >= 48) {
                fail(
                  `Rendered fleet heading did not accept ${key} during moving dock attempt after ${totalFrames} frames and ${Math.round(
                    window.performance.now() - startedAt,
                  )}ms`,
                );
                return;
              }
              window.requestAnimationFrame(steerAndTryDock);
            };
            steerAndTryDock();
          }),
      ),
    ),
  );

export const releaseSystemAndDock = () =>
  cy.window({ log: false }).then(
    (window) =>
      new Cypress.Promise<DockCycleOutcome>((resolve, reject) => {
        const document = window.document;
        let settled = false;
        const finish = (outcome: DockCycleOutcome) => {
          if (settled) return;
          settled = true;
          resolve(outcome);
        };
        const finishInterruption = () => {
          const interruption = renderedCourseInterruption(document);
          if (!interruption) return false;
          document.dispatchEvent(
            new window.KeyboardEvent('keyup', { key: 'e', bubbles: true }),
          );
          finish(interruption);
          return true;
        };
        const fail = (reason: string) => {
          if (settled) return;
          settled = true;
          reject(new Error(reason));
        };
        document.dispatchEvent(
          new window.KeyboardEvent('keydown', {
            key: 'Escape',
            bubbles: true,
          }),
        );
        document.dispatchEvent(
          new window.KeyboardEvent('keyup', {
            key: 'Escape',
            bubbles: true,
          }),
        );
        // Ordinary E cycles straddle the overlay's asynchronous suspension
        // release. The first unsuspended release remains live for250ms, so the
        // next world update can dock before a heading transition moves again.
        const tryDock = (remaining = 8) => {
          if (settled || finishInterruption()) return;
          document.dispatchEvent(
            new window.KeyboardEvent('keyup', { key: 'e', bubbles: true }),
          );
          document.dispatchEvent(
            new window.KeyboardEvent('keydown', { key: 'e', bubbles: true }),
          );
          document.dispatchEvent(
            new window.KeyboardEvent('keyup', { key: 'e', bubbles: true }),
          );
          if (document.querySelector('[data-test=portName]')) {
            finish('docked');
            return;
          }
          if (remaining) {
            window.requestAnimationFrame(() => tryDock(remaining - 1));
            return;
          }
          clickRenderedSystem(document);
          const observePause = (frames = 60) => {
            if (settled || finishInterruption()) return;
            if (document.getElementById('locale-select')) {
              finish('paused');
              return;
            }
            if (!frames) {
              fail('System did not pause after direct dock attempt');
              return;
            }
            window.requestAnimationFrame(() => observePause(frames - 1));
          };
          observePause();
        };
        tryDock();
      }),
  );

type PlannedWorldUnblock = {
  key: 'w' | 'a' | 's' | 'd';
  target: { x: number; y: number };
  steps: number;
};

const writeFirstVoyageNavigationDiagnostic = (
  record: unknown,
): Cypress.Chainable<null> => {
  const path = Cypress.env('firstVoyageNavigationDiagnosticPath');
  if (!path) return cy.wrap(null, { log: false });
  return cy
    .writeFile(path, `${JSON.stringify(record)}\n`, {
      flag: 'a',
      log: false,
    })
    .then(() => null);
};

const wrappedMovement = (
  before: { x: number; y: number },
  after: { x: number; y: number },
) => {
  let x = after.x - before.x;
  if (x > 1080) x -= 2160;
  if (x < -1080) x += 2160;
  return Math.abs(x) + Math.abs(after.y - before.y);
};

const executeFirstVoyageCorrection = (
  correction: PlannedWorldUnblock,
  before: State & { version: number },
  label: string,
  remaining = 5,
): ReturnType<typeof saveFromSystem> => {
  if (!remaining) {
    const position = before.fleets['1'].position!;
    throw new Error(
      `First-voyage correction made no saved movement at ${label} from ${position.x.toFixed(
        2,
      )},${position.y.toFixed(2)}, time ${before.timePassed}`,
    );
  }
  const position = before.fleets['1'].position!;
  return resumeCourse(correction.key, 50)
    .then((course) => {
      if (course.outcome === 'seaStory')
        return finishSeaEncounter().then(() => saveFromSystem());
      if (course.outcome === 'combat')
        throw new Error(`Unexpected combat during ${label} correction`);
      return saveFromSystem();
    })
    .then((after) => {
      if (wrappedMovement(position, after.fleets['1'].position!) >= 0.01)
        return cy.wrap(after, { log: false });
      return executeFirstVoyageCorrection(
        correction,
        after,
        label,
        remaining - 1,
      );
    }) as ReturnType<typeof saveFromSystem>;
};

export const sailToCoordinate = (
  axis: 'x' | 'y',
  target: number,
  remaining = 100,
  stalledObservations = 0,
): ReturnType<typeof saveFromSystem> => {
  if (!remaining) throw new Error(`Could not sail to ${axis}=${target}`);
  return saveFromSystem().then<void>((saved) => {
    expect(saved.portId, 'fleet remains at sea').to.be.null;
    const position = saved.fleets['1'].position!;
    const delta = target - position[axis];
    cy.writeFile(
      'tests/screenshots/m1-navigation.json',
      { axis, target, position, dayAtSea: saved.dayAtSea, remaining },
      { log: false },
    );
    return cy.document({ log: false }).then((document) => {
      if (document.querySelector('[data-test=seaStory]')) {
        closeSidebar();
        finishSeaEncounter();
        return sailToCoordinate(axis, target, remaining - 1);
      }
      if (Math.abs(delta) <= 0.8) return;
      const key =
        axis === 'x' ? (delta > 0 ? 'd' : 'a') : delta > 0 ? 's' : 'w';
      return resumeCourse(key).then((course) => {
        if (course.outcome === 'seaStory')
          return finishSeaEncounter().then(() =>
            sailToCoordinate(axis, target, remaining - 1, stalledObservations),
          );
        if (course.outcome === 'combat')
          throw new Error(
            `Unexpected combat while sailing first voyage to ${axis}=${target}`,
          );
        return cy
          .wait(Math.abs(delta) > 3 ? 350 : 100, { log: false })
          .then(() =>
            cy.document({ log: false }).trigger('keyup', { key, log: false }),
          )
          .then(() => saveFromSystem())
          .then((after) => {
            const moved = wrappedMovement(
              position,
              after.fleets['1'].position!,
            );
            const nextStalled = moved < 0.01 ? stalledObservations + 1 : 0;
            if (nextStalled < 5)
              return sailToCoordinate(axis, target, remaining - 1, nextStalled);
            return cy
              .task<PlannedWorldUnblock | null>(
                'planWorldUnblock',
                { position: after.fleets['1'].position, axis, key, target },
                { log: false },
              )
              .then((correction) => {
                if (!correction)
                  throw new Error(
                    `No safe first-voyage correction toward ${axis}=${target} from ${after.fleets[
                      '1'
                    ].position!.x.toFixed(2)},${after.fleets[
                      '1'
                    ].position!.y.toFixed(2)}`,
                  );
                return writeFirstVoyageNavigationDiagnostic({
                  kind: 'world-unblock-start',
                  axis,
                  target,
                  position: after.fleets['1'].position,
                  timePassed: after.timePassed,
                  stalledObservations: nextStalled,
                  correction,
                })
                  .then(() =>
                    executeFirstVoyageCorrection(
                      correction,
                      after,
                      `${axis}=${target}`,
                    ),
                  )
                  .then((corrected) =>
                    writeFirstVoyageNavigationDiagnostic({
                      kind: 'world-unblock-finish',
                      axis,
                      target,
                      before: after.fleets['1'].position,
                      after: corrected.fleets['1'].position,
                      timePassed: corrected.timePassed,
                      correction,
                    }),
                  )
                  .then(() => sailToCoordinate(axis, target, remaining - 1, 0));
              });
          }) as ReturnType<typeof saveFromSystem>;
      });
    });
  });
};

export const sailLisbonToGibraltar = () => {
  sailToCoordinate('x', 835);
  sailToCoordinate('y', 376);
  sailToCoordinate('x', 856);
  sailToCoordinate('y', 376);
  sailToCoordinate('x', 858);
  sailToCoordinate('y', 374);
  sailToCoordinate('x', 863);
};

export const sailGibraltarToLisbon = () => {
  sailToCoordinate('x', 858);
  sailToCoordinate('y', 376);
  sailToCoordinate('x', 835);
  sailToCoordinate('y', 358);
  dockAtLisbon();
};

// Docking requires a tighter coastal position than discovery. Pulse E while
// correcting course with ordinary controls; the harbor wall stops eastward drift.
const dockAtLisbon = (remaining = 20): ReturnType<typeof saveFromSystem> => {
  if (!remaining) throw new Error('Could not enter Lisbon harbor');
  return saveFromSystem().then<void>((saved) => {
    if (saved.portId === '1') {
      closeSidebar();
      return;
    }
    return cy.document({ log: false }).then((document) => {
      if (document.querySelector('[data-test=seaStory]')) {
        closeSidebar();
        finishSeaEncounter();
        return dockAtLisbon(remaining - 1);
      }
      if (!saved.storyEvents.includes('joao.first-voyage.domingo-met')) {
        return resumeCourse('d').then((course) => {
          if (course.outcome === 'seaStory')
            return finishSeaEncounter().then(() => dockAtLisbon(remaining - 1));
          if (course.outcome === 'combat')
            throw new Error('Unexpected combat before the Lisbon return');
          return cy
            .wait(600, { log: false })
            .then(() => dockAtLisbon(remaining - 1));
        });
      }
      const { x, y } = saved.fleets['1'].position!;
      const key = x < 838 ? 'd' : y < 358 ? 's' : 'w';
      return resumeCourse(key).then((course) => {
        if (course.outcome === 'seaStory')
          return finishSeaEncounter().then(() => dockAtLisbon(remaining - 1));
        if (course.outcome === 'combat')
          throw new Error('Unexpected combat while docking at Lisbon');
        return cy
          .document({ log: false })
          .trigger('keydown', { key: 'e', log: false })
          .trigger('keyup', { key: 'e', log: false })
          .then(() => cy.wait(150, { log: false }))
          .then(() => dockAtLisbon(remaining - 1));
      });
    });
  });
};
