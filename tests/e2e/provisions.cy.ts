import { SAVED_STATE_KEY } from '../../src/state/state';
import { setState } from '../utils';

const setAtSeaState = (quantity: number) =>
  setState({
    portId: null,
    buildingId: null,
    timePassed: 1420,
    dayAtSea: 4,
    fleets: {
      '1': {
        position: { x: 100, y: 100 },
        ships: [
          {
            id: '6',
            name: 'Flagship',
            crew: 11,
            cargo: [
              { type: 'water', quantity },
              { type: 'food', quantity },
              { type: 'lumber', quantity: 4 },
            ],
            durability: 25,
          },
        ],
      },
    },
    mates: [{ sailorId: '1', role: 0 }],
  });

describe('Daily provisions', () => {
  it('consumes rounded fleet provisions, saves, and reloads the low warning', () => {
    setAtSeaState(8);
    cy.visit('');

    cy.contains('Game is loading...').should('not.exist');
    cy.get('[data-test=dayAtSea]').should('have.text', 'Day 5');
    cy.get('[data-test=provision-water]').should('have.text', '6');
    cy.get('[data-test=provision-food]').should('have.text', '6');
    cy.get('[data-test=provisionStatus]')
      .should('have.text', 'Only 3 days remaining')
      .and('have.class', 'text-orange-500');

    cy.window().should((win) => {
      const saved = JSON.parse(win.localStorage.getItem(SAVED_STATE_KEY)!);
      expect(saved.dayAtSea).to.equal(5);
      expect(saved.timePassed).to.equal(1440);
      expect(saved.fleets['1'].ships[0].cargo).to.deep.equal([
        { type: 'water', quantity: 6 },
        { type: 'food', quantity: 6 },
        { type: 'lumber', quantity: 4 },
      ]);
    });

    cy.reload();
    cy.get('[data-test=dayAtSea]').should('have.text', 'Day 5');
    cy.get('[data-test=provision-water]').should('have.text', '6');
    cy.get('[data-test=provisionStatus]').should(
      'have.text',
      'Only 3 days remaining',
    );
  });

  it('clamps insufficient provisions to zero and shows exhausted', () => {
    setAtSeaState(1);
    cy.visit('');

    cy.contains('Game is loading...').should('not.exist');
    cy.get('[data-test=dayAtSea]').should('have.text', 'Day 5');
    cy.get('[data-test=provision-water]').should('have.text', '0');
    cy.get('[data-test=provision-food]').should('have.text', '0');
    cy.get('[data-test=provisionStatus]')
      .should('have.text', 'Supplies exhausted')
      .and('have.class', 'text-red-600');
  });
});
