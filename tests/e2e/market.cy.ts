import {
  clickMenu,
  clickMenu2,
  goldIs,
  setState,
  vendorMessageIncludes,
} from '../utils';

describe('Market', () => {
  it('buying a good raises its displayed price index, and selling it back never nets more gold', () => {
    setState({
      portId: '1', // Lisbon, Iberia market
      buildingId: '1',
      gold: 5000,
      // Clears the Market's own ambient story lines (blocked by
      // houseBeforeQuest / shipyardAfterQuest respectively) so the plain
      // vendor menu renders instead of quest dialogue.
      quests: ['houseBeforeQuest', 'shipyardAfterQuest'],
      fleets: {
        '1': {
          position: undefined,
          ships: [
            {
              id: '6',
              name: 'Flagship',
              crew: 10,
              // Leaves exactly two cargo slots free (120 capacity - 10
              // minimumCrew - 108 used). Buying 1 unit still leaves space,
              // so the buy menu doesn't flip to "no cargo space available"
              // after the purchase.
              cargo: [{ type: '19', quantity: 108 }],
              durability: 25,
            },
          ],
        },
      },
    });
    cy.visit('');

    vendorMessageIncludes('Welcome to the market. What can I do for you?');
    goldIs(5000);

    clickMenu('Buy Goods');
    vendorMessageIncludes('Take a look at our wares.');

    // Wine is an Iberian supply good, starting at the default (100%) index.
    cy.get('[data-test=menu2]').should('include.text', 'Wine (47g) 100% *');

    clickMenu2('Wine');
    vendorMessageIncludes('Wine at 47g each. How many?');

    clickMenu2('1');
    vendorMessageIncludes('1 Wine for 47g. Deal?');

    cy.get('[data-test=confirmYes]').click();
    goldIs(4953);
    vendorMessageIncludes('Anything else catch your eye?');

    // The purchase raised Wine's index by one point; the buy menu reflects
    // the new (regressed-from-100) index live, with an up arrow.
    cy.get('[data-test=menu2]').should('include.text', 'Wine (47g) ▲101% *');

    cy.get('[data-test=building]').rightclick();
    vendorMessageIncludes('Welcome to the market. What can I do for you?');

    clickMenu('Sell Goods');
    vendorMessageIncludes('What are you selling?');

    cy.get('[data-test=menu2]').should('include.text', 'Wine x1 (38g) ▲101%');

    clickMenu2('Wine');
    vendorMessageIncludes('Wine at 38g each. How many?');

    clickMenu2('1');
    vendorMessageIncludes('1 Wine for 38g. Deal?');

    cy.get('[data-test=confirmYes]').click();

    // Same-port round trip: bought at 47g, sold back at 38g. Gold falls; it
    // never rises.
    goldIs(4991);
    vendorMessageIncludes('Got anything else?');
    cy.get('[data-test=menu2]').should('not.include.text', 'Wine');
  });
});
