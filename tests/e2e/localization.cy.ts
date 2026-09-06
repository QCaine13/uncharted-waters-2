import { SAVED_STATE_KEY } from '../../src/state/state';
import { clickMenu, clickMenu2, setState } from '../utils';

const visitWithoutLocale = () =>
  cy.visit('', {
    onBeforeLoad(window) {
      window.localStorage.removeItem('uw2.locale');
    },
  });

describe('Chinese-first localization', () => {
  it('starts in Chinese and presents the homepage, HUD, port and building copy', () => {
    setState({
      portId: '1',
      buildingId: '1',
      gold: 5000,
      quests: ['houseBeforeQuest', 'shipyardAfterQuest'],
    });
    visitWithoutLocale();

    cy.contains('游戏加载中……').should('not.exist');
    cy.get('html').should('have.attr', 'lang', 'zh-CN');
    cy.contains('关于').should('exist');
    cy.contains('里斯本').should('be.visible');
    cy.get('[data-test=vendorMessageBox]').should(
      'include.text',
      '欢迎来到交易所',
    );
    cy.get('[data-test=menu]').should('include.text', '购买商品');
    cy.get('[data-test=calendarDate]').should(($date) => {
      expect($date[0].scrollWidth).to.be.at.most($date[0].clientWidth);
    });
  });

  it('switches languages without changing play state and persists the choice', () => {
    setState({
      portId: '1',
      buildingId: '1',
      gold: 5000,
      quests: ['houseBeforeQuest', 'shipyardAfterQuest'],
    });
    visitWithoutLocale();
    cy.contains('系统').click();
    cy.get('#locale-select').should('have.value', 'zh-CN');

    cy.window().then((window) => {
      const before = window.localStorage.getItem(SAVED_STATE_KEY);
      cy.get('#locale-select').select('English');
      cy.wrap(before).as('savedBeforeSwitch');
    });

    cy.contains('System').should('be.visible');
    cy.get('[data-test=vendorMessageBox]').should(
      'include.text',
      'Welcome to the market',
    );
    cy.window().then((window) => {
      expect(window.localStorage.getItem('uw2.locale')).to.equal('en');
      cy.get('@savedBeforeSwitch').then((saved) => {
        expect(window.localStorage.getItem(SAVED_STATE_KEY)).to.equal(saved);
      });
    });

    cy.reload();
    cy.get('html').should('have.attr', 'lang', 'en');
    cy.contains('Lisbon').should('be.visible');
  });

  it('isolates language-select keys and preserves a literal custom ship name', () => {
    setState({
      portId: '2',
      buildingId: '3',
      fleets: {
        '1': {
          position: { x: 100, y: 100 },
          ships: [
            {
              id: '6',
              name: 'Flagship',
              crew: 11,
              cargo: [],
              durability: 25,
            },
            {
              id: '6',
              name: 'System',
              crew: 11,
              cargo: [],
              durability: 25,
            },
          ],
        },
      },
      mates: [{ sailorId: '1', role: 0 }],
    });
    visitWithoutLocale();
    cy.contains('系统').click();
    cy.get('#locale-select').focus().type('{downArrow}{enter}');
    cy.get('[data-test=vendorMessageBox]').should(
      'include.text',
      '来船厂有什么事？',
    );
    cy.get('#locale-select').select('English');
    cy.get('[data-test=vendorMessageBox]').should(
      'include.text',
      'What brings you to this shipyard?',
    );
    cy.get('#locale-select').select('简体中文');
    cy.get('[data-test=vendorMessageBox]').should(
      'include.text',
      '来船厂有什么事？',
    );
    cy.get('.fixed.inset-0').click('topRight');
    cy.get('[data-test=vendorMessageBox]').should(
      'include.text',
      '来船厂有什么事？',
    );
    cy.get('[data-test=menu]').contains('出售').click();
    cy.get('[data-test=menu2]').should('include.text', 'System');
    cy.get('[data-test=menu2]').should('not.include.text', '系统');
  });

  it('keeps a Chinese sea save playable across reload', () => {
    setState({
      portId: null,
      buildingId: null,
      timePassed: 1421,
      dayAtSea: 4,
      fleets: {
        '1': {
          position: { x: 100, y: 100 },
          ships: [
            {
              id: '6',
              name: 'Hermes II',
              crew: 11,
              cargo: [
                { type: 'water', quantity: 8 },
                { type: 'food', quantity: 8 },
              ],
              durability: 25,
            },
          ],
        },
      },
      mates: [{ sailorId: '1', role: 0 }],
    });
    visitWithoutLocale();
    cy.get('[data-test=dayAtSea]').should('include.text', '航海第 5 天');
    cy.get('[data-test=provisions]').should('include.text', '补给');
    cy.reload();
    cy.get('html').should('have.attr', 'lang', 'zh-CN');
    cy.get('[data-test=dayAtSea]').should('include.text', '航海第 5 天');
  });

  it('buys and sells real market goods through the Chinese UI', () => {
    setState({
      portId: '1',
      buildingId: '1',
      gold: 5000,
      quests: ['houseBeforeQuest', 'shipyardAfterQuest'],
      fleets: {
        '1': {
          position: undefined,
          ships: [
            {
              id: '6',
              name: 'Hermes II',
              crew: 10,
              cargo: [{ type: '19', quantity: 108 }],
              durability: 25,
            },
          ],
        },
      },
    });
    visitWithoutLocale();
    clickMenu('购买商品');
    clickMenu2('葡萄酒');
    cy.get('[data-test=vendorMessageBox]').should(
      'include.text',
      '葡萄酒每份 47 金币。要多少？',
    );
    clickMenu2('1');
    cy.get('[data-test=confirmYes]').click();
    cy.get('[data-test=left]').should('include.text', '4953');

    cy.get('[data-test=building]').rightclick();
    clickMenu('出售商品');
    clickMenu2('葡萄酒');
    clickMenu2('1');
    cy.get('[data-test=confirmYes]').click();
    cy.get('[data-test=left]').should('include.text', '4991');
    cy.get('[data-test=menu2]').should('not.include.text', '葡萄酒');
  });
});
