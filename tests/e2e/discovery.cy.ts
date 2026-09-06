import { landmarks } from '../../src/data/discoveryData';
import { goldIs, setState } from '../utils';

const capeOfGoodHope = landmarks.find((l) => l.id === 'cape-of-good-hope')!;
const azores = landmarks.find((l) => l.id === 'azores')!;

const SEA_SAVE_TIME = 240;

const indicatorsAreInitialized = () => {
  cy.contains('Wind')
    .parent()
    .find('img')
    .should('have.attr', 'src')
    .and('not.be.empty');
  cy.contains('Current')
    .parent()
    .find('img')
    .should('have.attr', 'src')
    .and('not.be.empty');
};

describe('Discovery', () => {
  it('shows previously discovered landmarks in the list and their fame in the HUD', () => {
    setState({
      portId: null,
      buildingId: null,
      timePassed: SEA_SAVE_TIME,
      dayAtSea: 3,
      fleets: {
        '1': {
          // Far from all fourteen landmarks (nearest is >300 units away),
          // so sitting here for the length of this test cannot trigger a
          // fresh discovery and disturb the seeded totals below.
          position: { x: 300, y: 300 },
          ships: [
            {
              id: '6',
              name: 'Flagship',
              crew: 20,
              cargo: [
                { type: 'water', quantity: 20 },
                { type: 'food', quantity: 20 },
              ],
              durability: 25,
            },
          ],
        },
      },
      mates: [{ sailorId: '1', role: 0 }],
      discoveries: [capeOfGoodHope.id, azores.id],
      fame: {
        adventure: capeOfGoodHope.fame + azores.fame,
        pirate: 0,
        trade: 0,
      },
      gold: 5000,
    });
    cy.visit('');

    cy.contains('Game is loading...').should('not.exist');
    indicatorsAreInitialized();

    cy.reload();
    cy.contains('Game is loading...').should('not.exist');
    indicatorsAreInitialized();

    goldIs(5000);
    cy.get('[data-test=fame-adventure]').should(
      'have.text',
      String(capeOfGoodHope.fame + azores.fame),
    );
    cy.get('[data-test=fame-pirate]').should('have.text', '0');
    cy.get('[data-test=fame-trade]').should('have.text', '0');

    cy.contains('Discoveries').click();
    cy.contains(capeOfGoodHope.name).should('exist');
    cy.contains(azores.name).should('exist');

    // Discovery order (Cape of Good Hope first) drives the default detail.
    cy.get('[data-test=left]').should(
      'include.text',
      `Unreported — ${capeOfGoodHope.gold}g pending at Lisbon Guild`,
    );
    cy.get('[data-test=left]').should('include.text', '34.4° S');
    cy.get('[data-test=left]').should('include.text', '18.5° E');
  });

  // This is the test that caught the position-sync gap: sailing moved the
  // ship on screen, but state.fleets['1'].position — the only thing the
  // discovery check reads — was written solely by dock(), so detection kept
  // testing the departure point forever. worldCharacters.update() now
  // publishes the committed tile position every tick. Keep this driving real
  // movement rather than setting the position directly; setting it is
  // exactly what let the gap survive C1's own tests.
  it('discovers a landmark by sailing into it through the real UI, showing the banner and raising fame live', () => {
    setState({
      portId: null,
      buildingId: null,
      timePassed: SEA_SAVE_TIME,
      dayAtSea: 0,
      fleets: {
        '1': {
          // Due north of Cape of Good Hope, (radius + 3) units outside its
          // discovery circle so the fleet starts undiscovered and only has
          // to close a small gap.
          position: {
            x: capeOfGoodHope.position.x,
            y: capeOfGoodHope.position.y - (capeOfGoodHope.radius + 3),
          },
          ships: [
            {
              // Light Galley: has oars, so its wind speed is floored at 3
              // regardless of the real (randomised) wind roll, and its 100
              // tacking means no headwind penalty either — sailing speed
              // here is reliable regardless of which way the wind blows.
              id: '19',
              name: 'Flagship',
              crew: 10,
              cargo: [
                { type: 'water', quantity: 10 },
                { type: 'food', quantity: 10 },
              ],
              durability: 25,
            },
          ],
        },
      },
      mates: [{ sailorId: '1', role: 0 }],
      discoveries: [],
      fame: { adventure: 0, pirate: 0, trade: 0 },
      gold: 1000,
    });
    cy.visit('');

    cy.contains('Game is loading...').should('not.exist');
    cy.get('[data-test=fame-adventure]').should('have.text', '0');
    cy.get('[data-test=discoveryBanner]').should('have.text', '');

    // Hold south. worldCharacters.ts keeps the last heading even after the
    // key is released, so a single keydown is enough to sail continuously.
    cy.document().trigger('keydown', { key: 's' });

    cy.get('[data-test=discoveryBanner]', { timeout: 15000 }).should(
      'have.text',
      `Discovered: ${capeOfGoodHope.name} — +${capeOfGoodHope.fame} adventure fame; report for ${capeOfGoodHope.gold}g`,
    );
    cy.get('[data-test=fame-adventure]').should(
      'have.text',
      String(capeOfGoodHope.fame),
    );
    goldIs(1000);
  });

  // The next-closest reachable equivalent: a fresh, not-yet-discovered
  // landmark the fleet is already sitting on. This still exercises the real
  // production path end to end — the actual game loop's own worldTimeTick,
  // not a direct function call — for everything downstream of "the position
  // check passes", which is the part this slice owns. What it does not
  // cover is the sailing motion itself, for the reason explained on the
  // skipped test above.
  it('discovers a landmark the instant a fresh sea save starts within its radius, showing the banner and raising fame live', () => {
    setState({
      portId: null,
      buildingId: null,
      timePassed: SEA_SAVE_TIME,
      dayAtSea: 0,
      fleets: {
        '1': {
          position: { ...capeOfGoodHope.position },
          ships: [
            {
              id: '6',
              name: 'Flagship',
              crew: 20,
              cargo: [
                { type: 'water', quantity: 20 },
                { type: 'food', quantity: 20 },
              ],
              durability: 25,
            },
          ],
        },
      },
      mates: [{ sailorId: '1', role: 0 }],
      discoveries: [],
      fame: { adventure: 0, pirate: 0, trade: 0 },
      gold: 1000,
    });
    cy.visit('');

    cy.contains('Game is loading...').should('not.exist');

    // No input at all: the production game loop's own worldTimeTick (driven
    // by requestAnimationFrame) reaches the discovery check on its own.
    // Cypress's ordinary should() retry is the only polling involved.
    cy.get('[data-test=discoveryBanner]').should(
      'have.text',
      `Discovered: ${capeOfGoodHope.name} — +${capeOfGoodHope.fame} adventure fame; report for ${capeOfGoodHope.gold}g`,
    );
    cy.get('[data-test=fame-adventure]').should(
      'have.text',
      String(capeOfGoodHope.fame),
    );
    goldIs(1000);
  });
});
