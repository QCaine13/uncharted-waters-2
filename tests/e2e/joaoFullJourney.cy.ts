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
import { playFreshChineseOpeningAndFirstVoyage } from '../joaoOpeningJourney';
import { getCalendarParts } from '../../src/time/calendar';
import { clickMenu, clickMenu2 } from '../utils';
import {
  addHarborSupply,
  checkInAtLodge,
  checkpointRoot,
  departFromCurrentHarbor,
  enterPlannedPortBuilding,
  exitCurrentPortBuilding,
  outsidePortBuilding,
  portSpawn,
  recordJourneyPhase,
  resetCheckpointManifest,
  sailFromCurrentPosition,
  sailPlannedRoute,
  sailToWorldCombat,
  saveJourneyCheckpoint,
} from '../worldJourneyUtils';

const m2 = (suffix: string) => `joao.conflict-and-growth.${suffix}`;
const massawa = (suffix: string) => `joao.massawa.${suffix}`;
const finale = (suffix: string) => `joao.finale.${suffix}`;

const enterFrom = (
  portId: string,
  fromBuildingId: string | null,
  toBuildingId: string,
  label: string,
) =>
  enterPlannedPortBuilding(
    portId,
    fromBuildingId
      ? outsidePortBuilding(portId, fromBuildingId)
      : portSpawn(portId),
    toBuildingId,
    label,
  );

const settleBuildingToMenu = (remaining = 20): Cypress.Chainable<Document> => {
  if (!remaining)
    throw new Error('Building did not settle to its ordinary menu');
  return cy.document().then<void>((document) => {
    const building = document.querySelector('[data-test=building]');
    if (!building) return;
    const menu = document.querySelector('[data-test=menu]');
    if (menu && !menu.classList.contains('hidden')) return;
    cy.wrap(building).click();
    return settleBuildingToMenu(remaining - 1);
  });
};

const completeAndExit = (eventId: string) => {
  completeBuildingEvent(eventId);
  return cy
    .document()
    .then((document) => {
      if (document.querySelector('[data-test=building]'))
        return settleBuildingToMenu();
    })
    .then(() => {
      exitCurrentPortBuilding();
    });
};

const cargoQuantity = (
  saved: State,
  type: State['fleets']['1']['ships'][number]['cargo'][number]['type'],
) =>
  saved.fleets['1'].ships[0].cargo.find((entry) => entry.type === type)
    ?.quantity ?? 0;

const prepareVoyage = (
  desired: Partial<Record<'water' | 'food' | 'lumber' | 'shot', number>> = {
    water: 35,
    food: 35,
  },
) => {
  clickMenu('补给');
  return readVoyageSave().then<void>((saved) => {
    (['water', 'food', 'lumber', 'shot'] as const).forEach((type) => {
      const add = (desired[type] ?? 0) - cargoQuantity(saved, type);
      if (add > 0) addHarborSupply(type, add);
    });
    cy.get('[data-test=building]').rightclick();
    cy.get('[data-test=menu]').should('be.visible');
    return readVoyageSave().then((supplied) => {
      Object.entries(desired).forEach(([type, quantity]) =>
        expect(
          cargoQuantity(supplied, type as 'water'),
          `${type} provisioned`,
        ).to.be.at.least(quantity),
      );
      return cy.wrap(supplied, { log: false });
    });
  });
};

const provisionAndDepart = (
  desired?: Partial<Record<'water' | 'food' | 'lumber' | 'shot', number>>,
) => {
  prepareVoyage(desired);
  return departFromCurrentHarbor();
};

const enterHarborAfterDock = (portId: string, label: string) =>
  enterFrom(portId, null, '4', label);

const sailStop = (from: string, to: string, label: string) => {
  sailPlannedRoute(from, to, label);
  enterHarborAfterDock(to, `${label} harbor`);
};

const finishCombat = () => {
  cy.get('[data-test=finish-combat]').click();
  cy.get('[data-test=combat]').should('not.exist');
};

const retreatNaval = () => {
  cy.get('[data-test=naval-withdraw]').click();
  cy.get('[data-test=naval-retreat]').click();
  finishCombat();
};

const sailWestUntilCombat = (
  remaining = 140,
): ReturnType<typeof readVoyageSave> => {
  if (!remaining) throw new Error('M2 pursuit did not start combat');
  return readVoyageSave().then((saved) => {
    if (saved.activeCombat) {
      expect(saved.activeCombat.encounterId).to.equal('joao.m2.katarina');
      return cy
        .get('[data-test=combat]')
        .should('be.visible')
        .then(() => saved);
    }
    return cy.document().then((document) => {
      if (document.querySelector('[data-test=seaStory]')) {
        finishSeaEncounter();
        return sailWestUntilCombat(remaining - 1);
      }
      return saveFromSystem().then((observed) => {
        expect(observed.portId).to.be.null;
        closeSidebar(0);
        cy.document().trigger('keydown', { key: 'a' });
        cy.wait(350, { log: false });
        cy.document().trigger('keyup', { key: 'a' });
        return sailWestUntilCombat(remaining - 1);
      });
    });
    // Cypress 10 retains returned commands in this recursive callback's type;
    // every branch is flattened by Cypress to the latest saved State.
  }) as ReturnType<typeof readVoyageSave>;
};

const sailProvisionedPath = (
  ports: string[],
  label: string,
  checkpoints: Partial<Record<string, string>> = {},
) => {
  expect(ports.length, `${label} has a destination`).to.be.greaterThan(1);
  provisionAndDepart({ water: 40, food: 40 });
  ports.slice(1).forEach((to, index) => {
    const from = ports[index];
    sailStop(from, to, `${label}: ${from} to ${to}`);
    if (checkpoints[to]) {
      saveJourneyCheckpoint(checkpoints[to]!);
      closeSidebar();
    }
    if (index < ports.length - 2) provisionAndDepart({ water: 40, food: 40 });
  });
};

const assertJournalGeometry = (long: boolean, ending = false) => {
  cy.get('[data-test=questJournal]').should(($journal) => {
    const journal = $journal[0];
    const rect = journal.getBoundingClientRect();
    expect(rect.width, 'journal rendered width').to.be.at.most(721);
    expect(rect.height, 'journal rendered height').to.be.at.most(561);
    expect(
      journal.scrollWidth,
      'journal has no horizontal overflow',
    ).to.be.at.most(journal.clientWidth + 1);
    if (long)
      expect(
        journal.scrollHeight,
        'long journal scrolls vertically',
      ).to.be.greaterThan(journal.clientHeight);
  });
  if (ending) cy.get('[data-test=joaoEnding]').should('be.visible');
};

const openChineseJournal = () => {
  cy.contains('[data-test=left] div', /^日志$/).click();
  cy.get('[data-test=questJournal]').should('be.visible');
};

const waitAtMassawaLodgeForInvasion = (
  anchorMinutes: number,
  remaining = 45,
): ReturnType<typeof saveFromSystem> => {
  if (!remaining)
    throw new Error('Massawa invasion window did not arrive through lodging');
  return saveFromSystem().then<void>((saved) => {
    recordJourneyPhase('Massawa lodge calendar observation', saved);
    closeSidebar();
    const anchor = getCalendarParts(anchorMinutes);
    const now = getCalendarParts(saved.timePassed);
    const laterMonth = now.monthIndex > anchor.monthIndex;
    if (laterMonth && now.day >= 11) return;
    return checkInAtLodge('住店', 'Massawa lodge calendar check-in').then(
      () => {
        enterFrom('75', '5', '5', 'Massawa lodge calendar wait');
        return waitAtMassawaLodgeForInvasion(anchorMinutes, remaining - 1);
      },
    );
  });
};

const reachCayenneAppointment = (
  remaining = 8,
): ReturnType<typeof saveFromSystem> => {
  if (!remaining)
    throw new Error('Cayenne alliance window did not arrive through lodging');
  return saveFromSystem().then<void>((saved) => {
    const minute = saved.timePassed % 1440;
    closeSidebar();
    if (minute >= 540 && minute < 900) return;
    if (minute < 540) {
      settleBuildingToMenu();
      exitCurrentPortBuilding();
      enterFrom('57', '4', '4', 'Cayenne harbor appointment wait');
      return reachCayenneAppointment(remaining - 1);
    }
    settleBuildingToMenu();
    exitCurrentPortBuilding();
    enterFrom('57', '4', '5', 'Cayenne lodge for next appointment day');
    return checkInAtLodge('住店', 'Cayenne appointment-day check-in').then(
      () => {
        enterFrom('57', '5', '4', 'Cayenne next-day appointment');
        return reachCayenneAppointment(remaining - 1);
      },
    );
  });
};

const winAmazonByGunfire = (
  remaining = 9,
): ReturnType<typeof readVoyageSave> => {
  if (!remaining) throw new Error('Amazon victory did not resolve');
  return readVoyageSave().then<void>((saved) => {
    if (saved.activeCombat?.outcome === 'victory') return;
    expect(saved.activeCombat?.kind).to.equal('naval');
    cy.get('[data-test=naval-fire]').click();
    return winAmazonByGunfire(remaining - 1);
  });
};

const cycleBuildingUntilNight = (
  portId: string,
  buildingId: string,
  remaining = 30,
): Cypress.Chainable<Document> => {
  if (!remaining)
    throw new Error(
      `Port ${portId} building ${buildingId} did not reach nighttime`,
    );
  return exitCurrentPortBuilding().then<void>(() =>
    readVoyageSave().then<void>((saved) => {
      expect(saved.portId, `Port ${portId} night gate port`).to.equal(portId);
      expect(saved.buildingId, `Port ${portId} night gate exited`).to.be.null;
      recordJourneyPhase(
        `Port ${portId} building ${buildingId} post-exit time`,
        saved,
      );
      const minute = saved.timePassed % 1440;
      if (minute < 240 || minute >= 1200) return;
      enterFrom(
        portId,
        buildingId,
        buildingId,
        `Port ${portId} building ${buildingId} time cycle`,
      );
      return cycleBuildingUntilNight(portId, buildingId, remaining - 1);
    }),
  );
};

const cycleHarborUntilNight = (portId: string, remaining = 30) =>
  cycleBuildingUntilNight(portId, '4', remaining);

const walkFromBuildingAtNight = (
  portId: string,
  fromBuildingId: string,
  toBuildingId: string,
  label: string,
) =>
  cycleBuildingUntilNight(portId, fromBuildingId).then(() =>
    enterFrom(portId, fromBuildingId, toBuildingId, label),
  );

const startNightWalkAfterDock = (
  portId: string,
  toBuildingId: string,
  label: string,
) => {
  enterHarborAfterDock(portId, `${label} harbor time anchor`);
  walkFromBuildingAtNight(portId, '4', toBuildingId, label);
};

const cyclePubUntilDaytime = (
  remaining = 30,
): ReturnType<typeof readVoyageSave> => {
  if (!remaining)
    throw new Error('Ceuta pub did not reach its daytime story window');
  return readVoyageSave().then<void>((saved) => {
    const minute = saved.timePassed % 1440;
    if (minute >= 480 && minute <= 960) return;
    exitCurrentPortBuilding();
    enterFrom('27', '2', '2', 'Ceuta pub doorway time cycle');
    return cyclePubUntilDaytime(remaining - 1);
  });
};

const ensureCeutaPubWindow = () => {
  enterFrom('27', null, '4', 'Ceuta harbor before nighttime walk');
  cycleHarborUntilNight('27');
  enterFrom('27', '4', '2', 'Ceuta pub at night without pedestrians');
  cyclePubUntilDaytime();
};

describe('João complete fresh story journey', () => {
  it(
    'plays M0 through M3, including real Basra and Istanbul voyages, and comes home',
    { defaultCommandTimeout: 12_000 },
    () => {
      resetCheckpointManifest();

      playFreshChineseOpeningAndFirstVoyage('full-journey-m1', {
        requireNoSavedState: true,
      });
      saveJourneyCheckpoint('m1-complete');
      closeSidebar();
      cy.log(`Checkpoint evidence: ${checkpointRoot}`);

      // M2: investigate Ceuta, clear João's family name, and fund the long search.
      exitCurrentPortBuilding();
      // The shared opening performs a final reload while the guild overlay is
      // saved, so the underlying port player is at the normal harbor spawn.
      enterFrom('1', null, '4', 'Lisbon harbor for Ceuta');
      provisionAndDepart({ water: 35, food: 35 });
      sailPlannedRoute('1', '27', 'Lisbon to Ceuta');
      ensureCeutaPubWindow();
      completeBuildingEvent(m2('domingo-missing'));
      settleBuildingToMenu();
      walkFromBuildingAtNight('27', '2', '5', 'Ceuta lodge search');
      completeBuildingEvent(m2('lodge-search'));
      settleBuildingToMenu();
      walkFromBuildingAtNight('27', '5', '3', 'Ceuta shipyard challenge');
      advanceBuildingUntilCombat('joao.m2.kahn-shipyard');
      playDuel('victory');
      finishCombat();
      walkFromBuildingAtNight('27', '3', '4', 'Ceuta identity reveal');
      completeBuildingEvent(m2('identity-revealed'));
      prepareVoyage({ water: 35, food: 35 });
      saveJourneyCheckpoint('m2-ceuta-complete');
      closeSidebar();

      departFromCurrentHarbor();
      sailPlannedRoute('27', '1', 'Ceuta to Lisbon');

      startNightWalkAfterDock('1', '8', 'Lisbon residence challenge');
      advanceBuildingUntilCombat('joao.m2.kahn-house');
      playDuel('victory');
      finishCombat();
      walkFromBuildingAtNight('1', '8', '6', 'Lisbon palace report');
      completeBuildingEvent(m2('father-cleared'));
      settleBuildingToMenu();
      walkFromBuildingAtNight('1', '6', '8', 'Domingo farewell');
      completeBuildingEvent(m2('domingo-farewell'));
      settleBuildingToMenu();
      walkFromBuildingAtNight('1', '8', '10', 'sell earned Flamberge');
      settleBuildingToMenu();
      let goldBeforeFlambergeSale = 0;
      readVoyageSave().then((saved) => {
        goldBeforeFlambergeSale = saved.gold;
        expect(saved.items, 'earned Flamberge is available to sell').to.include(
          '13',
        );
      });
      clickMenu('出售');
      clickMenu2('焰形剑');
      cy.get('[data-test=confirmYes]').click();
      cy.get('[data-test=menu2]').should('be.visible');
      cy.get('[data-test=building]').rightclick();
      cy.get('[data-test=menu]').should('be.visible');
      saveFromSystem().then((saved) => {
        expect(
          saved.items,
          'Flamberge was sold through the shop',
        ).not.to.include('13');
        expect(saved.gold, 'Flamberge sale increased gold').to.be.greaterThan(
          goldBeforeFlambergeSale,
        );
      });
      saveJourneyCheckpoint('m2-funded-lisbon');
      closeSidebar();

      walkFromBuildingAtNight('1', '10', '4', 'Lisbon harbor for Seville');
      provisionAndDepart({ water: 35, food: 35 });
      sailPlannedRoute('1', '2', 'Lisbon to Seville');

      startNightWalkAfterDock('2', '2', 'Seville Katarina warning');
      completeBuildingEvent(m2('katarina-warning'));
      settleBuildingToMenu();
      walkFromBuildingAtNight('2', '2', '4', 'Seville pursuit departure');
      provisionAndDepart({ water: 35, food: 35 });
      sailPlannedRoute('2', '1', 'Seville to Lisbon pursuit day');
      enterHarborAfterDock('1', 'Lisbon pursuit report');
      completeBuildingEvent(m2('pursuit-first-port'));
      provisionAndDepart({ water: 35, food: 35 });
      sailWestUntilCombat();
      retreatNaval();
      saveJourneyCheckpoint('m2-katarina-retreat');
      closeSidebar();

      sailFromCurrentPosition('2', 'Katarina retreat to Seville');

      startNightWalkAfterDock('2', '2', 'Seville Ali request');
      completeBuildingEvent(m2('ali-request'));
      settleBuildingToMenu();
      walkFromBuildingAtNight(
        '2',
        '2',
        '4',
        'Seville harbor for Lisbon inquiry',
      );
      prepareVoyage({ water: 35, food: 35 });
      saveJourneyCheckpoint('m2-ali-departure');
      closeSidebar();

      departFromCurrentHarbor();
      sailPlannedRoute('2', '1', 'Seville to Lisbon inquiry');
      startNightWalkAfterDock('1', '2', 'Lisbon pub inquiry');
      completeBuildingEvent(m2('lisbon-inquiry'));
      settleBuildingToMenu();
      walkFromBuildingAtNight('1', '2', '4', 'Lisbon harbor for Basra');
      prepareVoyage({ water: 40, food: 40 });
      saveJourneyCheckpoint('m2-lisbon-inquiry');
      closeSidebar();

      departFromCurrentHarbor();

      sailStop('1', '58', 'Lisbon to Madeira');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('58', '60', 'Madeira to San Jorge');
      prepareVoyage({ water: 40, food: 40 });
      saveJourneyCheckpoint('m2-west-africa-departure');
      closeSidebar();

      departFromCurrentHarbor();
      sailStop('60', '103', 'San Jorge to Cape Town');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('103', '105', 'Cape Town to Tamatave');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('105', '73', 'Tamatave to Aden');
      provisionAndDepart({ water: 35, food: 35 });
      sailStop('73', '74', 'Aden to Hormuz');
      provisionAndDepart({ water: 25, food: 25 });
      sailPlannedRoute('74', '77', 'Hormuz to Basra');
      startNightWalkAfterDock('77', '2', 'Basra pub Sasha report');
      completeBuildingEvent(m2('sasha-found'));
      settleBuildingToMenu();
      walkFromBuildingAtNight('77', '2', '4', 'Basra harbor for Istanbul');
      prepareVoyage({ water: 35, food: 35 });
      saveJourneyCheckpoint('m2-basra-departure');
      closeSidebar();

      departFromCurrentHarbor();

      sailStop('77', '74', 'Basra to Hormuz');
      provisionAndDepart({ water: 35, food: 35 });
      sailStop('74', '73', 'Hormuz to Aden');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('73', '105', 'Aden to Tamatave');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('105', '103', 'Tamatave to Cape Town');
      prepareVoyage({ water: 40, food: 40 });
      saveJourneyCheckpoint('m2-return-cape-town');
      closeSidebar();

      departFromCurrentHarbor();
      sailStop('103', '60', 'Cape Town to San Jorge');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('60', '58', 'San Jorge to Madeira');
      provisionAndDepart({ water: 35, food: 35 });
      sailStop('58', '1', 'Madeira to Lisbon');
      prepareVoyage({ water: 35, food: 35 });
      saveJourneyCheckpoint('m2-return-lisbon');
      closeSidebar();

      departFromCurrentHarbor();
      sailPlannedRoute('1', '3', 'Lisbon to Istanbul');
      startNightWalkAfterDock('3', '5', 'Istanbul M2 report');
      completeBuildingEvent(m2('chapter-complete'));
      settleBuildingToMenu();
      saveJourneyCheckpoint('m2-complete-istanbul');
      closeSidebar();

      walkFromBuildingAtNight(
        '3',
        '5',
        '4',
        'Istanbul harbor for the uninterrupted five-day voyage',
      );
      prepareVoyage({ water: 40, food: 40 });
      departFromCurrentHarbor();
      sailPlannedRoute('3', '1', 'Istanbul to Lisbon five-day voyage');
      enterHarborAfterDock('1', 'Lisbon Ali lead after five days at sea');
      completeBuildingEvent(massawa('ali-massawa-lead'));
      readVoyageSave().then((saved) => {
        expect(saved.storyEvents).to.include(massawa('five-day-voyage'));
        expect(saved.storyEvents).to.include(massawa('ali-massawa-lead'));
      });
      settleBuildingToMenu();
      saveJourneyCheckpoint('m3-ali-lisbon');
      closeSidebar();

      sailProvisionedPath(
        ['1', '58', '60', '103', '105', '73', '75'],
        'Lisbon to Massawa lead',
      );
      saveJourneyCheckpoint('m3-massawa-arrival');
      closeSidebar();
      walkFromBuildingAtNight('75', '4', '11', 'Massawa religious house');
      cy.get('[data-test=building]').screenshot('full-m3-massawa-logical11-zh');
      completeAndExit(massawa('religious-lead'));
      walkFromBuildingAtNight('75', '11', '8', 'Massawa resistance residence');
      completeBuildingEvent(massawa('staff-request'));
      settleBuildingToMenu();
      walkFromBuildingAtNight(
        '75',
        '8',
        '4',
        'Massawa harbor after Staff request',
      );
      prepareVoyage({ water: 40, food: 40 });
      saveJourneyCheckpoint('m3-staff-request-massawa');
      closeSidebar();

      departFromCurrentHarbor();
      sailStop('75', '73', 'Massawa to Aden for Pietro commission');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('73', '105', 'Aden to Tamatave for Pietro commission');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('105', '103', 'Tamatave to Cape Town for Pietro commission');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('103', '60', 'Cape Town to San Jorge for Pietro commission');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('60', '58', 'San Jorge to Madeira for Pietro commission');
      provisionAndDepart({ water: 35, food: 35 });
      sailPlannedRoute('58', '1', 'Madeira to Lisbon for Pietro commission');
      startNightWalkAfterDock('1', '8', 'Lisbon Pietro commission');
      completeBuildingEvent(massawa('pietro-commissioned'));
      settleBuildingToMenu();
      walkFromBuildingAtNight(
        '1',
        '8',
        '4',
        'Lisbon harbor returning to Massawa',
      );
      saveJourneyCheckpoint('m3-pietro-lisbon');
      closeSidebar();
      sailProvisionedPath(
        ['1', '58', '60', '103', '105', '73', '75'],
        'Lisbon return to Massawa',
      );
      saveJourneyCheckpoint('m3-return-massawa');
      closeSidebar();

      readVoyageSave().then((saved) =>
        recordJourneyPhase('Massawa wait sequence entered', saved),
      );
      walkFromBuildingAtNight('75', '4', '8', 'Massawa wait for Pietro');
      completeBuildingEvent(massawa('waiting-for-pietro'));
      let waitingAnchor = 0;
      saveFromSystem().then((saved) => {
        waitingAnchor = saved.storyEventTimes[massawa('waiting-for-pietro')];
        expect(
          waitingAnchor,
          'Massawa wait uses its earned completion clock',
        ).to.be.a('number');
        recordJourneyPhase('Massawa waiting marker earned', saved);
      });
      closeSidebar();
      openChineseJournal();
      assertJournalGeometry(true);
      cy.get('[data-test=questJournal]').screenshot(
        'full-m3-massawa-long-date-journal-zh',
      );
      closeSidebar();
      settleBuildingToMenu();
      walkFromBuildingAtNight('75', '8', '5', 'Massawa lodge calendar wait');
      cy.then(() => waitAtMassawaLodgeForInvasion(waitingAnchor));
      walkFromBuildingAtNight('75', '5', '8', 'Massawa day-11 invasion report');
      completeBuildingEvent(massawa('invasion-authorized'));
      settleBuildingToMenu();
      readVoyageSave().then((saved) =>
        recordJourneyPhase('Massawa invasion authorized', saved),
      );
      walkFromBuildingAtNight(
        '75',
        '8',
        '4',
        'Massawa first sortie preparation',
      );
      completeBuildingEvent(massawa('first-sortie-ready'));
      settleBuildingToMenu();
      prepareVoyage({ water: 35, food: 35 });
      saveJourneyCheckpoint('m3-first-sortie-massawa');
      closeSidebar();

      departFromCurrentHarbor();
      sailToWorldCombat(
        { x: 1154, y: 530 },
        'joao.m3.ottoman-one',
        'Massawa first Ottoman sortie',
      );
      retreatNaval();
      readVoyageSave().then((saved) =>
        expect(saved.combatResults['joao.m3.ottoman-one']).to.equal('retreat'),
      );
      sailFromCurrentPosition('75', 'First Ottoman retreat to Massawa');
      enterHarborAfterDock('75', 'Massawa second sortie report');
      completeBuildingEvent(massawa('second-sortie-ready'));
      settleBuildingToMenu();
      prepareVoyage({ water: 35, food: 35 });
      saveJourneyCheckpoint('m3-second-sortie-massawa');
      closeSidebar();

      departFromCurrentHarbor();
      sailToWorldCombat(
        { x: 1154, y: 530 },
        'joao.m3.ottoman-two',
        'Massawa second Ottoman sortie',
      );
      retreatNaval();
      readVoyageSave().then((saved) => {
        expect(saved.combatResults['joao.m3.ottoman-one']).to.equal('retreat');
        expect(saved.combatResults['joao.m3.ottoman-two']).to.equal('retreat');
      });
      sailFromCurrentPosition('75', 'Second Ottoman retreat to Massawa');
      enterHarborAfterDock('75', 'Massawa defense return');
      saveJourneyCheckpoint('m3-ottoman-two-return-massawa');
      closeSidebar();

      settleBuildingToMenu();
      walkFromBuildingAtNight('75', '4', '8', 'Massawa defense report');
      completeAndExit(massawa('defense-reported'));
      walkFromBuildingAtNight(
        '75',
        '8',
        '8',
        'Massawa nighttime Staff delivery',
      );
      walkFromBuildingAtNight('75', '8', '2', 'Massawa Staff delivery');
      completeBuildingEvent(massawa('staff-received'));
      cy.contains('[data-test=left] div', /^物品$/).click();
      cy.contains('[data-overlay-panel] [role=button]', /^圣者之杖$/).click();
      cy.get('[data-test=items-content]').should('contain.text', '圣者之杖');
      cy.get('[data-test=items-content]').screenshot(
        'full-m3-staff-inventory-zh',
      );
      closeSidebar();
      settleBuildingToMenu();
      walkFromBuildingAtNight('75', '2', '8', 'Massawa Staff return');
      let fameBeforeStaff = 0;
      readVoyageSave().then((saved) => {
        fameBeforeStaff = saved.fame.adventure;
        expect(saved.items).to.include('m3-staff-of-the-saint');
      });
      completeBuildingEvent(massawa('staff-returned'));
      cy.get('[data-test=fame-adventure]').should(($fame) =>
        expect($fame.text()).to.include(String(fameBeforeStaff + 5000)),
      );
      cy.get('[data-test=portName]').should('contain.text', '阿克苏姆');
      cy.get('#game').screenshot('full-m3-staff-handin-immediate-axum-zh');
      saveFromSystem().then((saved) => {
        expect(saved.items).not.to.include('m3-staff-of-the-saint');
        expect(saved.items.filter((item) => item === '45')).to.have.length(1);
        expect(saved.fame.adventure).to.equal(fameBeforeStaff + 5000);
      });
      closeSidebar();
      settleBuildingToMenu();
      walkFromBuildingAtNight('75', '8', '4', 'Massawa reconciliation');
      completeBuildingEvent(massawa('chapter-complete'));
      settleBuildingToMenu();
      saveJourneyCheckpoint('m3-massawa-complete');
      closeSidebar();

      walkFromBuildingAtNight('75', '4', '10', 'Massawa Crown sale');
      settleBuildingToMenu();
      let goldBeforeCrownSale = 0;
      readVoyageSave().then((saved) => {
        goldBeforeCrownSale = saved.gold;
        expect(saved.items).to.include('45');
      });
      clickMenu('出售');
      clickMenu2('王冠');
      cy.get('[data-test=confirmYes]').click();
      cy.get('[data-test=menu2]').should('be.visible');
      cy.get('[data-test=building]').rightclick();
      cy.get('[data-test=menu]').should('be.visible');
      saveFromSystem().then((saved) => {
        expect(saved.items).not.to.include('45');
        expect(saved.gold).to.equal(goldBeforeCrownSale + 150000);
      });
      closeSidebar();
      walkFromBuildingAtNight('75', '10', '2', 'Massawa Japan request');
      completeBuildingEvent(finale('japan-request'));
      settleBuildingToMenu();
      walkFromBuildingAtNight('75', '2', '4', 'Massawa harbor for Nagasaki');
      saveJourneyCheckpoint('m3-japan-request-massawa');
      closeSidebar();

      sailProvisionedPath(
        ['75', '73', '93', '84', '87', '96', '100'],
        'Massawa to Nagasaki',
        {
          '93': 'm3-calicut-outbound',
          '87': 'm3-malacca-outbound',
        },
      );
      let fameBeforeFarewell = 0;
      readVoyageSave().then((saved) => {
        fameBeforeFarewell = saved.fame.adventure;
        expect(saved.fleets['1'].ships).to.have.length(1);
      });
      completeBuildingEvent(finale('enrico-farewell'));
      cy.get('[data-test=fame-adventure]').should(($fame) =>
        expect($fame.text()).to.include(String(fameBeforeFarewell + 1000)),
      );
      saveFromSystem().then((saved) => {
        expect(saved.fame.adventure).to.equal(fameBeforeFarewell + 1000);
        expect(saved.mates.some(({ sailorId }) => sailorId === '33')).to.equal(
          false,
        );
        expect(saved.fleets['1'].ships).to.have.length(1);
      });
      closeSidebar();
      settleBuildingToMenu();
      prepareVoyage({ water: 40, food: 40 });
      saveJourneyCheckpoint('m3-nagasaki-farewell');
      closeSidebar();

      departFromCurrentHarbor();
      sailStop('100', '96', 'Nagasaki to Macao');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('96', '87', 'Macao to Malacca');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('87', '84', 'Malacca to Ceylon');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('84', '93', 'Ceylon to Calicut');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('93', '73', 'Calicut to Aden');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('73', '105', 'Aden to Tamatave after Nagasaki');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('105', '103', 'Tamatave to Cape Town after Nagasaki');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('103', '60', 'Cape Town to San Jorge after Nagasaki');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('60', '58', 'San Jorge to Madeira after Nagasaki');
      provisionAndDepart({ water: 35, food: 35 });
      sailPlannedRoute('58', '1', 'Madeira to Lisbon letter notice');
      enterHarborAfterDock('1', 'Lisbon letter notice');
      completeAndExit(finale('letter-notice'));
      enterFrom('1', '4', '4', 'Lisbon nighttime guild walk');
      walkFromBuildingAtNight('1', '4', '7', 'Lisbon guild letter');
      completeBuildingEvent(finale('enrico-letter'));
      settleBuildingToMenu();
      walkFromBuildingAtNight('1', '7', '4', 'Lisbon harbor for Sakai');
      prepareVoyage({ water: 40, food: 40 });
      saveJourneyCheckpoint('m3-lisbon-letter');
      closeSidebar();

      departFromCurrentHarbor();
      sailStop('1', '58', 'Lisbon to Madeira for Sakai');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('58', '60', 'Madeira to San Jorge for Sakai');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('60', '103', 'San Jorge to Cape Town for Sakai');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('103', '105', 'Cape Town to Tamatave for Sakai');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('105', '73', 'Tamatave to Aden for Sakai');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('73', '93', 'Aden to Calicut for Sakai');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('93', '84', 'Calicut to Ceylon for Sakai');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('84', '87', 'Ceylon to Malacca for Sakai');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('87', '96', 'Malacca to Macao for Sakai');
      provisionAndDepart({ water: 35, food: 35 });
      sailPlannedRoute('96', '99', 'Macao to Sakai guild lead');
      startNightWalkAfterDock('99', '7', 'Sakai guild lead');
      completeBuildingEvent(finale('sakai-lead'));
      settleBuildingToMenu();
      walkFromBuildingAtNight('99', '7', '4', 'Sakai harbor for Cayenne');
      prepareVoyage({ water: 40, food: 40 });
      saveJourneyCheckpoint('m3-sakai-lead');
      closeSidebar();

      departFromCurrentHarbor();
      sailStop('99', '96', 'Sakai to Macao for Cayenne');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('96', '87', 'Macao to Malacca for Cayenne');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('87', '84', 'Malacca to Ceylon for Cayenne');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('84', '93', 'Ceylon to Calicut for Cayenne');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('93', '73', 'Calicut to Aden for Cayenne');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('73', '105', 'Aden to Tamatave for Cayenne');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('105', '103', 'Tamatave to Cape Town for Cayenne');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('103', '60', 'Cape Town to San Jorge for Cayenne');
      provisionAndDepart({ water: 40, food: 40 });
      sailStop('60', '58', 'San Jorge to Madeira for Cayenne');
      provisionAndDepart({ water: 40, food: 40 });
      sailPlannedRoute('58', '57', 'Madeira to Cayenne');
      enterHarborAfterDock('57', 'Cayenne South America arrival');
      completeAndExit(finale('south-america-arrival'));
      enterFrom('57', '4', '4', 'Cayenne nighttime Pub walk');
      walkFromBuildingAtNight('57', '4', '2', 'Cayenne Rudolph duel');
      advanceBuildingUntilCombat('joao.m3.rudolph');
      playDuel('victory');
      finishCombat();
      completeBuildingEvent(finale('lucia-rescued'));
      settleBuildingToMenu();
      walkFromBuildingAtNight('57', '2', '4', 'Cayenne Martinez report');
      completeBuildingEvent(finale('martinez-exposed'));
      settleBuildingToMenu();
      walkFromBuildingAtNight('57', '4', '5', 'Cayenne lodge before alliance');
      checkInAtLodge('住店', 'Cayenne pre-alliance check-in');
      saveJourneyCheckpoint('m3-cayenne-preappointment');
      closeSidebar();
      enterFrom('57', '5', '4', 'Cayenne alliance appointment');
      reachCayenneAppointment();
      cy.get('[data-test=building]').should(
        'contain.text',
        '西班牙会与你共同对抗',
      );
      cy.get('[data-test=building]').screenshot('full-m3-rendezvous-valid-zh');
      completeBuildingEvent(finale('spanish-alliance'));
      settleBuildingToMenu();
      walkFromBuildingAtNight('57', '4', '3', 'Cayenne shipyard before Amazon');
      settleBuildingToMenu();
      clickMenu('修理');
      clickMenu2('Hermes II');
      cy.get('[data-test=confirmYes]').click();
      cy.get('[data-test=building]').click();
      cy.get('[data-test=menu]').should('be.visible');
      readVoyageSave().then((saved) =>
        expect(saved.fleets['1'].ships[0].durability).to.equal(30),
      );
      walkFromBuildingAtNight('57', '3', '4', 'Cayenne harbor for Amazon');
      prepareVoyage({ water: 35, food: 35, shot: 8 });
      saveJourneyCheckpoint('m3-cayenne-alliance');
      closeSidebar();

      departFromCurrentHarbor();
      sailToWorldCombat(
        { x: 598, y: 645 },
        'joao.m3.amazon',
        'Cayenne to Amazon battle',
      );
      readVoyageSave().then((saved) => {
        expect(saved.activeCombat?.encounterId).to.equal('joao.m3.amazon');
        expect(cargoQuantity(saved, 'shot')).to.equal(8);
        expect(saved.fleets['1'].ships[0].durability).to.equal(30);
      });
      winAmazonByGunfire();
      finishCombat();
      finishSeaEncounter();
      saveFromSystem().then((saved) => {
        expect(saved.combatResults['joao.m3.amazon']).to.equal('victory');
        expect(saved.storyEvents).to.include(finale('amazon-victory'));
        expect(cargoQuantity(saved, 'shot')).to.equal(0);
        expect(saved.fleets['1'].ships[0].durability).to.equal(2);
      });
      saveJourneyCheckpoint('m3-amazon-victory');
      closeSidebar();

      sailFromCurrentPosition('57', 'Amazon victory return to Cayenne');
      enterHarborAfterDock('57', 'Cayenne harbor after Amazon victory');
      sailProvisionedPath(['57', '58', '1'], 'Cayenne to Lisbon homecoming');
      walkFromBuildingAtNight('1', '4', '8', 'Lisbon homecoming residence');
      let endingFame = 0;
      completeBuildingEvent(finale('homecoming'));
      saveFromSystem().then((saved) => {
        endingFame = saved.fame.adventure;
        expect(saved.storyEvents).to.include(finale('homecoming'));
        expect(saved.combatResults['joao.m3.amazon']).to.equal('victory');
        expect(saved.portId).to.equal('1');
        expect(saved.buildingId).to.equal('8');
        expect(saved.items).not.to.include('m3-staff-of-the-saint');
        expect(saved.items).not.to.include('45');
      });
      closeSidebar();
      openChineseJournal();
      cy.get('[data-test=questJournal]').should(
        'contain.text',
        '约翰主线已完成',
      );
      assertJournalGeometry(true, true);
      cy.get('[data-test=questJournal]').screenshot(
        'full-m3-ending-homecoming-zh',
      );
      closeSidebar();
      saveJourneyCheckpoint('m3-homecoming');
      cy.contains('button', /^(读取|Load)$/).click();
      cy.contains('游戏加载中……').should('not.exist');
      openChineseJournal();
      cy.get('[data-test=questJournal]').should('contain.text', '约翰归家');
      assertJournalGeometry(true, true);
      closeSidebar();
      saveFromSystem();
      cy.get('#locale-select').select('en');
      closeSidebar();
      cy.contains('[data-test=left] div', /^Journal$/).click();
      cy.get('[data-test=questJournal]').should(
        'contain.text',
        'The main story is complete. You can continue exploring.',
      );
      assertJournalGeometry(true, true);
      cy.get('[data-test=questJournal]').screenshot(
        'full-m3-ending-homecoming-en',
      );
      closeSidebar();
      settleBuildingToMenu();
      exitCurrentPortBuilding();
      enterHarborAfterDock('1', 'post-ending Lisbon harbor anchor');
      walkFromBuildingAtNight('1', '4', '8', 'post-ending Lisbon residence');
      cy.get('[data-test=building]').should(
        'contain.text',
        'Welcome home, João',
      );
      cy.get('[data-test=building]').screenshot(
        'full-m3-ending-home-revisited-en',
      );
      saveFromSystem().then((saved) => {
        expect(
          saved.storyEvents.filter((event) => event === finale('homecoming')),
        ).to.have.length(1);
        expect(saved.storyEvents).not.to.include(finale('home-revisited'));
        expect(saved.fame.adventure).to.equal(endingFame);
        expect(saved.items).not.to.include('45');
      });

      // Keep the terminal marker explicit after the visible ending and revisit.
      readVoyageSave().then((saved) =>
        expect(saved.storyEvents, 'M3 ending reached').to.include(
          finale('homecoming'),
        ),
      );
    },
  );
});
