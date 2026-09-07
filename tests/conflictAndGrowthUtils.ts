import type { State } from '../src/state/state';
import { SAVED_STATE_KEY } from '../src/state/state';
import type { DuelAttack, DuelDefense } from '../src/combat/types';
import { readVoyageSave } from './firstVoyageUtils';

// Synthetic, valid M1 completion fixture. No M2 battle/result is pre-completed.
// Keeping version 5 and omitting M2 fields exercises the actual save migration.
export const completedM1Fixture = (
  overrides: Partial<State> = {},
): Partial<State> & { version: number } => ({
  version: 5,
  portId: '1',
  buildingId: null,
  timePassed: 12000,
  dayAtSea: 0,
  gold: 1800,
  savings: 0,
  debt: 0,
  quests: [
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
  ],
  usedShipsAtPort: {},
  items: ['53', '4'],
  mates: [
    {
      sailorId: '1',
      role: 0,
    },
    {
      sailorId: '32',
      role: null,
    },
    {
      sailorId: '33',
      role: null,
    },
    {
      sailorId: '34',
      role: null,
    },
  ],
  fame: {
    adventure: 30,
    pirate: 0,
    trade: 0,
  },
  marketPrices: {},
  discoveries: ['strait-of-gibraltar'],
  reportedDiscoveries: ['strait-of-gibraltar'],
  storyEvents: [
    'joao.lisbon-opening.house-introduction',
    'joao.lisbon-opening.pub-before-introduction',
    'joao.lisbon-opening.pub-farewell',
    'joao.lisbon-opening.item-shop-rapier',
    'joao.lisbon-opening.shipyard-hermes-ii',
    'joao.lisbon-opening.church-before-introduction',
    'joao.lisbon-opening.church-recruit-enrico',
    'joao.lisbon-opening.church-enrico-gift',
    'joao.lisbon-opening.house-mother-farewell',
    'joao.lisbon-opening.harbor-final',
    'joao.first-voyage.commission-accepted',
    'joao.first-voyage.domingo-met',
    'joao.first-voyage.domingo-recruited',
    'joao.first-voyage.chapter-complete',
    'future-preserved-event',
  ],
  fleets: {
    '1': {
      position: {
        x: 838,
        y: 358,
      },
      ships: [
        {
          id: '6',
          name: 'Hermes II',
          crew: 10,
          durability: 25,
          cargo: [
            {
              type: 'water',
              quantity: 18,
            },
            {
              type: 'food',
              quantity: 18,
            },
          ],
        },
      ],
    },
  },
  ...overrides,
});

export const installM1Fixture = (
  targetWindow: Window,
  overrides: Partial<State> = {},
) =>
  targetWindow.localStorage.setItem(
    SAVED_STATE_KEY,
    JSON.stringify(completedM1Fixture(overrides)),
  );

const stoppedAttack: Record<DuelDefense, DuelAttack> = {
  parry: 'thrust',
  block: 'slash',
  dodge: 'heavy',
};
const matchingDefense: Record<DuelAttack, DuelDefense> = {
  thrust: 'parry',
  slash: 'block',
  heavy: 'dodge',
};

// Inspect the real saved intent, then click the same visible buttons a player
// uses. This helper never edits HP, outcomes, experience, or story progress.
export const playDuel = (
  desired: 'victory' | 'defeat' | 'draw',
  remaining = 45,
): Cypress.Chainable<void> => {
  if (remaining === 0) throw new Error(`Duel did not reach ${desired}`);
  return readVoyageSave().then((saved) => {
    const combat = saved.activeCombat;
    if (!combat) throw new Error('No active combat while playing duel');
    const duel = combat.kind === 'duel' ? combat : combat.boardingDuel;
    if (!duel) {
      const resolved = combat.log[combat.log.length - 1];
      expect(
        resolved?.key,
        'captain duel resolved through the naval rules',
      ).to.equal('combat.naval.challenge-result');
      expect(resolved.data.duelOutcome).to.equal(desired);
      return;
    }
    if (duel.outcome !== null) {
      expect(duel.outcome, 'outcome earned through combat controls').to.equal(
        desired,
      );
      return;
    }
    if (duel.phase === 'attack') {
      const attack =
        desired === 'victory'
          ? duel.enemyDefense === 'parry'
            ? 'slash'
            : 'thrust'
          : stoppedAttack[duel.enemyDefense];
      cy.get(`[data-test=duel-attack-${attack}]`).click();
    } else {
      const correct = matchingDefense[duel.enemyAttack];
      const defense =
        desired === 'defeat'
          ? correct === 'parry'
            ? 'block'
            : 'parry'
          : correct;
      cy.get(`[data-test=duel-defend-${defense}]`).click();
    }
    readVoyageSave().then((next) => {
      expect(
        next.activeCombat?.revision,
        'accepted action saved a new revision',
      ).to.be.greaterThan(combat.revision);
    });
    return playDuel(desired, remaining - 1);
  });
};

// Advance visible dialogue until its actual terminal effect stores the marker.
// A static menu or a missing story fails instead of injecting completion.
export const completeBuildingEvent = (
  eventId: string,
  remaining = 35,
): Cypress.Chainable<void> => {
  if (remaining === 0)
    throw new Error(`Story event did not finish: ${eventId}`);
  return readVoyageSave().then((saved) => {
    if (saved.storyEvents.includes(eventId)) return;
    if (saved.activeCombat) {
      throw new Error(`Unexpected combat before completing ${eventId}`);
    }
    return cy
      .get('[data-test=building]')
      .should('be.visible')
      .then(($building) => {
        const building = $building[0];
        const before = building.textContent;
        if (building.querySelector('[data-test=confirmYes]')) {
          cy.get('[data-test=building] [data-test=confirmYes]').click();
        } else {
          cy.get('[data-test=building]').click();
        }
        cy.document().should((next) => {
          const after = JSON.parse(
            next.defaultView!.localStorage.getItem(SAVED_STATE_KEY)!,
          ) as State;
          expect(
            after.storyEvents.includes(eventId) ||
              next.querySelector('[data-test=building]')?.textContent !==
                before,
            `dialogue or completion changes for ${eventId}`,
          ).to.equal(true);
        });
        return completeBuildingEvent(eventId, remaining - 1);
      });
  });
};

// Repeatable rematches and retries do not get a fresh completion marker. Walk
// the visible dialogue until the production effect creates a new combat.
export const advanceBuildingUntilCombat = (
  encounterId: string,
  remaining = 35,
): Cypress.Chainable<void> => {
  if (remaining === 0)
    throw new Error(`Story dialogue did not start combat: ${encounterId}`);
  return readVoyageSave().then((saved) => {
    if (saved.activeCombat) {
      expect(saved.activeCombat.encounterId).to.equal(encounterId);
      return;
    }
    return cy
      .get('[data-test=building]')
      .should('be.visible')
      .then(($building) => {
        const building = $building[0];
        const before = building.textContent;
        if (building.querySelector('[data-test=confirmYes]')) {
          cy.get('[data-test=building] [data-test=confirmYes]').click();
        } else {
          cy.get('[data-test=building]').click();
        }
        cy.document().should((next) => {
          const after = JSON.parse(
            next.defaultView!.localStorage.getItem(SAVED_STATE_KEY)!,
          ) as State;
          expect(
            after.activeCombat?.encounterId === encounterId ||
              next.querySelector('[data-test=building]')?.textContent !==
                before,
            `dialogue advances toward ${encounterId}`,
          ).to.equal(true);
        });
        return advanceBuildingUntilCombat(encounterId, remaining - 1);
      });
  });
};

// Verified safe 2×2 ship footprints in the shipped production world tilemap.
// Location fixtures skip travel explicitly; all earned progress is carried over.
const safePortAnchors = {
  '1': { x: 838, y: 358 },
  '2': { x: 862, y: 374 },
  '3': { x: 1072, y: 342 },
  '27': { x: 864, y: 382 },
  '77': { x: 1192, y: 426 },
};

export const visitFacilityFixture = (
  portId: keyof typeof safePortAnchors,
  buildingId: string | null,
) =>
  readVoyageSave().then((saved) => {
    if (saved.activeCombat) {
      throw new Error(
        'Finish the real combat before relocating a travel fixture',
      );
    }
    const minutesToday = saved.timePassed % 1440;
    const nextMorning =
      saved.timePassed - minutesToday + 600 + (minutesToday > 600 ? 1440 : 0);
    return cy.visit('', {
      onBeforeLoad(window) {
        window.localStorage.setItem(
          SAVED_STATE_KEY,
          JSON.stringify({
            ...saved,
            portId,
            buildingId,
            timePassed: nextMorning,
            dayAtSea: 0,
            fleets: {
              ...saved.fleets,
              '1': { ...saved.fleets['1'], position: safePortAnchors[portId] },
            },
          }),
        );
      },
    });
  });
