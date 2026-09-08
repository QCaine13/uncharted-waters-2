import { SAVED_STATE_KEY, type State } from '../../src/state/state';
import { SAVE_VERSION } from '../../src/state/saveLoad';
import { clickMenu, clickMenu2, setState } from '../utils';
import {
  closeSidebar,
  finishSeaEncounter,
  readVoyageSave,
  resumeCourse,
  saveFromSystem,
  sailToCoordinate,
  sailLisbonToGibraltar,
  sailGibraltarToLisbon,
} from '../firstVoyageUtils';

const opening: State['quests'] = [
  'houseBeforeQuest',
  'pubBeforeQuest',
  'pubAfterQuest',
  'itemShopAfterQuest',
  'shipyardAfterQuest',
  'churchBeforeQuest',
  'churchAfterQuest',
  'churchAfterEnrico',
  'houseAfterQuestAndPub',
  'harborFinal',
];
const arc = 'joao.first-voyage.';
const fixtureState = (overrides: Partial<State> = {}): Partial<State> => ({
  portId: null,
  buildingId: null,
  timePassed: 4560,
  dayAtSea: 3,
  quests: opening,
  storyEvents: [
    'joao.lisbon-opening.harbor-final',
    `${arc}commission-accepted`,
  ],
  gold: 1000,
  discoveries: [],
  reportedDiscoveries: [],
  fame: { adventure: 0, pirate: 0, trade: 0 },
  mates: [
    { sailorId: '1', role: 0 },
    { sailorId: '32', role: null },
    { sailorId: '33', role: null },
  ],
  fleets: {
    '1': {
      position: { x: 835, y: 376 },
      ships: [
        {
          id: '6',
          name: 'Hermes II',
          crew: 10,
          durability: 25,
          cargo: [
            { type: 'water', quantity: 30 },
            { type: 'food', quantity: 30 },
          ],
        },
      ],
    },
  },
  ...overrides,
});
const fixture = (overrides: Partial<State> = {}) =>
  setState(fixtureState(overrides));

const advanceBuilding = (
  settled: (document: Document) => boolean,
  remaining = 30,
): Cypress.Chainable<Document> => {
  if (!remaining) throw new Error('Guild dialogue did not settle');
  return cy.document().then((document) => {
    if (settled(document)) return;
    const before = document.querySelector('[data-test=building]')?.textContent;
    cy.get('[data-test=building]').click();
    cy.document().should((next) =>
      expect(
        settled(next) ||
          next.querySelector('[data-test=building]')?.textContent !== before,
      ).to.equal(true),
    );
    return advanceBuilding(settled, remaining - 1);
  }) as unknown as Cypress.Chainable<Document>;
};
const toChoice = () =>
  advanceBuilding(
    (document) => !!document.querySelector('[data-test=confirmYes]'),
  );
const toMenu = () =>
  advanceBuilding((document) => {
    const menu = document.querySelector('[data-test=menu]');
    return !!menu && !menu.classList.contains('hidden');
  });

describe('First voyage chapter compatibility and choices', () => {
  const branchTest = it;
  branchTest(
    'surfaces a day-three sea story that interrupts an accepted course',
    () => {
      const frozen = fixtureState({
        timePassed: 3600,
        dayAtSea: 2,
        fleets: {
          '1': {
            position: { x: 858, y: 376 },
            ships: [
              {
                id: '6',
                name: 'Hermes II',
                crew: 10,
                durability: 25,
                cargo: [
                  { type: 'water', quantity: 30 },
                  { type: 'food', quantity: 30 },
                ],
              },
            ],
          },
        },
      });
      cy.visit('', {
        onBeforeLoad(window) {
          window.localStorage.setItem(
            SAVED_STATE_KEY,
            JSON.stringify({ version: SAVE_VERSION, ...frozen }),
          );
          window.localStorage.setItem('uw2.locale', 'en');
          window.localStorage.setItem('uw2.e2e.locale', 'en');
        },
      });
      saveFromSystem().then((before) => {
        expect(before.dayAtSea).to.equal(2);
        expect(before.storyEvents).not.to.include(`${arc}domingo-met`);
      });
      resumeCourse('a', 5000).then((interrupted) => {
        expect(interrupted.outcome).to.equal('seaStory');
        expect(interrupted.stage).to.equal('interruption');
      });
      cy.get('[data-test=seaStory]').should(
        'include.text',
        'Three days at sea',
      );
      saveFromSystem();
      resumeCourse('a').then((pausedStory) => {
        expect(pausedStory.outcome).to.equal('seaStory');
        expect(pausedStory.stage).to.equal('interruption');
      });
      cy.get('[data-test=seaStory]').should(
        'include.text',
        'Three days at sea',
      );
      finishSeaEncounter();
      saveFromSystem().then((afterStory) => {
        expect(afterStory.storyEvents).to.include(`${arc}domingo-met`);
        expect(afterStory.storyEvents).to.include(`${arc}domingo-recruited`);
      });
      resumeCourse('a', 50).then((continued) => {
        expect(continued.outcome).to.equal('heading');
      });
      readVoyageSave().then((continued) => {
        expect(continued.portId).to.be.null;
        expect(continued.storyEvents).to.include(`${arc}domingo-met`);
      });
    },
  );

  branchTest(
    'uses an ordinary coast correction after five saved stalls',
    () => {
      const start = { x: 857.3516666666662, y: 379 };
      const frozen = fixtureState({
        timePassed: 6000,
        dayAtSea: 4,
        storyEvents: [
          'joao.lisbon-opening.harbor-final',
          `${arc}commission-accepted`,
          `${arc}domingo-met`,
          `${arc}domingo-recruited`,
        ],
        discoveries: ['strait-of-gibraltar'],
        fleets: {
          '1': {
            position: start,
            ships: [
              {
                id: '6',
                name: 'Hermes II',
                crew: 10,
                durability: 25,
                cargo: [
                  { type: 'water', quantity: 30 },
                  { type: 'food', quantity: 30 },
                ],
              },
            ],
          },
        },
      });
      cy.visit('', {
        onBeforeLoad(window) {
          window.localStorage.setItem(
            SAVED_STATE_KEY,
            JSON.stringify({ version: SAVE_VERSION, ...frozen }),
          );
          window.localStorage.setItem('uw2.locale', 'en');
          window.localStorage.setItem('uw2.e2e.locale', 'en');
        },
      });
      saveFromSystem().then((before) => {
        expect(before.portId).to.be.null;
        expect(before.fleets['1'].position).to.deep.equal(start);
      });
      sailToCoordinate('y', 376);
      saveFromSystem().then((after) => {
        const position = after.fleets['1'].position!;
        expect(after.portId).to.be.null;
        expect(Math.abs(position.y - 376)).to.be.at.most(0.8);
        expect(
          position.x,
          'ordinary correction changed the blocked x',
        ).to.be.lessThan(start.x);
        const flagship = after.fleets['1'].ships[0];
        expect(
          flagship.cargo.find(({ type }) => type === 'water')!.quantity,
        ).to.be.greaterThan(0);
        expect(
          flagship.cargo.find(({ type }) => type === 'food')!.quantity,
        ).to.be.greaterThan(0);
      });
    },
  );

  branchTest(
    'rejects a shallow opening and takes the collision-safe eastbound corridor',
    () => {
      const start = { x: 836, y: 373.9912500000004 };
      const frozen = fixtureState({
        timePassed: 7200,
        dayAtSea: 5,
        storyEvents: [
          'joao.lisbon-opening.harbor-final',
          `${arc}commission-accepted`,
          `${arc}domingo-met`,
          `${arc}domingo-recruited`,
        ],
        discoveries: ['strait-of-gibraltar'],
        fleets: {
          '1': {
            position: start,
            ships: [
              {
                id: '6',
                name: 'Hermes II',
                crew: 10,
                durability: 25,
                cargo: [
                  { type: 'water', quantity: 30 },
                  { type: 'food', quantity: 30 },
                ],
              },
            ],
          },
        },
      });
      cy.visit('', {
        onBeforeLoad(window) {
          window.localStorage.setItem(
            SAVED_STATE_KEY,
            JSON.stringify({ version: SAVE_VERSION, ...frozen }),
          );
          window.localStorage.setItem('uw2.locale', 'en');
          window.localStorage.setItem('uw2.e2e.locale', 'en');
        },
      });
      saveFromSystem().then((before) => {
        expect(before.portId).to.be.null;
        expect(before.fleets['1'].position).to.deep.equal(start);
      });
      sailToCoordinate('x', 856);
      saveFromSystem().then((after) => {
        const position = after.fleets['1'].position!;
        expect(after.portId).to.be.null;
        expect(Math.abs(position.x - 856)).to.be.at.most(0.8);
        expect(
          position.y,
          'ordinary correction entered the safe southern corridor',
        ).to.be.greaterThan(374);
        const flagship = after.fleets['1'].ships[0];
        expect(
          flagship.cargo.find(({ type }) => type === 'water')!.quantity,
        ).to.be.greaterThan(0);
        expect(
          flagship.cargo.find(({ type }) => type === 'food')!.quantity,
        ).to.be.greaterThan(0);
      });
    },
  );

  branchTest(
    'reopens the System panel during repeated navigation pauses',
    () => {
      fixture({ dayAtSea: 0, timePassed: 220 });
      cy.visit('');
      cy.scrollTo(0, 650);
      cy.window().its('scrollY').should('be.greaterThan', 500);
      for (let i = 0; i < 25; i += 1) {
        saveFromSystem();
        closeSidebar(0);
      }
      saveFromSystem();
      cy.get('#locale-select').should('be.visible');
    },
  );
  branchTest(
    'pauses a Chinese sea encounter, restarts on load, and allows refusal then guild recruitment and one payout',
    () => {
      fixture();
      cy.visit('', {
        onBeforeLoad(window) {
          window.localStorage.setItem('uw2.locale', 'zh-CN');
          window.localStorage.setItem('uw2.e2e.locale', 'zh-CN');
        },
      });
      cy.get('[data-test=seaStory]').should('include.text', '出海三天了');
      saveFromSystem().then((before) => {
        cy.wait(600);
        saveFromSystem().then((after) => {
          expect(after.timePassed).to.equal(before.timePassed);
          expect(after.fleets).to.deep.equal(before.fleets);
        });
      });
      cy.get('#locale-select').select('en');
      cy.get('[data-test=seaStory]').should(
        'include.text',
        'Three days at sea',
      );
      cy.get('#locale-select').select('zh-CN');
      closeSidebar();
      cy.get('[data-test=seaStory]').click();
      cy.get('[data-test=seaStory]').should('include.text', '你是谁');
      saveFromSystem();
      cy.contains('button', /^读取$/).click();
      cy.get('[data-test=seaStory]').should('include.text', '出海三天了');
      // A successful load remounts and dismisses the old System popover.
      cy.get('#locale-select').should('not.exist');
      finishSeaEncounter('No');
      saveFromSystem().then((saved) => {
        expect(saved.storyEvents)
          .to.include(`${arc}domingo-met`)
          .and.not.include(`${arc}domingo-recruited`);
        expect(saved.mates).to.have.length(3);
        setState({
          ...saved,
          portId: '1',
          buildingId: '7',
          dayAtSea: 0,
          discoveries: ['strait-of-gibraltar'],
          fame: { adventure: 30, pirate: 0, trade: 0 },
        });
      });
      cy.reload();
      cy.get('[data-test=building]').should('include.text', '又见面了');
      toChoice();
      cy.get('[data-test=confirmYes]').click();
      toMenu();
      clickMenu('上报发现');
      cy.get('[data-test=building]').should(
        'include.text',
        '你的直布罗陀海峡图',
      );
      toMenu();
      readVoyageSave().then((saved) => {
        expect(saved.gold).to.equal(1800);
        expect(saved.reportedDiscoveries).to.deep.equal([
          'strait-of-gibraltar',
        ]);
        expect(saved.storyEvents).to.include(`${arc}chapter-complete`);
        expect(
          saved.mates.filter(({ sailorId }) => sailorId === '34'),
        ).to.have.length(1);
      });
      cy.contains('[data-test=left] div', /^伙伴$/).click();
      cy.contains('[data-overlay-panel] div', /^多明戈$/)
        .first()
        .click();
      cy.get('[data-overlay-panel]').should(($panel) => {
        const bounds = $panel[0].getBoundingClientRect();
        const game = $panel[0].ownerDocument
          .getElementById('game')!
          .getBoundingClientRect();
        expect(bounds.top).to.be.at.least(game.top);
        expect(bounds.bottom).to.be.at.most(game.bottom);
      });
      cy.get('#game').screenshot('m1-four-member-roster');
      closeSidebar();
      cy.reload();
      toMenu();
      saveFromSystem().then((saved) => expect(saved.gold).to.equal(1800));
    },
  );

  branchTest(
    'reoffers a declined English commission and migrates paid v4 discoveries without paying them twice',
    () => {
      fixture({
        portId: '1',
        buildingId: '7',
        storyEvents: [],
        discoveries: ['strait-of-gibraltar'],
        gold: 900,
      });
      cy.window().then((window) => {
        const saved = JSON.parse(window.localStorage.getItem(SAVED_STATE_KEY)!);
        delete saved.storyEvents;
        delete saved.reportedDiscoveries;
        window.localStorage.setItem(
          SAVED_STATE_KEY,
          JSON.stringify({ ...saved, version: 4 }),
        );
      });
      cy.visit('');
      cy.get('[data-test=building]').should(
        'include.text',
        'The Guild needs a fresh chart',
      );
      toChoice();
      cy.get('[data-test=confirmNo]').click();
      toMenu();
      clickMenu('Job Assignment');
      toChoice();
      cy.get('[data-test=confirmYes]').click();
      toMenu();
      saveFromSystem().then((saved) => {
        expect(saved.version).to.equal(SAVE_VERSION);
        expect(saved.gold).to.equal(900);
        expect(saved.reportedDiscoveries).to.deep.equal([
          'strait-of-gibraltar',
        ]);
        expect(saved.storyEvents).to.include(`${arc}commission-accepted`);
        setState({ ...saved, portId: null, buildingId: null, dayAtSea: 3 });
      });
      cy.reload();
      cy.get('[data-test=seaStory]').should(
        'include.text',
        'Three days at sea',
      );
      finishSeaEncounter();
      saveFromSystem().then((saved) =>
        setState({ ...saved, portId: '1', buildingId: '7', dayAtSea: 0 }),
      );
      cy.reload();
      cy.get('[data-test=building]').should(
        'include.text',
        'Your Gibraltar chart is clear',
      );
      toMenu();
      saveFromSystem().then((saved) => {
        expect(saved.gold).to.equal(1400);
        expect(saved.storyEvents).to.include(`${arc}chapter-complete`);
      });
      closeSidebar();
      cy.reload();
      toMenu();
      saveFromSystem().then((saved) => expect(saved.gold).to.equal(1400));
    },
  );

  branchTest(
    'buys and displays a fourth ship with Domingo as its captain',
    () => {
      fixture({
        portId: '2',
        buildingId: '3',
        gold: 2000,
        usedShipsAtPort: { '2': { 'balsa-1': '1' } },
        mates: [
          { sailorId: '1', role: 0 },
          { sailorId: '32', role: 1 },
          { sailorId: '33', role: 2 },
          { sailorId: '34', role: null },
        ],
        fleets: {
          '1': {
            position: undefined,
            ships: ['Flagship', 'Second', 'Third'].map((name) => ({
              id: '6',
              name,
              crew: 10,
              cargo: [],
              durability: 25,
            })),
          },
        },
      });
      cy.visit('', {
        onBeforeLoad(window) {
          window.localStorage.setItem('uw2.locale', 'en');
          window.localStorage.setItem('uw2.e2e.locale', 'en');
        },
      });
      clickMenu('Used Ship');
      clickMenu2('Balsa');
      cy.get('[data-test=building]').click();
      cy.get('[data-test=confirmYes]').click();
      cy.get('[data-test=inputNameInput]').type('Fourth{enter}');
      readVoyageSave().then((saved) => {
        expect(saved.gold).to.equal(800);
        expect(saved.fleets['1'].ships).to.have.length(4);
        expect(
          saved.mates.find(({ sailorId }) => sailorId === '34')!.role,
        ).to.equal(3);
      });
      cy.contains('[data-test=left] div', /^Fleet$/).click();
      cy.get('[data-test=fleet] img')
        .should('have.length', 4)
        .each(($ship) => {
          expect(($ship[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(
            0,
          );
          const ship = $ship[0].getBoundingClientRect();
          const game = $ship[0].closest('#game')!.getBoundingClientRect();
          expect(ship.top).to.be.at.least(game.top);
          expect(ship.bottom).to.be.at.most(game.bottom);
        });
      cy.get('[data-test=fleet] img[alt=Fourth]').should('be.visible');
      cy.get('#game').screenshot('m1-four-ship-fleet');
    },
  );

  it('sails the real Lisbon–Gibraltar coast and returns with provisions', () => {
    fixture({ dayAtSea: 0, timePassed: 1220 });
    cy.window().then((window) => {
      const saved = JSON.parse(window.localStorage.getItem(SAVED_STATE_KEY)!);
      saved.fleets['1'].position = { x: 838, y: 358 };
      window.localStorage.setItem(SAVED_STATE_KEY, JSON.stringify(saved));
    });
    cy.visit('', {
      onBeforeLoad(window) {
        window.localStorage.setItem('uw2.e2e.locale', 'zh-CN');
        window.localStorage.setItem('uw2.locale', 'zh-CN');
      },
    });
    sailLisbonToGibraltar();
    readVoyageSave().then((saved) =>
      expect(saved.discoveries).to.include('strait-of-gibraltar'),
    );
    sailGibraltarToLisbon();
    saveFromSystem().then((saved) => {
      expect(saved.portId).to.equal('1');
      expect(saved.fleets['1'].ships[0].crew).to.equal(10);
      expect(
        saved.fleets['1'].ships[0].cargo.find(({ type }) => type === 'food')!
          .quantity,
      ).to.be.greaterThan(0);
    });
  });
});
