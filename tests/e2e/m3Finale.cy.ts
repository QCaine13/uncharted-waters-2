import type { State } from '../../src/state/state';
import {
  advanceBuildingUntilCombat,
  completeBuildingEvent,
  playDuel,
} from '../conflictAndGrowthUtils';
import {
  closeSidebar,
  finishSeaEncounter,
  readVoyageSave,
  saveFromSystem,
} from '../firstVoyageUtils';
import {
  finaleThrough,
  massawaThrough,
  minutesAt,
  relocateM3Fixture,
  visitM3Fixture,
} from '../m3FixtureUtils';
import { clickMenu, clickMenu2 } from '../utils';
import { enterPortBuilding, setModeledPortPosition } from '../portRouteUtils';

const id = (suffix: string) => `joao.finale.${suffix}`;

const combatFleet = {
  '1': {
    position: { x: 598, y: 645 },
    ships: [
      {
        id: '6',
        name: 'Hermes II',
        crew: 10,
        durability: 30,
        cargo: [
          { type: 'water', quantity: 20 },
          { type: 'food', quantity: 20 },
          { type: 'shot', quantity: 12 },
        ],
      },
    ],
  },
} as State['fleets'];

const finishCombat = () => cy.get('[data-test=finish-combat]').click();

const loseNavalBattle = (remaining = 20): ReturnType<typeof readVoyageSave> => {
  if (!remaining) throw new Error('Naval defeat did not resolve');
  return readVoyageSave().then<void>((saved) => {
    if (saved.activeCombat?.outcome === 'defeat') return;
    const combat = saved.activeCombat;
    if (combat?.kind !== 'naval')
      throw new Error('Expected active naval battle');
    const selector =
      combat.range < 3
        ? '[data-test=naval-withdraw]'
        : '[data-test=naval-approach]';
    cy.get(selector).click();
    return loseNavalBattle(remaining - 1);
  });
};

const winAmazonByGunfire = (
  remaining = 10,
): ReturnType<typeof readVoyageSave> => {
  if (!remaining) throw new Error('Amazon victory did not resolve');
  return readVoyageSave().then<void>((saved) => {
    if (saved.activeCombat?.outcome === 'victory') return;
    const combat = saved.activeCombat;
    if (combat?.kind !== 'naval')
      throw new Error('Expected active Amazon battle');
    cy.get('[data-test=naval-fire]').click();
    return winAmazonByGunfire(remaining - 1);
  });
};

describe('M3 finale browser branches', () => {
  it('preserves four ships and replaces Enrico when he captains the second ship', () => {
    const names = ['Hermes II', 'Esperanza', 'Victoria', 'Santa Luz'];
    visitM3Fixture({
      portId: '1',
      buildingId: '2',
      storyEvents: massawaThrough('chapter-complete'),
      fleets: {
        '1': {
          position: { x: 838, y: 358 },
          ships: names.map((name) => ({
            id: '6',
            name,
            crew: 10,
            durability: 30,
            cargo: [],
          })),
        },
      },
      mates: [
        { sailorId: '1', role: 0 },
        { sailorId: '33', role: 1 },
        { sailorId: '32', role: 2 },
        { sailorId: 'm2-relief-captain', role: 3 },
      ],
    });
    cy.get('[data-test=building]').click();
    cy.get('[data-test=confirmYes]').click();
    completeBuildingEvent(id('japan-request'));
    relocateM3Fixture('100', '4');
    completeBuildingEvent(id('enrico-farewell'));
    cy.get('[data-test=fame-adventure]').should('contain.text', '1030');
    saveFromSystem().then((saved) => {
      expect(saved.fleets['1'].ships.map(({ name }) => name)).to.deep.equal(
        names,
      );
      expect(saved.mates.some(({ sailorId }) => sailorId === '33')).to.equal(
        false,
      );
      expect(saved.mates).to.deep.include({
        sailorId: 'm3-relief-captain',
        role: 1,
      });
    });
    closeSidebar();
    cy.contains('[data-test=left] div', /^舰队$/).click();
    cy.get('[data-test=fleet] img').should('have.length', 4);
    cy.screenshot('m3-enrico-four-ship-departure-zh', { overwrite: true });
  });

  it('routes the Lisbon notice and letter to the Sakai guild', () => {
    visitM3Fixture({
      portId: '1',
      buildingId: '5',
      storyEvents: finaleThrough('enrico-farewell'),
      mates: [
        { sailorId: '1', role: 0 },
        { sailorId: '32', role: null },
      ],
    });
    completeBuildingEvent(id('letter-notice'));
    relocateM3Fixture('1', '7');
    completeBuildingEvent(id('enrico-letter'));
    relocateM3Fixture('99', '7');
    cy.get('[data-test=building]').should('contain.text', '南美洲');
    completeBuildingEvent(id('sakai-lead'));
  });

  (['victory', 'defeat', 'draw'] as const).forEach((outcome) => {
    it(`rescues Lucia after a visibly played Rudolph ${outcome}`, () => {
      visitM3Fixture({
        portId: '57',
        buildingId: '2',
        storyEvents: finaleThrough('south-america-arrival'),
      });
      completeBuildingEvent(id('rudolph-start'));
      playDuel(outcome);
      finishCombat();
      relocateM3Fixture('57', '2');
      completeBuildingEvent(id('lucia-rescued'));
      saveFromSystem().then((saved) =>
        expect(saved.combatResults['joao.m3.rudolph']).to.equal(outcome),
      );
    });
  });

  [
    ['same day', minutesAt(1523, 1, 1, 12), false],
    ['next day early', minutesAt(1523, 1, 2, 8, 59), false],
    ['next day valid', minutesAt(1523, 1, 2, 9), true],
    ['next day late', minutesAt(1523, 1, 2, 15), false],
    ['later missed-day recovery', minutesAt(1523, 1, 4, 10), true],
  ].forEach(([label, timePassed, valid]) => {
    it(`shows the ${label} alliance appointment state`, () => {
      visitM3Fixture({
        portId: '57',
        buildingId: '4',
        timePassed: timePassed as number,
        storyEvents: finaleThrough('martinez-exposed'),
        storyEventTimes: {
          [id('martinez-exposed')]: minutesAt(1523, 1, 1, 10),
        },
      });
      cy.get('[data-test=building]').should(
        'contain.text',
        valid ? '西班牙会与你共同对抗' : '09:00至14:59',
      );
      if (label === 'next day valid' || label === 'next day late') {
        cy.screenshot(
          valid ? 'm3-rendezvous-valid-zh' : 'm3-rendezvous-missed-zh',
          { overwrite: true },
        );
      }
      if (valid) completeBuildingEvent(id('spanish-alliance'));
      else
        saveFromSystem().then((saved) =>
          expect(saved.storyEvents).not.to.include(id('spanish-alliance')),
        );
    });
  });

  it('repairs a future Martinez anchor before the next-date appointment', () => {
    const current = minutesAt(1523, 1, 1, 10);
    visitM3Fixture({
      portId: '57',
      buildingId: '4',
      timePassed: current,
      storyEvents: finaleThrough('martinez-exposed'),
      storyEventTimes: {
        [id('martinez-exposed')]: minutesAt(1523, 2, 1, 10),
      },
    });
    cy.get('[data-test=building]').should('contain.text', '09:00至14:59');
    saveFromSystem().then((saved) => {
      expect(saved.storyEventTimes[id('martinez-exposed')]).to.equal(current);
      expect(saved.storyEvents).not.to.include(id('spanish-alliance'));
    });
    closeSidebar();

    relocateM3Fixture('57', '4', {
      timePassed: minutesAt(1523, 1, 2, 9),
    });
    cy.get('[data-test=building]').should(
      'contain.text',
      '西班牙会与你共同对抗',
    );
    completeBuildingEvent(id('spanish-alliance'));
  });

  it('earns retreat and defeat, retries from Cayenne, wins with actual shot, and preserves the ending across reload and re-entry', () => {
    visitM3Fixture({
      portId: null,
      buildingId: null,
      storyEvents: finaleThrough('spanish-alliance'),
      fleets: combatFleet,
      combatResults: {
        'joao.m3.ottoman-one': 'retreat',
        'joao.m3.ottoman-two': 'retreat',
        'joao.m3.rudolph': 'victory',
      },
    });
    cy.get('[data-test=seaStory]').should('be.visible');
    finishSeaEncounter();
    cy.get('[data-test=navalControls]').should('be.visible');
    cy.get('[data-test=naval-withdraw]').click();
    cy.get('[data-test=naval-retreat]').click();
    finishCombat();
    relocateM3Fixture('57', '4');
    cy.get('[data-test=building]').click();
    cy.get('[data-test=confirmYes]').click();
    advanceBuildingUntilCombat('joao.m3.amazon');
    loseNavalBattle();
    finishCombat();
    relocateM3Fixture('57', '3');
    clickMenu('修理');
    clickMenu2('Hermes II');
    cy.get('[data-test=confirmYes]').click();
    readVoyageSave().then((saved) => {
      expect(saved.fleets['1'].ships[0].durability).to.equal(30);
      expect(
        saved.fleets['1'].ships[0].cargo.find(({ type }) => type === 'shot')
          ?.quantity,
      ).to.equal(12);
    });
    relocateM3Fixture('57', '4');
    cy.get('[data-test=building]').click();
    cy.get('[data-test=confirmYes]').click();
    advanceBuildingUntilCombat('joao.m3.amazon');
    cy.contains('[data-test=left] div', /^日志$/).click();
    cy.get('[data-test=questJournal]').should('contain.text', '完成亚马逊战斗');
    cy.screenshot('m3-amazon-live-retry-objective-zh', { overwrite: true });
    closeSidebar();
    winAmazonByGunfire();
    finishCombat();
    readVoyageSave().then((saved) => {
      expect(saved.fleets['1'].ships[0].durability).to.equal(2);
      expect(
        saved.fleets['1'].ships[0].cargo.find(({ type }) => type === 'shot')
          ?.quantity,
      ).to.equal(4);
    });
    completeBuildingEvent(id('amazon-victory'));
    saveFromSystem().then((saved) => {
      expect(saved.combatResults['joao.m3.amazon']).to.equal('victory');
      expect(saved.storyEvents).to.include(id('amazon-victory'));
    });
    closeSidebar();

    relocateM3Fixture('1', '8');
    completeBuildingEvent(id('homecoming'));
    cy.contains('[data-test=left] div', /^日志$/).click();
    cy.get('[data-test=questJournal]').should('contain.text', '约翰主线已完成');
    cy.screenshot('m3-ending-homecoming-zh', { overwrite: true });
    closeSidebar();
    cy.reload();
    cy.contains('[data-test=left] div', /^日志$/).click();
    cy.get('[data-test=questJournal]').should('contain.text', '约翰归家');
    closeSidebar();
    saveFromSystem();
    cy.get('#locale-select').select('en');
    closeSidebar();
    cy.contains('[data-test=left] div', /^Journal$/).click();
    cy.get('[data-test=questJournal]').should(
      'contain.text',
      'The main story is complete. You can continue exploring.',
    );
    cy.screenshot('m3-ending-homecoming-en', { overwrite: true });
    closeSidebar();
    cy.get('[data-test=building]').click();
    cy.get('[data-test=menu]').should('be.visible');
    cy.get('[data-test=building]').rightclick();
    cy.get('[data-test=building]').should('not.exist');
    cy.then(() => setModeledPortPosition({ x: 54, y: 68 }));
    enterPortBuilding(
      [
        ['a', 3],
        ['w', 2],
        ['a', 2],
        ['w', 15],
        ['d', 8],
        ['w', 1],
        ['d', 12],
        ['w', 1],
      ],
      'post-ending Lisbon residence',
    );
    cy.get('[data-test=building]').should('contain.text', 'Welcome home, João');
    cy.screenshot('m3-ending-home-revisited-en', { overwrite: true });
    saveFromSystem().then((saved) => {
      expect(
        saved.storyEvents.filter((event) => event === id('homecoming')),
      ).to.have.length(1);
      expect(saved.storyEvents).not.to.include(id('home-revisited'));
    });
  });
});
