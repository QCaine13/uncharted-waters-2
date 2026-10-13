import type { State } from '../state/state';
import type { JournalEntry } from './firstVoyageJournal';
import {
  OTTO_CEUTA_SKIRMISH_EVENT_ID,
  OTTO_ENDING_EVENT_ID,
  OTTO_LONDON_COMMISSION_EVENT_ID,
  OTTO_NANTES_SHOWDOWN_EVENT_ID,
  OTTO_SANTO_DOMINGO_RAID_EVENT_ID,
  OTTO_SEVILLE_INFILTRATION_EVENT_ID,
} from './content/arcs/otto/armada';

export const getOttoJournal = (state: State): JournalEntry[] => {
  const completedEvents = new Set(state.storyEvents ?? []);
  const endingDone = completedEvents.has(OTTO_ENDING_EVENT_ID);
  const ceutaWon =
    endingDone || state.combatResults['otto.spanish-vanguard'] === 'victory';
  const caribbeanWon =
    endingDone || state.combatResults['otto.caribbean-convoy'] === 'victory';
  const armadaWon =
    endingDone || state.combatResults['otto.invincible-armada'] === 'victory';

  return [
    {
      id: 'otto-london-commission',
      title: 'Receive the Royal Commission in London',
      body: 'Visit the London Royal Palace with Matthew Roy to receive King Henry VIII’s Letter of Marque and the flagship HMS Eagle.',
      completed:
        endingDone || completedEvents.has(OTTO_LONDON_COMMISSION_EVENT_ID),
    },
    {
      id: 'otto-seville-infiltration',
      title: 'Seize the Galleon in Seville',
      body: 'Slip into the Seville shipyard and capture a brand-new Spanish Galleon right off the slipway.',
      completed:
        endingDone || completedEvents.has(OTTO_SEVILLE_INFILTRATION_EVENT_ID),
    },
    {
      id: 'otto-ceuta-skirmish',
      title: 'Break the Gibraltar Squadron at Ceuta',
      body: completedEvents.has(OTTO_CEUTA_SKIRMISH_EVENT_ID)
        ? 'Defeat Commander Ezequiel’s Spanish Gibraltar vanguard, or sortie again from the Ceuta harbor.'
        : 'Sail to the Ceuta harbor and test your captured galleon against the Spanish Gibraltar squadron.',
      completed: ceutaWon,
    },
    {
      id: 'otto-santo-domingo-raid',
      title: 'Intercept the Treasure Convoy at Santo Domingo',
      body: completedEvents.has(OTTO_SANTO_DOMINGO_RAID_EVENT_ID)
        ? 'Defeat the Spanish Caribbean treasure convoy, or sortie again from the Santo Domingo harbor.'
        : 'Cross the Atlantic to the Santo Domingo harbor in the Caribbean and raid Spain’s silver convoy.',
      completed: caribbeanWon,
    },
    {
      id: 'otto-nantes-showdown',
      title: 'Shatter the Invincible Armada at Nantes',
      body: completedEvents.has(OTTO_NANTES_SHOWDOWN_EVENT_ID)
        ? 'Defeat Commander Ezequiel’s Invincible Armada in the Bay of Biscay, or sortie again from the Nantes harbor.'
        : 'Return to Europe and confront the full might of the Spanish Invincible Armada at the Nantes harbor.',
      completed: armadaWon,
    },
    {
      id: 'otto-london-triumph',
      title: 'Return in Triumph to London Palace',
      body: 'Report the defeat of the Invincible Armada at the London Royal Palace.',
      completed: endingDone,
    },
  ];
};

export default getOttoJournal;
