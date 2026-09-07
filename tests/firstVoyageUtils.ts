import { SAVED_STATE_KEY, type State } from '../src/state/state';

export const readVoyageSave = () =>
  cy.window().then((window) => {
    const raw = window.localStorage.getItem(SAVED_STATE_KEY);
    expect(raw).not.to.be.null;
    return JSON.parse(raw!) as State & { version: number };
  });

// These helpers use normal player controls. Storage is only read to measure
// movement; the fresh journey never teleports or injects runtime state.
export const saveFromSystem = () => {
  cy.document().then((document) => {
    if (!document.getElementById('locale-select')) {
      // The game is followed by a long homepage. Re-anchor the document before
      // opening a bottom-anchored HUD item so Cypress does not scroll the
      // trigger while sampling its position during a port/world remount.
      cy.scrollTo('top', { ensureScrollable: false });
      cy.contains('[data-test=left] div', /^(系统|System)$/)
        .should('be.visible')
        .click({ scrollBehavior: false });
    }
  });
  cy.contains('button', /^(保存|Save)$/).click();
  return readVoyageSave();
};

export const closeSidebar = (settleMs = 160) => {
  cy.document().trigger('keydown', { key: 'Escape' });
  cy.document().trigger('keyup', { key: 'Escape' });
  cy.get('#locale-select').should('not.exist');
  if (settleMs) cy.wait(settleMs, { log: false });
};

export const finishSeaEncounter = (
  choice: 'Yes' | 'No' = 'Yes',
  remaining = 30,
): Cypress.Chainable<void> => {
  if (!remaining) throw new Error('Sea encounter did not finish');
  return cy.document().then((document) => {
    const story = document.querySelector('[data-test=seaStory]');
    if (!story) return;
    const before = story.textContent;
    if (story.querySelector('[data-test=confirmYes]')) {
      cy.get(`[data-test=seaStory] [data-test=confirm${choice}]`).click();
    } else {
      cy.get('[data-test=seaStory]').click();
    }
    cy.document().should((next) => {
      expect(
        next.querySelector('[data-test=seaStory]')?.textContent,
      ).not.to.equal(before);
    });
    return finishSeaEncounter(choice, remaining - 1);
  });
};

const resumeCourse = (key: string) => {
  // Steer as soon as React releases the pause, before a Cypress
  // assertion can let the ship drift along its previous heading.
  cy.document().then(
    (document) =>
      new Cypress.Promise<void>((resolve) => {
        const window = document.defaultView!;
        document.dispatchEvent(
          new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        );
        document.dispatchEvent(
          new window.KeyboardEvent('keyup', { key: 'Escape', bubbles: true }),
        );
        window.setTimeout(() => {
          document.dispatchEvent(
            new window.KeyboardEvent('keydown', { key, bubbles: true }),
          );
          resolve();
        }, 0);
      }),
  );
  cy.get('#locale-select').should('not.exist');
};

export const sailToCoordinate = (
  axis: 'x' | 'y',
  target: number,
  remaining = 100,
): Cypress.Chainable<void> => {
  if (!remaining) throw new Error(`Could not sail to ${axis}=${target}`);
  return saveFromSystem().then((saved) => {
    expect(saved.portId, 'fleet remains at sea').to.be.null;
    const position = saved.fleets['1'].position!;
    const delta = target - position[axis];
    cy.writeFile(
      'tests/screenshots/m1-navigation.json',
      { axis, target, position, dayAtSea: saved.dayAtSea, remaining },
      { log: false },
    );
    cy.log(
      `sail ${axis}=${target}: ${position.x.toFixed(2)},${position.y.toFixed(
        2,
      )} day ${saved.dayAtSea}`,
    );
    return cy.document().then((document) => {
      if (document.querySelector('[data-test=seaStory]')) {
        closeSidebar();
        finishSeaEncounter();
        return sailToCoordinate(axis, target, remaining - 1);
      }
      if (Math.abs(delta) <= 0.8) return;
      const key =
        axis === 'x' ? (delta > 0 ? 'd' : 'a') : delta > 0 ? 's' : 'w';
      resumeCourse(key);
      cy.wait(Math.abs(delta) > 3 ? 350 : 100, { log: false });
      cy.document().trigger('keyup', { key });
      return sailToCoordinate(axis, target, remaining - 1);
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
const dockAtLisbon = (remaining = 20): Cypress.Chainable<void> => {
  if (!remaining) throw new Error('Could not enter Lisbon harbor');
  return saveFromSystem().then((saved) => {
    if (saved.portId === '1') {
      closeSidebar();
      return;
    }
    return cy.document().then((document) => {
      if (document.querySelector('[data-test=seaStory]')) {
        closeSidebar();
        finishSeaEncounter();
        return dockAtLisbon(remaining - 1);
      }
      if (!saved.storyEvents.includes('joao.first-voyage.domingo-met')) {
        resumeCourse('d');
        cy.wait(600, { log: false });
        return dockAtLisbon(remaining - 1);
      }
      const { x, y } = saved.fleets['1'].position!;
      resumeCourse(x < 838 ? 'd' : y < 358 ? 's' : 'w');
      cy.document().trigger('keydown', { key: 'e' });
      cy.document().trigger('keyup', { key: 'e' });
      cy.wait(150, { log: false });
      return dockAtLisbon(remaining - 1);
    });
  });
};
