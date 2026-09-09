import { SAVE_VERSION } from '../../src/state/saveLoad';
import type { State } from '../../src/state/state';
import {
  advanceBuildingUntilCombat,
  completeBuildingEvent,
  installM1Fixture,
  playDuel,
  visitFacilityFixture,
} from '../conflictAndGrowthUtils';
import {
  closeSidebar,
  finishSeaEncounter,
  readVoyageSave,
  sailGibraltarToLisbon,
  saveFromSystem,
} from '../firstVoyageUtils';

const event = {
  domingoMissing: 'joao.conflict-and-growth.domingo-missing',
  lodgeSearch: 'joao.conflict-and-growth.lodge-search',
  shipyardStart: 'joao.conflict-and-growth.kahn-shipyard-start',
  identity: 'joao.conflict-and-growth.identity-revealed',
  houseStart: 'joao.conflict-and-growth.kahn-house-start',
  fatherCleared: 'joao.conflict-and-growth.father-cleared',
  farewell: 'joao.conflict-and-growth.domingo-farewell',
  farewellOwned: 'joao.conflict-and-growth.domingo-farewell-flamberge-owned',
  warning: 'joao.conflict-and-growth.katarina-warning',
  firstSea: 'joao.conflict-and-growth.pursuit-first-sea',
  firstPort: 'joao.conflict-and-growth.pursuit-first-port',
  battleStart: 'joao.conflict-and-growth.katarina-battle-start',
  aliRequest: 'joao.conflict-and-growth.ali-request',
  lisbonInquiry: 'joao.conflict-and-growth.lisbon-inquiry',
  sashaFound: 'joao.conflict-and-growth.sasha-found',
  complete: 'joao.conflict-and-growth.chapter-complete',
} as const;

const ship = (name: string) => ({
  id: '6',
  name,
  crew: 10,
  durability: 30,
  cargo: [] as State['fleets']['1']['ships'][number]['cargo'],
});

const fourShipFleet = () => {
  const flagship = ship('Hermes II');
  flagship.cargo = [
    { type: 'water', quantity: 40 },
    { type: 'food', quantity: 40 },
    { type: 'shot', quantity: 6 },
    { type: 'lumber', quantity: 2 },
  ];
  return {
    '1': {
      position: { x: 838, y: 358 },
      ships: [flagship, ship('Esperanza'), ship('Victoria'), ship('Santa Luz')],
    },
  };
};

const fourCaptains = [
  { sailorId: '1', role: 0 },
  { sailorId: '32', role: 1 },
  { sailorId: '33', role: 2 },
  { sailorId: '34', role: 3 },
] as State['mates'];

const visitChapterStart = (overrides: Partial<State> = {}) =>
  cy.visit('', {
    onBeforeLoad(window) {
      window.localStorage.setItem('uw2.locale', 'zh-CN');
      window.localStorage.setItem('uw2.e2e.locale', 'zh-CN');
      installM1Fixture(window, overrides);
    },
  });

const finishCeutaAndOpenHouse = (
  shipyardOutcome: 'victory' | 'defeat' | 'draw',
) => {
  visitFacilityFixture('27', '2');
  completeBuildingEvent(event.domingoMissing);
  visitFacilityFixture('27', '5');
  completeBuildingEvent(event.lodgeSearch);
  visitFacilityFixture('27', '3');
  completeBuildingEvent(event.shipyardStart);
  playDuel(shipyardOutcome);
  cy.get('[data-test=finish-combat]').click();
  readVoyageSave().then((saved) => {
    expect(saved.combatResults['joao.m2.kahn-shipyard']).to.equal(
      shipyardOutcome,
    );
    expect(saved.mateProgress).to.deep.equal({});
  });
  visitFacilityFixture('27', '4');
  completeBuildingEvent(event.identity);
  visitFacilityFixture('1', '8');
  completeBuildingEvent(event.houseStart);
  cy.get('[data-test=combat]').should('be.visible');
};

const expectInsideGame = (selector: string) => {
  cy.get(selector).should(($element) => {
    const element = $element[0].getBoundingClientRect();
    const game = $element[0].closest('#game')!.getBoundingClientRect();
    expect(element.left).to.be.at.least(game.left);
    expect(element.top).to.be.at.least(game.top);
    expect(element.right).to.be.at.most(game.right);
    expect(element.bottom).to.be.at.most(game.bottom);
  });
};

const departFromHarbor = () => {
  cy.get('[data-test=menu]').contains('出航').click();
  cy.get('[data-test=confirmYes]').click();
  cy.get('[data-test=building]').should('not.exist');
  readVoyageSave().then((saved) => expect(saved.portId).to.be.null);
};

const pulseWestUntilCombat = (
  remaining = 100,
): ReturnType<typeof saveFromSystem> => {
  if (remaining === 0) throw new Error('Regional voyage did not start combat');
  return saveFromSystem().then<void>((saved) => {
    if (saved.activeCombat) {
      expect(saved.activeCombat.encounterId).to.equal('joao.m2.katarina');
      closeSidebar();
      cy.get('[data-test=combat]').should('be.visible');
      return;
    }
    return cy.document().then((document) => {
      if (document.querySelector('[data-test=seaStory]')) {
        closeSidebar();
        finishSeaEncounter();
        return pulseWestUntilCombat(remaining - 1);
      }
      closeSidebar(0);
      cy.document().trigger('keydown', { key: 'a' });
      cy.wait(350, { log: false });
      cy.document().trigger('keyup', { key: 'a' });
      return pulseWestUntilCombat(remaining - 1);
    });
  });
};

describe('M2 complete chapter and regional pursuit', () => {
  it('earns the draw rematch, preserves four captains, sails a real regional leg, and closes the chapter', () => {
    visitChapterStart({
      gold: 0,
      fleets: fourShipFleet(),
      mates: fourCaptains,
    });
    finishCeutaAndOpenHouse('victory');

    playDuel('draw');
    cy.get('[data-test=finish-combat]').click();
    readVoyageSave().then((saved) => {
      expect(saved.combatResults['joao.m2.kahn-house']).to.equal('draw');
      expect(saved.mateProgress).to.deep.equal({});
    });
    visitFacilityFixture('1', '8');
    advanceBuildingUntilCombat('joao.m2.kahn-house');
    playDuel('victory');
    cy.get('[data-test=finish-combat]').click();
    readVoyageSave().then((saved) => {
      expect(saved.combatResults['joao.m2.kahn-house']).to.equal('victory');
      expect(saved.mateProgress['1'].battleExperience).to.equal(100);
    });

    visitFacilityFixture('1', '6');
    completeBuildingEvent(event.fatherCleared);
    readVoyageSave().then((saved) => {
      expect(saved.fame).to.deep.equal({
        adventure: 1030,
        pirate: 1000,
        trade: 0,
      });
    });
    visitFacilityFixture('1', '6');
    readVoyageSave().then((saved) =>
      expect(saved.fame).to.deep.equal({
        adventure: 1030,
        pirate: 1000,
        trade: 0,
      }),
    );

    visitFacilityFixture('1', '8');
    completeBuildingEvent(event.farewell);
    readVoyageSave().then((saved) => {
      expect(saved.items.filter((id) => id === '13')).to.have.length(1);
      expect(saved.fleets['1'].ships).to.have.length(4);
      expect(saved.mates).to.deep.equal([
        { sailorId: '1', role: 0 },
        { sailorId: '32', role: 1 },
        { sailorId: '33', role: 2 },
        { sailorId: 'm2-relief-captain', role: 3 },
      ]);
    });
    cy.contains('[data-test=left] div', /^伙伴$/).click();
    cy.contains('[data-overlay-panel] [role=button]', /^代理船长$/).click();
    cy.get('[data-test=character-portrait-placeholder]')
      .should('have.attr', 'aria-label', '代理船长')
      .and('have.text', '代理');
    cy.contains('[data-overlay-panel]', 'Santa Luz号船长').should('be.visible');
    expectInsideGame('[data-overlay-panel]');
    cy.scrollTo('top', { ensureScrollable: false });
    cy.screenshot('m2-farewell-relief-mates-zh', {
      capture: 'viewport',
      overwrite: true,
    });
    closeSidebar();
    cy.contains('[data-test=left] div', /^舰队$/).click();
    cy.get('[data-test=fleet] img').should('have.length', 4);
    expectInsideGame('[data-test=fleet]');
    cy.scrollTo('top', { ensureScrollable: false });
    cy.screenshot('m2-farewell-four-ship-fleet-zh', {
      capture: 'viewport',
      overwrite: true,
    });
    closeSidebar();

    visitFacilityFixture('2', '2');
    cy.get('[data-test=building]').click();
    cy.get('[data-test=confirmNo]').click();
    cy.get('[data-test=building]').should('contain.text', '先在塞维尔整备');
    cy.get('[data-test=building]').click();
    readVoyageSave().then((saved) =>
      expect(saved.storyEvents).not.to.include(event.warning),
    );
    visitFacilityFixture('2', '2');
    cy.get('[data-test=building]').click();
    cy.get('[data-test=confirmYes]').click();
    completeBuildingEvent(event.warning);

    // This fixture changes only the facility after the accepted warning. The
    // following Seville-to-Lisbon leg uses real sailing, time and docking.
    visitFacilityFixture('2', '4');
    departFromHarbor();
    const departure: { timePassed?: number } = {};
    readVoyageSave().then((saved) => {
      departure.timePassed = saved.timePassed;
      expect(saved.dayAtSea).to.equal(0);
    });
    sailGibraltarToLisbon();
    readVoyageSave().then((saved) => {
      expect(saved.portId).to.equal('1');
      expect(saved.dayAtSea).to.equal(0);
      expect(saved.timePassed).to.be.greaterThan(
        (departure.timePassed ?? saved.timePassed) + 1439,
      );
      expect(saved.storyEvents).to.include(event.firstSea);
    });

    visitFacilityFixture('1', '4');
    cy.get('[data-test=building]').should('contain.text', '她还守在港外');
    expectInsideGame('[data-test=building]');
    cy.scrollTo('top', { ensureScrollable: false });
    cy.screenshot('m2-pursuit-lisbon-harbor-zh', {
      capture: 'viewport',
      overwrite: true,
    });
    completeBuildingEvent(event.firstPort);
    departFromHarbor();
    pulseWestUntilCombat();
    readVoyageSave().then((saved) => {
      expect(saved.dayAtSea).to.be.at.least(1);
      expect(saved.storyEvents).to.include(event.battleStart);
      expect(saved.activeCombat?.encounterId).to.equal('joao.m2.katarina');
    });
    expectInsideGame('[data-test=combat]');
    cy.scrollTo('top', { ensureScrollable: false });
    cy.screenshot('m2-katarina-chapter-naval-zh', {
      capture: 'viewport',
      overwrite: true,
    });
    cy.get('[data-test=naval-withdraw]').click();
    cy.get('[data-test=naval-retreat]').click();
    cy.get('[data-test=finish-combat]').click();
    readVoyageSave().then((saved) =>
      expect(saved.combatResults['joao.m2.katarina']).to.equal('retreat'),
    );

    visitFacilityFixture('2', '2');
    cy.get('[data-test=building]').should('contain.text', '路琪亚被人带走');
    cy.scrollTo('top', { ensureScrollable: false });
    cy.screenshot('m2-ali-request-zh', {
      capture: 'viewport',
      overwrite: true,
    });
    completeBuildingEvent(event.aliRequest);
    visitFacilityFixture('1', '2');
    completeBuildingEvent(event.lisbonInquiry);
    visitFacilityFixture('77', '2');
    cy.get('[data-test=building]').should('contain.text', '阿兰是我的哥哥');
    cy.scrollTo('top', { ensureScrollable: false });
    cy.screenshot('m2-sasha-found-zh', {
      capture: 'viewport',
      overwrite: true,
    });
    completeBuildingEvent(event.sashaFound);
    visitFacilityFixture('3', '5');
    completeBuildingEvent(event.complete);
    readVoyageSave().then((saved) => {
      expect(saved.version).to.equal(SAVE_VERSION);
      expect(saved.storyEvents).to.include(event.complete);
      expect(saved.storyEvents).to.include('future-preserved-event');
      expect(saved.combatResults).to.deep.equal({
        'joao.m2.kahn-shipyard': 'victory',
        'joao.m2.kahn-house': 'victory',
        'joao.m2.katarina': 'retreat',
      });
    });
    cy.contains('[data-test=left] div', /^日志$/).click();
    cy.get('[data-test=questJournal]')
      .should('contain.text', '冲突与成长已完成')
      .and('contain.text', '在此前的调查中，阿兰得知莎夏安然无恙')
      .and('contain.text', '连续航海五天')
      .and('contain.text', '向阿兰报告后，连续在海上航行五天')
      .and('not.contain.text', 'M2')
      .and('not.contain.text', '阿兰的新线索将在后续章节继续')
      .and('not.contain.text', '路琪亚被绑架一事仍未解决');
    expectInsideGame('[data-test=questJournal]');
    cy.scrollTo('top', { ensureScrollable: false });
    cy.screenshot('m2-final-journal-zh', {
      capture: 'viewport',
      overwrite: true,
    });
  });

  it('advances after a house defeat and completes the pre-owned Flamberge farewell once', () => {
    visitChapterStart({ items: ['53', '4', '13'] });
    finishCeutaAndOpenHouse('draw');
    playDuel('defeat');
    cy.get('[data-test=finish-combat]').click();
    readVoyageSave().then((saved) => {
      expect(saved.combatResults['joao.m2.kahn-house']).to.equal('defeat');
      expect(saved.mateProgress).to.deep.equal({});
    });
    visitFacilityFixture('1', '6');
    completeBuildingEvent(event.fatherCleared);
    visitFacilityFixture('1', '8');
    completeBuildingEvent(event.farewell);
    readVoyageSave().then((saved) => {
      expect(saved.storyEvents).to.include(event.farewellOwned);
      expect(saved.storyEvents).to.include(event.farewell);
      expect(saved.items.filter((id) => id === '13')).to.have.length(1);
      expect(saved.mates.some(({ sailorId }) => sailorId === '34')).to.equal(
        false,
      );
      expect(saved.fame.adventure).to.equal(1030);
      expect(saved.fame.pirate).to.equal(1000);
    });
    visitFacilityFixture('1', '8');
    saveFromSystem().then((saved) => {
      expect(saved.items.filter((id) => id === '13')).to.have.length(1);
      expect(saved.fame.adventure).to.equal(1030);
      expect(saved.fame.pirate).to.equal(1000);
    });
  });
});
