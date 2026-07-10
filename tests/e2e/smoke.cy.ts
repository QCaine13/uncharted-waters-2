import { characterMessageIncludes, setState } from '../utils';

describe('Production smoke', () => {
  before(() => {
    setState({ portId: '1', buildingId: '8' });
    cy.visit('');
  });

  it('loads real assets and reaches João opening dialogue', () => {
    cy.contains('Game is loading...').should('not.exist');
    cy.get('#camera').should('exist');
    characterMessageIncludes('Father, did you send for me?', 2);
  });
});
