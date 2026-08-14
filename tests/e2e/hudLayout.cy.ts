import { setState } from '../utils';

/*
  The HUD columns flank a game view that is a fixed 800px tall, and the page
  continues directly below the frame. A column that outgrows the frame spills
  onto that page content — which is what happened as readouts were added to
  the left column one feature at a time, each one individually small.

  These specs are the budget: whatever goes in the column has to fit beside
  the game, in both the states the column renders.
 */
const FRAME_HEIGHT = 800;

// worldTimeTick only sets state.wind on a multiple-of-240 tick, and a sea save
// that loads off that multiple reads state.wind while it is still undefined;
// see the note in discovery.cy.ts.
const SAFE_TIME_PASSED = 220;

const fitsTheFrame = (selector: string) =>
  cy.get(selector).should(($el) => {
    expect($el[0].getBoundingClientRect().height).to.be.at.most(FRAME_HEIGHT);
  });

/*
  The column is pinned to the frame height, so measuring it alone would pass
  no matter how much is crammed inside. This is the assertion that bites: the
  readouts are the part that scrolls when they no longer fit, and in an
  ordinary state they should not be scrolling at all.
 */
const readoutsFitWithoutScrolling = () =>
  cy.get('[data-test=hudReadouts]').should(($el) => {
    expect($el[0].scrollHeight).to.be.at.most($el[0].clientHeight);
  });

describe('HUD layout', () => {
  it('keeps both columns inside the frame at sea, provisions and all', () => {
    setState({
      portId: null,
      buildingId: null,
      timePassed: SAFE_TIME_PASSED,
      dayAtSea: 4,
      fleets: {
        '1': {
          position: { x: 300, y: 300 },
          ships: [
            {
              id: '6',
              name: 'Flagship',
              crew: 11,
              cargo: [
                { type: 'water', quantity: 8 },
                { type: 'food', quantity: 8 },
                { type: 'lumber', quantity: 4 },
                { type: 'shot', quantity: 12 },
              ],
              durability: 25,
            },
          ],
        },
      },
      mates: [{ sailorId: '1', role: 0 }],
      gold: 5000,
    });
    cy.visit('');

    cy.contains('Game is loading...').should('not.exist');

    // The provisions block is the tallest thing in the column and only renders
    // at sea, so the sea state is the one that has to be measured.
    cy.get('[data-test=provisions]').should('be.visible');
    fitsTheFrame('[data-test=left]');
    readoutsFitWithoutScrolling();

    // The right column has no height of its own — it is stretched to match the
    // left. It went along for the ride when the left column grew, and the wind
    // and current dials centre themselves in whatever height it ends up with,
    // so they were being centred below the frame.
    fitsTheFrame('[data-test=right]');

    // The bottom of the column is the part that spilled, and the menu that
    // lives there has to stay reachable rather than being pushed off the frame.
    cy.contains('System').should('be.visible');
    cy.contains('Discoveries').should('be.visible');
  });

  it('keeps the column inside the frame in port, where the menu is longest', () => {
    setState({
      portId: '2',
      buildingId: null,
      timePassed: 1420,
      gold: 5000,
      fleets: {
        '1': {
          position: { x: 100, y: 100 },
          ships: [
            {
              id: '6',
              name: 'Flagship',
              crew: 11,
              cargo: [{ type: 'water', quantity: 8 }],
              durability: 25,
            },
          ],
        },
      },
      mates: [{ sailorId: '1', role: 0 }],
    });
    cy.visit('');

    cy.contains('Game is loading...').should('not.exist');

    // In port the provisions block is hidden but Mates/Fleet/Items appear,
    // which is a taller menu than the sea state carries.
    cy.contains('Mates').should('be.visible');
    fitsTheFrame('[data-test=left]');
    readoutsFitWithoutScrolling();
    cy.contains('System').should('be.visible');
  });
});
