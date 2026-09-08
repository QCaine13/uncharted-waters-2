import { SAVED_STATE_KEY, type State } from '../src/state/state';
import { regularPorts, supplyPorts } from '../src/data/portData';
import {
  closeSidebar,
  finishSeaEncounter,
  readVoyageSave,
  releaseSystemAndDock,
  renderedCourseHeading,
  resumeCourse,
  resumeCourseWithDockCycles,
  saveFromSystem,
  type CourseResumeOutcome,
  type DockCycleOutcome,
} from './firstVoyageUtils';
import {
  advanceModeledPortPosition,
  enterPortBuilding,
  setModeledPortPosition,
} from './portRouteUtils';
import { classifyDockingCorrectionMovement } from './worldNavigationControl';
import type { PlannedDirection, PlannedRoute } from './worldRoutePlanner';
import { clickMenu } from './utils';

type Position = { x: number; y: number };
type PlannedWorldRoute = {
  start: Position;
  goal: Position;
  route: PlannedRoute;
  escape?: PlannedWorldEscape;
};
type PlannedWorldEscape = {
  key: PlannedDirection;
  expected: Position;
  simulatedSteps: number;
};
type PlannedPortRoute = { goal: Position; route: PlannedRoute };
type PlannedUnblock = {
  key: PlannedDirection;
  target: Position;
  steps: number;
};
type PlannedDockingEntry = {
  key: PlannedDirection;
  expected: Position;
  simulatedSteps: number;
};

const journeyPorts = [
  ...regularPorts.map((port, index) => ({ ...port, id: `${index + 1}` })),
  ...supplyPorts.map((port, index) => ({
    ...port,
    id: `${regularPorts.length + index + 1}`,
    buildings: { '4': { x: 62, y: 54 } },
  })),
];

const journeyPort = (portId: string) => {
  const port = journeyPorts.find(({ id }) => id === portId);
  if (!port) throw new Error(`Unknown journey port ${portId}`);
  return port;
};

export const outsidePortBuilding = (portId: string, buildingId: string) => {
  const buildings = journeyPort(portId).buildings as Record<string, Position>;
  const building = buildings[buildingId];
  if (!building)
    throw new Error(`Port ${portId} has no building ${buildingId}`);
  return { x: building.x, y: building.y + 1 };
};

export const portSpawn = (portId: string) => outsidePortBuilding(portId, '4');

type LodgeExitTrace = {
  context: string;
  frames: number;
  fadeSeen: boolean;
  endToEndElapsedMs: number;
  observerElapsedMs: number;
};

const waitForLodgeExit = (context: string, startedAt: number) =>
  cy.window({ log: false }).then(
    { timeout: 12_000 },
    (window) =>
      new Cypress.Promise<LodgeExitTrace>((resolve, reject) => {
        const observerStartedAt = window.performance.now();
        let frames = 0;
        let fadeSeen = false;
        let settled = false;

        const snapshot = (): LodgeExitTrace => ({
          context,
          frames,
          fadeSeen,
          endToEndElapsedMs: Math.round(window.performance.now() - startedAt),
          observerElapsedMs: Math.round(
            window.performance.now() - observerStartedAt,
          ),
        });
        const finish = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(watchdog);
          resolve(snapshot());
        };
        const fail = (reason: string) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(watchdog);
          reject(new Error(`${reason}: ${JSON.stringify(snapshot())}`));
        };
        const observe = () => {
          if (settled) return;
          frames += 1;
          fadeSeen = fadeSeen || document.querySelector('.fade-out') !== null;
          if (!document.querySelector('[data-test=building]')) {
            finish();
            return;
          }
          if (frames >= 60) {
            fail(`Lodge did not finish its fade and exit at ${context}`);
            return;
          }
          window.requestAnimationFrame(observe);
        };

        const { document } = window;
        const watchdog = window.setTimeout(
          () => fail(`Lodge exit exceeded its wall bound at ${context}`),
          10_000,
        );
        window.requestAnimationFrame(observe);
      }),
  );

export const checkInAtLodge = (
  menuLabel: string,
  context: string,
): ReturnType<typeof readVoyageSave> => {
  let beforeTime = 0;
  let startedAt = 0;
  return readVoyageSave()
    .then((saved) => {
      beforeTime = saved.timePassed;
      return cy.window({ log: false });
    })
    .then((window) => {
      startedAt = window.performance.now();
      return clickMenu(menuLabel);
    })
    .then(() => waitForLodgeExit(context, startedAt))
    .then((trace) =>
      readVoyageSave().then((saved) => {
        expect(saved.buildingId, `${context} exited the lodge`).to.be.null;
        expect(saved.timePassed, `${context} advanced time`).to.be.greaterThan(
          beforeTime,
        );
        expect(
          Math.floor(saved.timePassed / 1440),
          `${context} advanced exactly one calendar day`,
        ).to.equal(Math.floor(beforeTime / 1440) + 1);
        expect(saved.timePassed % 1440, `${context} woke at 08:00`).to.equal(
          480,
        );
        const diagnosticPath = Cypress.env('buildingExitDiagnosticPath') as
          | string
          | undefined;
        if (diagnosticPath)
          return cy
            .writeFile(
              diagnosticPath,
              `${JSON.stringify({
                ...trace,
                beforeTime,
                afterTime: saved.timePassed,
              })}\n`,
              { flag: 'a+', log: false },
            )
            .then(() => cy.wrap(saved, { log: false }));
        return cy.wrap(saved, { log: false });
      }),
    ) as ReturnType<typeof readVoyageSave>;
};

export const enterPlannedPortBuilding = (
  portId: string,
  from: Position,
  buildingId: string,
  label: string,
) =>
  cy
    .task<PlannedPortRoute>(
      'planPortRoute',
      {
        portId,
        from,
        toBuildingId: buildingId,
      },
      { log: false },
    )
    .then(({ route }) => {
      setModeledPortPosition(from);
      enterPortBuilding(route, label);
      saveFromSystem().then((saved) =>
        expect(saved.buildingId, `${label} entered exact building`).to.equal(
          buildingId,
        ),
      );
      closeSidebar();
    });

export const exitCurrentPortBuilding = (
  remaining = 6,
): Cypress.Chainable<Document> => {
  if (!remaining)
    throw new Error('Building did not exit through ordinary back input');
  return cy.document({ log: false }).then<void>((document) => {
    if (!document.querySelector('[data-test=building]')) {
      return saveFromSystem().then<void>((saved) => {
        if (saved.buildingId !== null) {
          closeSidebar();
          return exitCurrentPortBuilding(remaining - 1);
        }
        closeSidebar();
        advanceModeledPortPosition('s');
      });
    }
    cy.get('[data-test=building]', { log: false }).rightclick({ log: false });
    // A building remount briefly removes the overlay while an ordinary menu
    // backs up to its greeting. Observe beyond that transition before treating
    // the player as back on the port map.
    cy.wait(250, { log: false });
    return cy.document({ log: false }).then<void>((next) => {
      if (!next.querySelector('[data-test=building]')) {
        cy.get('[data-test=building]', { log: false }).should('not.exist');
        return saveFromSystem().then<void>((saved) => {
          if (saved.buildingId !== null) {
            closeSidebar();
            return exitCurrentPortBuilding(remaining - 1);
          }
          closeSidebar();
          advanceModeledPortPosition('s');
        });
      }
      return exitCurrentPortBuilding(remaining - 1);
    });
  });
};

export interface JourneyCheckpoint {
  name: string;
  rawPath: string;
  sha256: string;
  bytes: number;
  observed: {
    portId: string | null;
    buildingId: string | null;
    timePassed: number;
    dayAtSea: number;
    gold: number;
    storyEvents: string[];
    items: string[];
    combatResults: State['combatResults'];
    flagship: State['fleets']['1']['ships'][number] | null;
  };
  provenance: 'visible System Save';
}

const checkpointRunId =
  Cypress.env('journeyRunId') ||
  `run-${new Date().toISOString().replace(/[:.]/g, '-')}`;
export const checkpointRoot = `.superpowers/sdd/2026-09-07-m3-joao-finale/full-journey-checkpoints/${checkpointRunId}`;
const checkpoints: JourneyCheckpoint[] = [];

const writeManifest = () =>
  cy.writeFile(
    `${checkpointRoot}/manifest.json`,
    {
      schemaVersion: 1,
      runId: checkpointRunId,
      checkpoints,
    },
    { log: false },
  );

const sha256 = (raw: string) =>
  cy
    .window()
    .then((window) =>
      window.crypto.subtle
        .digest('SHA-256', new TextEncoder().encode(raw))
        .then((digest) =>
          Array.from(new Uint8Array(digest), (byte) =>
            byte.toString(16).padStart(2, '0'),
          ).join(''),
        ),
    );

export const resetCheckpointManifest = () => {
  checkpoints.length = 0;
  cy.log(`Journey checkpoint directory: ${checkpointRoot}`);
  cy.writeFile(`${checkpointRoot}/navigation.jsonl`, '', { log: false });
  cy.writeFile(`${checkpointRoot}/phase.jsonl`, '', { log: false });
  writeManifest();
};

export const recordJourneyPhase = (label: string, saved: State) =>
  cy.writeFile(
    `${checkpointRoot}/phase.jsonl`,
    `${JSON.stringify({
      label,
      portId: saved.portId,
      buildingId: saved.buildingId,
      timePassed: saved.timePassed,
      dayAtSea: saved.dayAtSea,
      gold: saved.gold,
      latestStoryEvent: saved.storyEvents[saved.storyEvents.length - 1] ?? null,
    })}\n`,
    { flag: 'a+', log: false },
  );

export const saveJourneyCheckpoint = (name: string) =>
  saveFromSystem().then((saved) =>
    cy.window({ log: false }).then((window) => {
      const raw = window.localStorage.getItem(SAVED_STATE_KEY);
      expect(raw !== null, `${name} has original saved bytes`).to.equal(true);
      return sha256(raw!).then((hash) => {
        const rawPath = `${checkpointRoot}/${name}.save.json`;
        const flagship = saved.fleets['1']?.ships[0] ?? null;
        const checkpoint: JourneyCheckpoint = {
          name,
          rawPath,
          sha256: hash,
          bytes: new TextEncoder().encode(raw!).byteLength,
          observed: {
            portId: saved.portId,
            buildingId: saved.buildingId,
            timePassed: saved.timePassed,
            dayAtSea: saved.dayAtSea,
            gold: saved.gold,
            storyEvents: [...saved.storyEvents],
            items: [...saved.items],
            combatResults: { ...saved.combatResults },
            flagship: flagship
              ? {
                  ...flagship,
                  cargo: flagship.cargo.map((entry) => ({ ...entry })),
                }
              : null,
          },
          provenance: 'visible System Save',
        };
        checkpoints.push(checkpoint);
        cy.writeFile(rawPath, raw!, { log: false });
        writeManifest();
        return cy.wrap(saved, { log: false });
      });
    }),
  );

const positionAfter = (
  position: Position,
  direction: PlannedDirection,
  count: number,
) => ({
  x:
    (position.x +
      (direction === 'd' ? count : direction === 'a' ? -count : 0) +
      2160) %
    2160,
  y: position.y + (direction === 's' ? count : direction === 'w' ? -count : 0),
});

const signedWrappedXDelta = (target: number, current: number) => {
  const direct = target - current;
  if (direct > 1080) return direct - 2160;
  if (direct < -1080) return direct + 2160;
  return direct;
};

const settleWorldCourseInterruption = (
  outcome: CourseResumeOutcome | DockCycleOutcome,
  label: string,
  expectedCombatId?: string,
): Cypress.Chainable<boolean> => {
  if (outcome === 'heading' || outcome === 'paused' || outcome === 'docked')
    return cy.wrap(false, { log: false });
  const observeCombat = (): Cypress.Chainable<boolean> =>
    readVoyageSave().then<boolean>((saved) => {
      if (!saved.activeCombat) {
        if (outcome === 'combat')
          throw new Error(`Rendered combat has no saved encounter at ${label}`);
        return cy.wrap(false, { log: false });
      }
      if (!expectedCombatId)
        throw new Error(
          `Unexpected combat ${saved.activeCombat.encounterId} at ${label}`,
        );
      expect(saved.activeCombat.encounterId).to.equal(expectedCombatId);
      return cy
        .get('[data-test=combat]', { log: false })
        .should('be.visible')
        .then(() => true);
    });
  if (outcome === 'combat') return observeCombat();
  return finishSeaEncounter().then(observeCombat);
};

const executeWorldCorrection = (
  correction: PlannedUnblock,
  before: State,
  label: string,
  remaining = 5,
): ReturnType<typeof saveFromSystem> => {
  if (!remaining) {
    const position = before.fleets['1'].position!;
    throw new Error(
      `Perpendicular correction made no saved movement while sailing ${label} at ${position.x.toFixed(
        2,
      )},${position.y.toFixed(2)}, time ${before.timePassed}`,
    );
  }
  const position = before.fleets['1'].position!;
  return resumeCourse(correction.key, 50)
    .then((course) =>
      settleWorldCourseInterruption(course.outcome, label).then(
        (interrupted) => {
          if (interrupted)
            throw new Error(`Unexpected combat during ${label} correction`);
          return saveFromSystem();
        },
      ),
    )
    .then<void>((after) =>
      cy
        .writeFile(
          `${checkpointRoot}/navigation.jsonl`,
          `${JSON.stringify({
            label: `${label} perpendicular correction`,
            target: correction.target,
            before: position,
            after: after.fleets['1'].position,
            timeBefore: before.timePassed,
            timeAfter: after.timePassed,
            key: correction.key,
            renderedHeading: renderedCourseHeading(),
            pulse: 50,
            plannedSteps: correction.steps,
            remaining,
          })}\n`,
          { flag: 'a+', log: false },
        )
        .then<void>(() => {
          const afterPosition = after.fleets['1'].position!;
          const moved =
            Math.abs(signedWrappedXDelta(afterPosition.x, position.x)) +
            Math.abs(afterPosition.y - position.y);
          if (moved >= 0.01) return;
          return executeWorldCorrection(
            correction,
            after,
            label,
            remaining - 1,
          );
        }),
    );
};

const executeDockingCorrection = (
  portId: string,
  axis: 'x' | 'y',
  key: PlannedDirection,
  before: State,
  remaining = 5,
): ReturnType<typeof saveFromSystem> => {
  if (!remaining) {
    const position = before.fleets['1'].position!;
    return cy
      .task<PlannedUnblock | null>(
        'planWorldUnblock',
        {
          position,
          axis,
          key,
        },
        { log: false },
      )
      .then<void>((correction) => {
        if (!correction)
          throw new Error(
            `No safe docking correction for port ${portId} at ${position.x.toFixed(
              2,
            )},${position.y.toFixed(2)}, time ${before.timePassed}`,
          );
        return executeWorldCorrection(
          correction,
          before,
          `port ${portId} docking ${axis} blocked`,
        );
      }) as unknown as ReturnType<typeof saveFromSystem>;
  }
  const position = before.fleets['1'].position!;
  let dockOutcome: DockCycleOutcome = 'paused';
  return resumeCourseWithDockCycles(key)
    .then((outcome) => {
      dockOutcome = outcome;
      return settleWorldCourseInterruption(
        outcome,
        `port ${portId} docking ${axis}`,
      ).then((interrupted) => {
        if (interrupted)
          throw new Error(`Unexpected combat while docking at port ${portId}`);
        return saveFromSystem();
      });
    })
    .then<void>((after) => {
      const afterPosition = after.fleets['1'].position!;
      const movement = classifyDockingCorrectionMovement({
        before: position,
        after: afterPosition,
        axis,
        key,
      });
      return cy
        .writeFile(
          `${checkpointRoot}/navigation.jsonl`,
          `${JSON.stringify({
            label: `port ${portId} docking ${axis} direct correction`,
            before: position,
            after: afterPosition,
            timeBefore: before.timePassed,
            timeAfter: after.timePassed,
            key,
            renderedHeading: renderedCourseHeading(),
            dockCycles: 'through 12 accepted-heading animation frames',
            remaining,
            dockOutcome,
            savedPortId: after.portId,
            movement,
          })}\n`,
          { flag: 'a+', log: false },
        )
        .then<void>(() => {
          if (after.portId === portId) return;
          // The engine commits the previously queued destination before reading
          // this requested heading. Any real displacement makes this plan stale,
          // even when it is perpendicular to or opposite the requested axis.
          // Reobserve both saved coordinates and plan again; retry the same key
          // only when the world made no saved movement at all.
          if (movement.outcome !== 'stalled') return;
          return executeDockingCorrection(
            portId,
            axis,
            key,
            after,
            remaining - 1,
          );
        });
    });
};

const pulseToward = (
  axis: 'x' | 'y',
  target: number,
  label: string,
  remainingAttempts = 180,
  tolerance = 0.8,
  stalledObservations = 0,
  expectedCombatId?: string,
): Cypress.Chainable<Document> => {
  if (!remainingAttempts)
    return saveFromSystem().then((saved) => {
      const position = saved.fleets['1'].position!;
      throw new Error(
        `Could not reach ${label}; last saved position ${position.x.toFixed(
          2,
        )},${position.y.toFixed(2)}, time ${saved.timePassed}`,
      );
    });
  return cy.document({ log: false }).then<void>((document) => {
    if (document.querySelector('[data-test=combat]')) {
      if (!expectedCombatId)
        throw new Error(`Unexpected combat while sailing ${label}`);
      return readVoyageSave().then((saved) =>
        expect(saved.activeCombat?.encounterId).to.equal(expectedCombatId),
      );
    }
    if (document.querySelector('[data-test=seaStory]')) {
      finishSeaEncounter();
      return readVoyageSave().then((afterStory) => {
        if (afterStory.activeCombat) {
          expect(afterStory.activeCombat.encounterId).to.equal(
            expectedCombatId,
          );
          cy.get('[data-test=combat]', { log: false }).should('be.visible');
          return;
        }
        return pulseToward(
          axis,
          target,
          label,
          remainingAttempts - 1,
          tolerance,
          stalledObservations,
          expectedCombatId,
        );
      });
    }
    return saveFromSystem().then((saved) => {
      if (saved.portId !== null)
        throw new Error(
          `Unexpectedly docked at ${saved.portId} while sailing ${label}`,
        );
      // The final world tick before System pauses can mount an encounter after
      // the pre-save observation above. Settle it through the visible story
      // before asking the world to accept another heading.
      if (document.querySelector('[data-test=seaStory]')) {
        finishSeaEncounter();
        return pulseToward(
          axis,
          target,
          label,
          remainingAttempts - 1,
          tolerance,
          stalledObservations,
          expectedCombatId,
        );
      }
      const position = saved.fleets['1'].position!;
      const delta =
        axis === 'x'
          ? signedWrappedXDelta(target, position.x)
          : target - position.y;
      if (Math.abs(delta) <= tolerance) return;
      const key =
        axis === 'x' ? (delta > 0 ? 'd' : 'a') : delta > 0 ? 's' : 'w';
      const before = position[axis];
      // One long no-progress observation establishes a collision. Subsequent
      // ordinary retries stay short so the bounded unblock decision does not
      // burn several in-game days against the same coast cell.
      const pulse =
        stalledObservations > 0
          ? 50
          : Math.abs(delta) > 40
          ? 5000
          : Math.abs(delta) > 12
          ? 1800
          : 50;
      return resumeCourse(key, pulse)
        .then((course) =>
          settleWorldCourseInterruption(
            course.outcome,
            label,
            expectedCombatId,
          ),
        )
        .then<void>((interruptedCombat) => {
          if (interruptedCombat) return;
          const combatObservation = cy
            .document({ log: false })
            .then((afterPulseDocument) => {
              if (!afterPulseDocument.querySelector('[data-test=seaStory]'))
                return false;
              finishSeaEncounter();
              return readVoyageSave().then((afterStory) => {
                if (!afterStory.activeCombat) return false;
                expect(afterStory.activeCombat.encounterId).to.equal(
                  expectedCombatId,
                );
                return cy
                  .get('[data-test=combat]', { log: false })
                  .should('be.visible')
                  .then(() => true);
              });
            }) as unknown as Cypress.Chainable<boolean>;
          return combatObservation.then<void>((combatStarted) => {
            if (combatStarted) return;
            return saveFromSystem().then<void>((next) => {
              const moved =
                axis === 'x'
                  ? Math.abs(
                      signedWrappedXDelta(next.fleets['1'].position!.x, before),
                    )
                  : Math.abs(next.fleets['1'].position![axis] - before);
              const nextStalled = moved < 0.01 ? stalledObservations + 1 : 0;
              return cy
                .writeFile(
                  `${checkpointRoot}/navigation.jsonl`,
                  `${JSON.stringify({
                    label,
                    axis,
                    target,
                    tolerance,
                    before: position,
                    after: next.fleets['1'].position,
                    timeBefore: saved.timePassed,
                    timeAfter: next.timePassed,
                    key,
                    renderedHeading: renderedCourseHeading(),
                    pulse,
                    stalledObservations: nextStalled,
                  })}\n`,
                  { flag: 'a+', log: false },
                )
                .then(() => {
                  if (nextStalled >= 5) {
                    return cy
                      .task<PlannedUnblock | null>(
                        'planWorldUnblock',
                        {
                          position: next.fleets['1'].position,
                          axis,
                          key,
                        },
                        { log: false },
                      )
                      .then((correction) => {
                        if (!correction)
                          throw new Error(
                            `No safe perpendicular correction after ${nextStalled} saved stalls while sailing ${label} toward ${axis}=${target} at ${position.x.toFixed(
                              2,
                            )},${position.y.toFixed(2)}; time ${
                              saved.timePassed
                            } -> ${next.timePassed}`,
                          );
                        // A first pulse can only commit the destination from the
                        // previous heading. Observe a small bounded sequence until
                        // this requested correction changes either saved axis, then
                        // let the controller replan from both actual coordinates.
                        return executeWorldCorrection(correction, next, label);
                      });
                  }
                  return pulseToward(
                    axis,
                    target,
                    label,
                    remainingAttempts - 1,
                    tolerance,
                    nextStalled,
                    expectedCombatId,
                  );
                });
            });
          });
        });
    });
  });
};

const dockAtPlannedPort = (
  portId: string,
  remaining = 20,
): ReturnType<typeof saveFromSystem> => {
  if (!remaining)
    return readVoyageSave().then((saved) => {
      const position = saved.fleets['1'].position!;
      throw new Error(
        `Could not dock at port ${portId}; last saved position ${position.x.toFixed(
          2,
        )},${position.y.toFixed(2)}, time ${saved.timePassed}`,
      );
    });
  return saveFromSystem().then<void>((saved) => {
    if (saved.portId === portId) {
      closeSidebar();
      cy.get('[data-test=portName]', { log: false }).should('exist');
      return;
    }
    expect(saved.portId).to.be.null;
    const center = journeyPort(portId).position;
    const position = saved.fleets['1'].position!;
    const deltaX = signedWrappedXDelta(center.x, position.x);
    const deltaY = center.y - position.y;
    const inDockingDiamond =
      Math.abs(deltaX) <= 2 &&
      Math.abs(deltaY) <= 2 &&
      Math.abs(deltaX) + Math.abs(deltaY) <= 3;
    if (!inDockingDiamond) {
      const fallbackAxis =
        Math.abs(deltaX) > 2
          ? 'x'
          : Math.abs(deltaY) > 2
          ? 'y'
          : Math.abs(deltaX) <= Math.abs(deltaY)
          ? 'x'
          : 'y';
      const fallbackDelta = fallbackAxis === 'x' ? deltaX : deltaY;
      const fallbackKey =
        fallbackAxis === 'x'
          ? fallbackDelta > 0
            ? 'd'
            : 'a'
          : fallbackDelta > 0
          ? 's'
          : 'w';
      // A fractional position can round onto the wrong side of a coastal
      // corner. Prefer a short constant-direction correction only when the
      // shipped collision model proves it reaches the exact docking diamond.
      // Otherwise retain the full A* approach from both saved axes.
      return cy
        .task<PlannedDockingEntry | null>(
          'planDockingEntry',
          {
            position,
            portId,
          },
          { log: false },
        )
        .then((entry) => {
          if (entry) {
            const axis = entry.key === 'a' || entry.key === 'd' ? 'x' : 'y';
            return executeDockingCorrection(portId, axis, entry.key, saved);
          }
          return cy
            .task<PlannedWorldRoute>(
              'planWorldRoute',
              {
                from: position,
                toPortId: portId,
              },
              { log: false },
            )
            .then((approach) => {
              const key =
                approach.escape?.key ?? approach.route[0]?.[0] ?? fallbackKey;
              const axis = key === 'a' || key === 'd' ? 'x' : 'y';
              return executeDockingCorrection(portId, axis, key, saved);
            });
        })
        .then(() => dockAtPlannedPort(portId, remaining - 1));
    }
    // Inside the actual diamond, request docking across the ordinary System
    // release without changing heading. This avoids committing a previous
    // north/south destination while waiting for a new heading image.
    return releaseSystemAndDock().then((dockOutcome) =>
      settleWorldCourseInterruption(dockOutcome, `port ${portId} direct dock`)
        .then((interrupted) => {
          if (interrupted)
            throw new Error(
              `Unexpected combat while docking at port ${portId}`,
            );
          return saveFromSystem();
        })
        .then((after) =>
          cy
            .writeFile(
              `${checkpointRoot}/navigation.jsonl`,
              `${JSON.stringify({
                label: `port ${portId} docking attempt`,
                before: position,
                after: after.fleets['1'].position,
                timeBefore: saved.timePassed,
                timeAfter: after.timePassed,
                key: 'e',
                renderedHeading: renderedCourseHeading(),
                dockOutcome,
                savedPortId: after.portId,
              })}\n`,
              { flag: 'a+', log: false },
            )
            .then(() => dockAtPlannedPort(portId, remaining - 1)),
        ),
    );
  });
};

const executeWorldEscape = (escape: PlannedWorldEscape, label: string) =>
  saveFromSystem().then((before) => {
    return resumeCourse(escape.key, 50)
      .then((course) =>
        settleWorldCourseInterruption(course.outcome, label).then(
          (interrupted) => {
            if (interrupted)
              throw new Error(`Unexpected combat during ${label} escape`);
            return saveFromSystem();
          },
        ),
      )
      .then((after) =>
        cy
          .writeFile(
            `${checkpointRoot}/navigation.jsonl`,
            `${JSON.stringify({
              label: `${label} route-source escape`,
              before: before.fleets['1'].position,
              after: after.fleets['1'].position,
              timeBefore: before.timePassed,
              timeAfter: after.timePassed,
              key: escape.key,
              renderedHeading: renderedCourseHeading(),
              pulse: 50,
              expectedByShippedCollision: escape.expected,
              simulatedSteps: escape.simulatedSteps,
            })}\n`,
            { flag: 'a+', log: false },
          )
          .then(() =>
            cy.document({ log: false }).then((document) => {
              if (document.querySelector('[data-test=seaStory]'))
                finishSeaEncounter();
            }),
          ),
      );
  });

const followWorldRoute = (
  toPortId: string,
  label: string,
  remainingSegments = 120,
  remainingEscapes = 8,
): Cypress.Chainable<State> => {
  if (!remainingSegments)
    return saveFromSystem().then((last) => {
      const position = last.fleets['1'].position!;
      throw new Error(
        `World route did not converge while sailing ${label}; last saved position ${position.x.toFixed(
          2,
        )},${position.y.toFixed(2)}, time ${last.timePassed}`,
      );
    });
  return readVoyageSave().then((saved) => {
    expect(saved.portId).to.be.null;
    const from = saved.fleets['1'].position!;
    return cy
      .task<PlannedWorldRoute>(
        'planWorldRoute',
        { from, toPortId },
        {
          log: false,
        },
      )
      .then((plan) => {
        if (plan.escape) {
          if (!remainingEscapes)
            return saveFromSystem().then((last) => {
              const position = last.fleets['1'].position!;
              throw new Error(
                `Could not escape route source while sailing ${label}; last saved position ${position.x.toFixed(
                  2,
                )},${position.y.toFixed(2)}, time ${last.timePassed}`,
              );
            });
          executeWorldEscape(plan.escape, label);
          return followWorldRoute(
            toPortId,
            label,
            remainingSegments - 1,
            remainingEscapes - 1,
          );
        }
        const segment = plan.route[0];
        const plannedSteps = plan.route.reduce(
          (total, [, count]) => total + count,
          0,
        );
        if (!segment || plannedSteps <= 6) {
          dockAtPlannedPort(toPortId);
          return readVoyageSave().then((docked) => {
            expect(docked.portId, `actually docked after ${label}`).to.equal(
              toPortId,
            );
            expect(docked.dayAtSea).to.equal(0);
            return docked;
          });
        }
        const [direction, count] = segment;
        const waypoint = positionAfter(from, direction, count);
        const axis = direction === 'a' || direction === 'd' ? 'x' : 'y';
        pulseToward(axis, waypoint[axis], `${label} replanned segment`);
        return followWorldRoute(
          toPortId,
          label,
          remainingSegments - 1,
          remainingEscapes,
        );
      });
  }) as unknown as Cypress.Chainable<State>;
};

const followWorldRouteToCombat = (
  to: Position,
  encounterId: string,
  label: string,
  remainingSegments = 120,
): Cypress.Chainable<State> => {
  if (!remainingSegments)
    throw new Error(`Combat route did not converge while sailing ${label}`);
  return readVoyageSave().then((saved) => {
    if (saved.activeCombat) {
      expect(saved.activeCombat.encounterId).to.equal(encounterId);
      return cy
        .get('[data-test=combat]', { log: false })
        .should('be.visible')
        .then(() => saved);
    }
    expect(saved.portId).to.be.null;
    const from = saved.fleets['1'].position!;
    return cy
      .task<PlannedWorldRoute>('planWorldRoute', { from, to }, { log: false })
      .then((plan) => {
        if (plan.escape) {
          executeWorldEscape(plan.escape, label);
          return followWorldRouteToCombat(
            to,
            encounterId,
            label,
            remainingSegments - 1,
          );
        }
        const segment = plan.route[0];
        if (!segment)
          throw new Error(
            `Reached ${to.x},${to.y} without starting ${encounterId}`,
          );
        const [direction, count] = segment;
        const waypoint = positionAfter(from, direction, count);
        const axis = direction === 'a' || direction === 'd' ? 'x' : 'y';
        pulseToward(
          axis,
          waypoint[axis],
          `${label} combat-area segment`,
          180,
          0.8,
          0,
          encounterId,
        );
        return followWorldRouteToCombat(
          to,
          encounterId,
          label,
          remainingSegments - 1,
        );
      });
  }) as unknown as Cypress.Chainable<State>;
};

export const sailPlannedRoute = (
  fromPortId: string,
  toPortId: string,
  label: string,
) =>
  readVoyageSave().then((departed) => {
    expect(departed.portId, `${label} departed ${fromPortId}`).to.be.null;
    return followWorldRoute(toPortId, label);
  });

export function sailFromCurrentPosition(toPortId: string, label: string) {
  return followWorldRoute(toPortId, label);
}

export const sailToWorldCombat = (
  to: Position,
  encounterId: string,
  label: string,
) => followWorldRouteToCombat(to, encounterId, label);

export const departFromCurrentHarbor = () => {
  cy.get('[data-test=menu]')
    .contains(/^(出航|Sail)$/)
    .click();
  cy.get('[data-test=confirmYes]').click();
  cy.get('[data-test=building]').should('not.exist');
  return readVoyageSave().then((saved) => {
    expect(saved.portId).to.be.null;
    return cy.wrap(saved, { log: false });
  });
};

const provisionColumn = { water: 2, food: 3, lumber: 4, shot: 5 } as const;

export const addHarborSupply = (
  type: keyof typeof provisionColumn,
  quantity: number,
) => {
  if (quantity <= 0) return;
  cy.get('[data-test=harborSupply] .flex.items-center.mt-2')
    .first()
    .children()
    .eq(provisionColumn[type])
    .click();
  cy.get('[data-test=inputNumberInput]').type(`${quantity}{enter}`);
};
