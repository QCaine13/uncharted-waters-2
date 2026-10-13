import type { State } from '../state/state';
import type { JournalEntry } from './firstVoyageJournal';
import {
  ALI_ADEN_CORSAIRS_EVENT_ID,
  ALI_ALEXANDRIA_SPICE_EVENT_ID,
  ALI_BASRA_REUNION_EVENT_ID,
  ALI_ENDING_EVENT_ID,
  ALI_ISTANBUL_WINDFALL_EVENT_ID,
  ALI_LISBON_SEARCH_EVENT_ID,
} from './content/arcs/ali/merchant';

export const getAliJournal = (state: State): JournalEntry[] => {
  const completedEvents = new Set(state.storyEvents ?? []);
  const endingDone = completedEvents.has(ALI_ENDING_EVENT_ID);
  const adenWon =
    endingDone || state.combatResults['ali.red-sea-raiders'] === 'victory';

  return [
    {
      id: 'ali-istanbul-windfall',
      title: 'Accept Salim’s Seed Capital in Istanbul',
      body: 'Meet Salim at the Istanbul harbor to receive the dhow Hugli and two thousand gold in trading capital.',
      completed:
        endingDone || completedEvents.has(ALI_ISTANBUL_WINDFALL_EVENT_ID),
    },
    {
      id: 'ali-alexandria-spice',
      title: 'Close the Spice Bargain in Alexandria',
      body: 'Sail south to the Alexandria market to trade eastern spices and ask after your sister Sasha.',
      completed:
        endingDone || completedEvents.has(ALI_ALEXANDRIA_SPICE_EVENT_ID),
    },
    {
      id: 'ali-lisbon-search',
      title: 'Follow Sasha’s Trail to Lisbon Pub',
      body: 'Visit the Lisbon pub to hear Lucia and João Franco’s account of Sasha’s eastern voyage.',
      completed: endingDone || completedEvents.has(ALI_LISBON_SEARCH_EVENT_ID),
    },
    {
      id: 'ali-aden-corsairs',
      title: 'Defend the Spice Convoy at Aden',
      body: completedEvents.has(ALI_ADEN_CORSAIRS_EVENT_ID)
        ? 'Defeat the Red Sea raiders outside Aden, or sortie again from the Aden harbor.'
        : 'Sail around Africa to the Aden harbor and protect the eastern merchant convoy from Red Sea raiders.',
      completed: adenWon,
    },
    {
      id: 'ali-basra-reunion',
      title: 'Reunite with Sasha in Basra',
      body: 'Enter the Persian Gulf and visit the Basra pub to reunite with your sister Sasha.',
      completed: endingDone || completedEvents.has(ALI_BASRA_REUNION_EVENT_ID),
    },
    {
      id: 'ali-istanbul-grand-vizier',
      title: 'Answer the Sultan’s Summons in Istanbul',
      body: 'Return to the Istanbul Royal Palace to be honored as the greatest merchant prince of the realm.',
      completed: endingDone,
    },
  ];
};

export default getAliJournal;
