import { createDuel } from '../../src/combat/duel';
import { createNaval } from '../../src/combat/naval';
import { encounterCatalog } from '../../src/combat/encounters';
import { createPlayerDuelStats } from '../../src/combat/stats';
import type { CombatState } from '../../src/combat/types';
import { SAVE_VERSION } from '../../src/state/saveLoad';
import { SAVED_STATE_KEY, type State } from '../../src/state/state';
import {
  advanceBuildingUntilCombat,
  completedM1Fixture,
  completeBuildingEvent,
  installM1Fixture,
  playDuel,
  visitFacilityFixture,
} from '../conflictAndGrowthUtils';
import {
  closeSidebar,
  readVoyageSave,
  saveFromSystem,
} from '../firstVoyageUtils';

const playerStats = () =>
  createPlayerDuelStats({
    sailorId: '1',
    equipment: { weaponId: '4', armorId: null },
    ownedItemIds: ['4', '53'],
    mateProgress: {},
  });

// Valid ongoing-battle fixtures test restoration and controls separately from
// chapter initiation. Every outcome below is earned through visible DOM buttons.
const visitCombatFixture = (
  combat: CombatState,
  gold = 1800,
  overrides: Partial<State> = {},
) => {
  const naval = combat.kind === 'naval' ? combat : null;
  const fixture = completedM1Fixture({
    ...overrides,
    portId: naval ? null : '1',
    buildingId: naval ? null : '8',
    gold,
    equipment: { weaponId: '4', armorId: null },
    mateProgress: {},
    combatResults: {},
    activeCombat: combat,
    fleets: {
      '1': {
        position: { x: 835, y: 376 },
        ships: [
          {
            id: '6',
            name: 'Hermes II',
            crew: naval?.player.crew ?? 10,
            durability: naval?.player.hull ?? 25,
            cargo: naval
              ? [
                  { type: 'shot', quantity: naval.player.shot },
                  { type: 'lumber', quantity: naval.player.lumber },
                ]
              : [],
          },
        ],
      },
    },
  });
  cy.visit('', {
    onBeforeLoad(window) {
      window.localStorage.setItem('uw2.locale', 'zh-CN');
      window.localStorage.setItem('uw2.e2e.locale', 'zh-CN');
      window.localStorage.setItem(
        SAVED_STATE_KEY,
        JSON.stringify({
          ...fixture,
          version: SAVE_VERSION,
        }),
      );
    },
  });
  cy.get('[data-test=combat]').should('be.visible');
};

const navalFixture = (hull = 25, crew = 24) =>
  createNaval({
    encounterId: 'joao.m2.katarina',
    player: { hull, maxHull: 30, crew, guns: 10, shot: 6, lumber: 2 },
    playerDuel: playerStats(),
  });

const loadFromOpenSystem = (combatRemains = true) => {
  cy.contains('button', /^(读取|Load)$/).click();
  cy.get('[data-test=combat]').should(
    combatRemains ? 'be.visible' : 'not.exist',
  );
  // Successful load remounts Left and can close the overlay by itself. Never
  // send an extra Escape into the newly resumed building.
  cy.document().then((document) => {
    if (document.getElementById('locale-select')) closeSidebar();
  });
};

describe('M2 restored combat controls and resource settlement', () => {
  const combatTest = Cypress.env('m2PreparationOnly') ? it.skip : it;
  combatTest(
    'restores attack and defense, isolates the System overlay, switches language and settles one duel reward',
    () => {
      visitCombatFixture(
        createDuel({
          encounterId: 'joao.m2.kahn-house',
          player: playerStats(),
          enemy: encounterCatalog['joao.m2.kahn-house'].enemy,
        }),
      );
      cy.get('[data-test=building]').should('not.exist');
      cy.get('[data-test=duelControls]').should(
        'have.attr',
        'data-phase',
        'attack',
      );
      cy.get('[data-test=duel-attack-slash]').should('contain.text', '挥砍');
      cy.scrollTo('top', { ensureScrollable: false });
      cy.screenshot('m2-duel-attack-zh', {
        capture: 'viewport',
        overwrite: true,
      });
      saveFromSystem().then((before) => {
        cy.get('[data-test=duel-attack-slash]').click({ force: true });
        cy.document().trigger('keydown', { key: 'Enter' });
        cy.document().trigger('keyup', { key: 'Enter' });
        readVoyageSave().then((after) => {
          expect(after.activeCombat).to.deep.equal(before.activeCombat);
          expect(after.timePassed).to.equal(before.timePassed);
        });
      });
      cy.get('#locale-select').select('en');
      cy.get('[data-test=duel-attack-slash]').should('contain.text', 'Slash');
      cy.scrollTo('top', { ensureScrollable: false });
      cy.screenshot('m2-system-over-duel-en', {
        capture: 'viewport',
        overwrite: true,
      });
      loadFromOpenSystem();
      cy.get('[data-test=duel-attack-slash]').click();
      cy.get('[data-test=duelControls]').should(
        'have.attr',
        'data-phase',
        'defend',
      );
      saveFromSystem().then((before) => {
        expect(before.activeCombat?.kind).to.equal('duel');
        if (before.activeCombat?.kind !== 'duel')
          throw new Error('Expected duel');
        expect(before.activeCombat.phase).to.equal('defend');
        loadFromOpenSystem();
        readVoyageSave().then((after) =>
          expect(after.activeCombat).to.deep.equal(before.activeCombat),
        );
      });
      cy.scrollTo('top', { ensureScrollable: false });
      cy.screenshot('m2-duel-defense-en', {
        capture: 'viewport',
        overwrite: true,
      });
      playDuel('victory');
      cy.get('[data-test=finish-combat]').should('be.visible');
      cy.scrollTo('top', { ensureScrollable: false });
      cy.screenshot('m2-duel-result-en', {
        capture: 'viewport',
        overwrite: true,
      });
      cy.get('[data-test=finish-combat]').dblclick();
      readVoyageSave().then((saved) => {
        expect(saved.activeCombat).to.be.null;
        expect(saved.combatResults['joao.m2.kahn-house']).to.equal('victory');
        expect(saved.mateProgress['1'].battleExperience).to.equal(100);
        expect(saved.gold).to.equal(1800);
      });
      saveFromSystem();
      loadFromOpenSystem(false);
      readVoyageSave().then((saved) =>
        expect(saved.mateProgress['1'].battleExperience).to.equal(100),
      );
      cy.contains('[data-test=left] div', /^Mates$/).click();
      cy.get('[data-test=battle-experience]').should('have.text', '100');
      cy.get('[data-test=battle-level]').should(
        'have.text',
        String(playerStats().level + 1),
      );
      cy.scrollTo('top', { ensureScrollable: false });
      cy.screenshot('m2-joao-growth-en', {
        capture: 'viewport',
        overwrite: true,
      });
      closeSidebar();
    },
  );

  combatTest(
    'spends real shot and lumber, restores naval range, and gives retreat experience',
    () => {
      visitCombatFixture(navalFixture());
      cy.get('[data-test=naval-retreat]').should('be.disabled');
      saveFromSystem().then((before) => {
        cy.get('[data-test=naval-fire]').click({ force: true });
        cy.document().trigger('keydown', { key: 'Enter' });
        cy.document().trigger('keyup', { key: 'Enter' });
        readVoyageSave().then((after) => {
          expect(after.activeCombat).to.deep.equal(before.activeCombat);
          expect(after.fleets).to.deep.equal(before.fleets);
          expect(after.timePassed).to.equal(before.timePassed);
        });
        cy.scrollTo('top', { ensureScrollable: false });
        cy.screenshot('m2-system-over-naval-zh', {
          capture: 'viewport',
          overwrite: true,
        });
        cy.get('[data-overlay-panel]').rightclick();
        cy.get('#locale-select').should('not.exist');
        cy.get('[data-test=navalControls]').should('be.visible');
        readVoyageSave().then((after) =>
          expect(after.activeCombat).to.deep.equal(before.activeCombat),
        );
      });
      cy.get('[data-test=naval-fire]').click();
      readVoyageSave().then((saved) => {
        const battle = saved.activeCombat;
        if (battle?.kind !== 'naval') throw new Error('Expected naval battle');
        expect(battle.enemy.hull).to.equal(34);
        expect(battle.player.hull).to.equal(21);
        expect(battle.player.shot).to.equal(5);
        expect(saved.fleets['1'].ships[0].durability).to.equal(21);
        expect(
          saved.fleets['1'].ships[0].cargo.find(({ type }) => type === 'shot')
            ?.quantity,
        ).to.equal(5);
      });
      cy.get('[data-test=naval-repair]').click();
      readVoyageSave().then((saved) => {
        const battle = saved.activeCombat;
        if (battle?.kind !== 'naval') throw new Error('Expected naval battle');
        expect(battle.player.hull).to.equal(25);
        expect(battle.player.lumber).to.equal(1);
        expect(
          saved.fleets['1'].ships[0].cargo.find(({ type }) => type === 'lumber')
            ?.quantity,
        ).to.equal(1);
      });
      cy.scrollTo('top', { ensureScrollable: false });
      cy.screenshot('m2-naval-resources-zh', {
        capture: 'viewport',
        overwrite: true,
      });
      cy.get('[data-test=naval-withdraw]').click();
      cy.get('[data-test=naval-fire]').should('be.disabled');
      saveFromSystem().then((before) => {
        loadFromOpenSystem();
        readVoyageSave().then((after) =>
          expect(after.activeCombat).to.deep.equal(before.activeCombat),
        );
      });
      cy.get('[data-test=naval-retreat]').click();
      cy.get('[data-test=combat-result]').should('contain.text', '成功撤退');
      cy.get('[data-test=finish-combat]').click();
      readVoyageSave().then((saved) => {
        expect(saved.combatResults['joao.m2.katarina']).to.equal('retreat');
        for (const mate of saved.mates) {
          expect(saved.mateProgress[mate.sailorId].battleExperience).to.equal(
            25,
          );
        }
      });
    },
  );

  combatTest(
    'returns a captain duel draw to naval combat and earns a later captain victory',
    () => {
      visitCombatFixture(navalFixture(30));
      cy.get('[data-test=naval-approach]').click();
      cy.get('[data-test=naval-approach]').click();
      cy.get('[data-test=naval-challenge]').click();
      cy.get('[data-test=duelControls]').should('be.visible');
      playDuel('draw');
      cy.get('[data-test=navalControls]').should('be.visible');
      readVoyageSave().then((saved) => {
        const battle = saved.activeCombat;
        if (battle?.kind !== 'naval') throw new Error('Expected naval battle');
        expect(battle.range).to.equal(0);
        expect(battle.outcome).to.be.null;
        expect(battle.player.crew).to.equal(21);
      });
      cy.get('[data-test=naval-challenge]').click();
      cy.get('[data-test=duelControls]').should('be.visible');
      playDuel('victory');
      cy.get('[data-test=finish-combat]').click();
      readVoyageSave().then((saved) => {
        expect(saved.combatResults['joao.m2.katarina']).to.equal('victory');
        expect(saved.mateProgress['1'].battleExperience).to.equal(100);
        expect(saved.mateProgress['32'].battleExperience).to.equal(50);
        expect(saved.fleets['1'].ships[0].crew).to.equal(21);
      });
    },
  );

  for (const tactic of ['cannon', 'boarding'] as const) {
    combatTest(`earns a naval victory through actual ${tactic} actions`, () => {
      visitCombatFixture(navalFixture());
      if (tactic === 'cannon') {
        for (let shot = 0; shot < 6; shot += 1) {
          cy.get('[data-test=naval-fire]').click();
        }
      } else {
        cy.get('[data-test=naval-approach]').click();
        cy.get('[data-test=naval-approach]').click();
        cy.get('[data-test=naval-board]').click();
        readVoyageSave().then((saved) => {
          const combat = saved.activeCombat;
          if (combat?.kind !== 'naval')
            throw new Error('Expected naval battle');
          expect(combat.enemy.crew).to.equal(11);
          expect(combat.player.crew).to.equal(15);
          expect(saved.fleets['1'].ships[0].crew).to.equal(15);
        });
        for (let boarding = 0; boarding < 4; boarding += 1) {
          cy.get('[data-test=naval-board]').click();
        }
      }
      cy.get('[data-test=combat-result]').should('contain.text', '战斗胜利');
      readVoyageSave().then((saved) => {
        const combat = saved.activeCombat;
        if (combat?.kind !== 'naval') throw new Error('Expected naval battle');
        expect(combat.outcome).to.equal('victory');
        if (tactic === 'cannon') {
          expect(combat.enemy.hull).to.equal(0);
          expect(combat.player.hull).to.equal(5);
          expect(combat.player.shot).to.equal(0);
        } else {
          expect(combat.enemy.crew).to.equal(0);
          expect(combat.player.crew).to.equal(1);
          expect(combat.player.shot).to.equal(6);
        }
      });
      cy.scrollTo('top', { ensureScrollable: false });
      cy.screenshot(`m2-naval-${tactic}-victory-zh`, {
        capture: 'viewport',
        overwrite: true,
      });
      cy.get('[data-test=finish-combat]').click();
      readVoyageSave().then((saved) => {
        expect(saved.combatResults['joao.m2.katarina']).to.equal('victory');
        expect(saved.mateProgress['1'].battleExperience).to.equal(100);
        expect(saved.mateProgress['32'].battleExperience).to.equal(50);
        expect(saved.gold).to.equal(1800);
      });
    });
  }

  combatTest(
    'recovers a zero-money naval defeat, blocks Ali, and retries immediately through Harbor No then Yes',
    () => {
      const combat = navalFixture(4, 10);
      combat.player.shot = 0;
      combat.player.lumber = 0;
      const prior = completedM1Fixture().storyEvents!;
      visitCombatFixture(combat, 0, {
        // Honest active-combat fixture: the battle-start marker precedes this
        // unresolved naval snapshot; no result or earned reward is inserted.
        storyEvents: [
          ...prior,
          'joao.conflict-and-growth.katarina-battle-start',
        ],
      });
      cy.get('[data-test=naval-approach]').click();
      cy.get('[data-test=combat-result]').should('contain.text', '战斗失利');
      cy.scrollTo('top', { ensureScrollable: false });
      cy.screenshot('m2-naval-defeat-zh', {
        capture: 'viewport',
        overwrite: true,
      });
      cy.get('[data-test=finish-combat]').click();
      readVoyageSave().then((saved) => {
        expect(saved.portId).to.equal('1');
        expect(saved.buildingId).to.be.null;
        expect(saved.gold).to.equal(0);
        expect(saved.fleets['1'].position).to.deep.equal({ x: 838, y: 358 });
        expect(saved.fleets['1'].ships[0].durability).to.equal(15);
        expect(saved.fleets['1'].ships[0].crew).to.equal(10);
        expect(saved.combatResults['joao.m2.katarina']).to.equal('defeat');
        expect(saved.mateProgress).to.deep.equal({});
        expect(saved.storyEvents).not.to.include(
          'joao.conflict-and-growth.ali-request',
        );
      });
      visitFacilityFixture('2', '2');
      cy.get('[data-test=building]').should(
        'not.contain.text',
        '路琪亚被人带走',
      );
      readVoyageSave().then((saved) =>
        expect(saved.storyEvents).not.to.include(
          'joao.conflict-and-growth.ali-request',
        ),
      );
      visitFacilityFixture('1', '4');
      cy.get('[data-test=building]').should(
        'contain.text',
        '船队已经安全回到里斯本',
      );
      cy.get('[data-test=building]').click();
      cy.get('[data-test=confirmNo]').click();
      cy.get('[data-test=building]').should('contain.text', '先在港里整备');
      cy.get('[data-test=building]').click();
      readVoyageSave().then((saved) => {
        expect(saved.gold).to.equal(0);
        expect(saved.activeCombat).to.be.null;
        expect(saved.fleets['1'].ships[0].cargo).to.deep.equal([]);
      });
      visitFacilityFixture('1', '4');
      cy.get('[data-test=building]').click();
      cy.get('[data-test=confirmYes]').click();
      cy.get('[data-test=building]').should('contain.text', '我们现在就去迎战');
      cy.scrollTo('top', { ensureScrollable: false });
      cy.screenshot('m2-zero-resource-harbor-retry-zh', {
        capture: 'viewport',
        overwrite: true,
      });
      advanceBuildingUntilCombat('joao.m2.katarina');
      cy.get('[data-test=naval-withdraw]').click();
      cy.get('[data-test=naval-retreat]').click();
      cy.get('[data-test=combat-result]').should('contain.text', '成功撤退');
      cy.get('[data-test=finish-combat]').click();
      readVoyageSave().then((saved) => {
        expect(saved.gold).to.equal(0);
        expect(saved.combatResults['joao.m2.katarina']).to.equal('retreat');
        expect(saved.mateProgress['1'].battleExperience).to.equal(25);
      });
      visitFacilityFixture('2', '2');
      cy.get('[data-test=building]').should('contain.text', '路琪亚被人带走');
    },
  );
});

const visitPreparationFixture = (gold = 1800) =>
  cy.visit('', {
    onBeforeLoad(window) {
      window.localStorage.setItem('uw2.locale', 'zh-CN');
      window.localStorage.setItem('uw2.e2e.locale', 'zh-CN');
      window.localStorage.setItem(
        SAVED_STATE_KEY,
        JSON.stringify(
          completedM1Fixture({
            portId: '1',
            buildingId: '3',
            gold,
          }),
        ),
      );
    },
  });

describe('M2 equipment and shipyard preparation', () => {
  it('equips and unequips the owned Rapier while migrating a valid version-5 shape', () => {
    visitPreparationFixture();
    cy.contains('[data-test=left] div', /^物品$/).click();
    cy.contains('[data-overlay-panel] [role=button]', '刺剑').click();
    cy.get('[data-test=equip-item]').should('contain.text', '装备武器').click();
    cy.get('[data-test=equip-item]').should('contain.text', '卸下');
    readVoyageSave().then((saved) => {
      expect(saved.version).to.equal(SAVE_VERSION);
      expect(saved.equipment.weaponId).to.equal('4');
      expect(saved.items).to.deep.equal(['53', '4']);
      expect(saved.storyEvents).to.include('future-preserved-event');
      expect(saved.gold).to.equal(1800);
    });
    cy.scrollTo('top', { ensureScrollable: false });
    cy.screenshot('m2-equipped-rapier-zh', {
      capture: 'viewport',
      overwrite: true,
    });
    cy.get('[data-test=equip-item]').click();
    readVoyageSave().then(
      (saved) => expect(saved.equipment.weaponId).to.be.null,
    );
    cy.get('[data-test=equip-item]').should('contain.text', '装备武器').click();
    closeSidebar();
    readVoyageSave().then((saved) => {
      expect(saved.equipment.weaponId).to.equal('4');
      expect(saved.buildingId).to.equal('3');
    });
  });

  for (const scenario of [
    { name: 'full', gold: 1800, points: 5, cost: 50 },
    { name: 'partial', gold: 25, points: 2, cost: 20 },
  ]) {
    it(`quotes, performs and reports a ${scenario.name} repair at its actual cost`, () => {
      visitPreparationFixture(scenario.gold);
      cy.get('[data-test=menu]').contains('修理').click();
      cy.get('[data-test=menu2]').contains('Hermes II').click();
      cy.get('[data-test=vendorMessageBox]').should(
        'contain.text',
        `${scenario.cost} 金币`,
      );
      cy.scrollTo('top', { ensureScrollable: false });
      cy.screenshot(`m2-repair-${scenario.name}-quote-zh`, {
        capture: 'viewport',
        overwrite: true,
      });
      cy.get('[data-test=confirmYes]').click();
      readVoyageSave().then((saved) => {
        expect(saved.gold).to.equal(scenario.gold - scenario.cost);
        expect(saved.fleets['1'].ships[0].durability).to.equal(
          25 + scenario.points,
        );
      });
      cy.scrollTo('top', { ensureScrollable: false });
      cy.screenshot(`m2-repair-${scenario.name}-result-zh`, {
        capture: 'viewport',
        overwrite: true,
      });
      cy.get('[data-test=vendorMessageBox]').should(
        'contain.text',
        `已修复 ${scenario.points} 点耐久，花费 ${scenario.cost} 金币。`,
      );
    });
  }
});

describe('M2 story initiation from a completed M1 version-5 fixture', () => {
  const chapterTest =
    Cypress.env('m2PreparationOnly') || Cypress.env('m2ControlsOnly')
      ? it.skip
      : it;
  chapterTest(
    'starts the Ceuta shipyard duel through dialogue and continues after an earned defeat',
    () => {
      cy.visit('', {
        onBeforeLoad(window) {
          window.localStorage.setItem('uw2.locale', 'zh-CN');
          window.localStorage.setItem('uw2.e2e.locale', 'zh-CN');
          installM1Fixture(window);
        },
      });
      cy.contains('[data-test=left] div', /^日志$/).click();
      cy.get('[data-test=questJournal]').should('contain.text', '休达');
      cy.scrollTo('top', { ensureScrollable: false });
      cy.screenshot('m2-initial-journal-zh', {
        capture: 'viewport',
        overwrite: true,
      });
      closeSidebar();
      // These are explicit facility/travel fixtures, carrying only progress
      // actually earned below. The regional pursuit voyage is tested separately.
      visitFacilityFixture('27', '2');
      completeBuildingEvent('joao.conflict-and-growth.domingo-missing');
      visitFacilityFixture('27', '5');
      completeBuildingEvent('joao.conflict-and-growth.lodge-search');
      visitFacilityFixture('27', '3');
      cy.get('[data-test=building]').should('be.visible');
      cy.scrollTo('top', { ensureScrollable: false });
      cy.screenshot('m2-ceuta-shipyard-dialogue-zh', {
        capture: 'viewport',
        overwrite: true,
      });
      completeBuildingEvent('joao.conflict-and-growth.kahn-shipyard-start');
      cy.get('[data-test=duelControls]').should('be.visible');
      playDuel('defeat');
      cy.get('[data-test=finish-combat]').click();
      readVoyageSave().then((saved) => {
        expect(saved.combatResults['joao.m2.kahn-shipyard']).to.equal('defeat');
        expect(saved.mateProgress).to.deep.equal({});
        expect(saved.gold).to.equal(1800);
      });
      visitFacilityFixture('27', '4');
      completeBuildingEvent('joao.conflict-and-growth.identity-revealed');
      readVoyageSave().then((saved) => {
        expect(saved.version).to.equal(SAVE_VERSION);
        expect(saved.storyEvents).to.include('future-preserved-event');
        expect(saved.mates.some(({ sailorId }) => sailorId === '34')).to.equal(
          true,
        );
      });
    },
  );
});
