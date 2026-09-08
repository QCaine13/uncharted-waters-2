import type { State } from '../../src/state/state';
import { completeBuildingEvent } from '../conflictAndGrowthUtils';
import { closeSidebar, saveFromSystem } from '../firstVoyageUtils';
import {
  massawaThrough,
  minutesAt,
  relocateM3Fixture,
  visitM3Fixture,
} from '../m3FixtureUtils';
import { clickMenu, clickMenu2 } from '../utils';

const id = (suffix: string) => `joao.massawa.${suffix}`;

const fourShips = {
  '1': {
    position: { x: 1148, y: 528 },
    ships: ['Hermes II', 'Esperanza', 'Victoria', 'Santa Luz'].map((name) => ({
      id: '6',
      name,
      crew: 10,
      durability: 30,
      cargo: [],
    })),
  },
} as State['fleets'];

describe('M3 Massawa browser boundaries', () => {
  it('uses logical religious house 11 and southwest residence 8', () => {
    visitM3Fixture({
      portId: '75',
      buildingId: '11',
      storyEvents: massawaThrough('ali-massawa-lead'),
    });
    cy.get('[data-test=building]').should(
      'contain.text',
      '塔菲尔代表当地抵抗力量',
    );
    cy.screenshot('m3-massawa-logical11-zh', { overwrite: true });
    completeBuildingEvent(id('religious-lead'));
    relocateM3Fixture('75', '8');
    cy.get('[data-test=building]').should('contain.text', '圣者之杖');
    cy.screenshot('m3-massawa-residence8-zh', { overwrite: true });
    completeBuildingEvent(id('staff-request'));
  });

  it('anchors the wait at Massawa and opens only on day 11 of a later month', () => {
    const anchor = minutesAt(1522, 6, 20, 10);
    visitM3Fixture({
      portId: '75',
      buildingId: '8',
      timePassed: anchor,
      storyEvents: massawaThrough('pietro-commissioned'),
      storyEventTimes: {
        [id('pietro-commissioned')]: minutesAt(1522, 6, 2, 10),
      },
    });
    completeBuildingEvent(id('waiting-for-pietro'));
    saveFromSystem().then((saved) => {
      expect(saved.storyEventTimes[id('waiting-for-pietro')]).to.equal(anchor);
      expect(saved.storyEventTimes[id('pietro-commissioned')]).to.equal(
        minutesAt(1522, 6, 2, 10),
      );
    });
    closeSidebar();

    relocateM3Fixture('75', '8', { timePassed: minutesAt(1522, 7, 1, 10) });
    cy.get('[data-test=building]').should('contain.text', '11日');
    cy.contains('[data-test=left] div', /^日志$/).click();
    cy.get('[data-test=questJournal]').should('contain.text', '1522年7月11日');
    cy.screenshot('m3-massawa-long-date-journal-zh', { overwrite: true });
    closeSidebar();
    relocateM3Fixture('75', '8', { timePassed: minutesAt(1522, 7, 10, 10) });
    cy.get('[data-test=building]').should('contain.text', '11日');
    relocateM3Fixture('75', '8', { timePassed: minutesAt(1522, 7, 11, 10) });
    completeBuildingEvent(id('invasion-authorized'));
  });

  it('allows readiness deferral, then accepts and returns to the ordinary Sail menu', () => {
    visitM3Fixture({
      portId: '75',
      buildingId: '4',
      storyEvents: massawaThrough('invasion-authorized'),
      fleets: fourShips,
    });
    cy.get('[data-test=building]').click();
    cy.get('[data-test=confirmNo]').click();
    cy.get('[data-test=building]').should('contain.text', '先在这里整备船队');
    cy.get('[data-test=building]').click();
    saveFromSystem().then((saved) =>
      expect(saved.storyEvents).not.to.include(id('first-sortie-ready')),
    );
    closeSidebar();
    relocateM3Fixture('75', '4');
    cy.get('[data-test=building]').click();
    cy.get('[data-test=confirmYes]').click();
    completeBuildingEvent(id('first-sortie-ready'));
    cy.get('[data-test=menu]').should('contain.text', '出航');
  });

  it('receives, inspects and protects the Staff, consumes it, then sells the Crown', () => {
    visitM3Fixture({
      portId: '75',
      buildingId: '2',
      storyEvents: massawaThrough('defense-reported'),
      items: ['53', '4'],
      fame: { adventure: 5030, pirate: 1000, trade: 0 },
      gold: 1800,
    });
    completeBuildingEvent(id('staff-received'));
    cy.contains('[data-test=left] div', /^物品$/).click();
    cy.contains('[data-overlay-panel] [role=button]', /^圣者之杖$/).click();
    cy.get('[data-test=items-content]').should('contain.text', '圣者之杖');
    cy.screenshot('m3-staff-inventory-zh', { overwrite: true });
    closeSidebar();

    relocateM3Fixture('75', '10');
    clickMenu('出售');
    cy.get('[data-test=menu2]').should(
      'contain.text',
      '圣者之杖 · 任务物品——无法出售',
    );
    cy.contains('[data-test=menu2] [role=button]', '圣者之杖')
      .should('have.class', 'text-gray-400')
      .click();
    cy.get('[data-test=confirmYes]').should('not.exist');

    relocateM3Fixture('75', '8');
    completeBuildingEvent(id('staff-returned'));
    cy.get('[data-test=fame-adventure]').should('contain.text', '10030');
    cy.screenshot('m3-staff-handin-immediate-axum-zh', { overwrite: true });
    saveFromSystem().then((saved) => {
      expect(saved.items).not.to.include('m3-staff-of-the-saint');
      expect(saved.items.filter((item) => item === '45')).to.have.length(1);
      expect(saved.fame.adventure).to.equal(10030);
    });
    closeSidebar();

    relocateM3Fixture('75', '10');
    clickMenu('出售');
    clickMenu2('王冠');
    cy.get('[data-test=confirmYes]').click();
    saveFromSystem().then((saved) => {
      expect(saved.items).not.to.include('45');
      expect(saved.gold).to.equal(151800);
    });
  });
});
