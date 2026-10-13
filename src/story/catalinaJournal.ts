import type { State } from '../state/state';
import type { JournalEntry } from './firstVoyageJournal';
import {
  KATARINA_CAYENNE_RESCUE_EVENT_ID,
  KATARINA_CEUTA_CLASH_EVENT_ID,
  KATARINA_ENDING_EVENT_ID,
  KATARINA_MASSAWA_TRUTH_EVENT_ID,
  KATARINA_SEVILLE_MUTINY_EVENT_ID,
  KATARINA_SPANISH_PURSUIT_EVENT_ID,
} from './content/arcs/katarina/vengeance';

export const getCatalinaJournal = (state: State): JournalEntry[] => {
  const completedEvents = new Set(state.storyEvents ?? []);
  const endingDone = completedEvents.has(KATARINA_ENDING_EVENT_ID);
  const patrolWon =
    endingDone || state.combatResults['katarina.seville-patrol'] === 'victory';
  const joaoWon =
    endingDone || state.combatResults['katarina.joao-fleet'] === 'victory';
  const cayenneWon =
    endingDone || state.combatResults['katarina.cayenne-duel'] === 'victory';
  const amazonDiscovered =
    endingDone || state.discoveries.includes('mouth-of-the-amazon');
  const martinezWon =
    endingDone || state.combatResults['katarina.amazon-martinez'] === 'victory';

  return [
    {
      id: 'katarina-seville-mutiny',
      title: 'Commandeer the Rebellion',
      body: 'Meet Lieutenant Emilio at the Seville harbor and seize the caravel Rebellion to avenge Michael and Hernan.',
      completed:
        endingDone || completedEvents.has(KATARINA_SEVILLE_MUTINY_EVENT_ID),
    },
    {
      id: 'katarina-spanish-pursuit',
      title: 'Break the Spanish Blockade',
      body: completedEvents.has(KATARINA_SPANISH_PURSUIT_EVENT_ID)
        ? 'Defeat the Spanish pursuit squadron at sea, or sortie again from the Seville harbor.'
        : 'Set sail from Seville and break through the Spanish Armada pursuit squadron.',
      completed: patrolWon,
    },
    {
      id: 'katarina-ceuta-clash',
      title: 'Intercept the Franco Fleet at Ceuta',
      body: completedEvents.has(KATARINA_CEUTA_CLASH_EVENT_ID)
        ? 'Defeat the Franco expedition vanguard, or sortie again from the Ceuta harbor.'
        : 'Track the Portuguese Franco expedition to the Ceuta pub and confront their fleet.',
      completed: joaoWon,
    },
    {
      id: 'katarina-massawa-truth',
      title: 'Uncover the Conspiracy in Massawa',
      body: 'Pursue João Franco around Africa to the Massawa pub on the Red Sea and learn who truly ambushed Michael.',
      completed:
        endingDone || completedEvents.has(KATARINA_MASSAWA_TRUTH_EVENT_ID),
    },
    {
      id: 'katarina-cayenne-rescue',
      title: 'Rescue Emilio in Cayenne',
      body: completedEvents.has(KATARINA_CAYENNE_RESCUE_EVENT_ID)
        ? 'Defeat the colonial commandant at the Cayenne lodge in a sword duel.'
        : 'Sail west across the Atlantic to the Cayenne lodge in South America.',
      completed: cayenneWon,
    },
    {
      id: 'katarina-amazon-discovery',
      title: 'Chart the Mouth of the Amazon',
      body: 'Locate the Mouth of the Amazon near 0.5° S, 50.0° W where Marquis Martinez gathers his armada.',
      completed: amazonDiscovered,
    },
    {
      id: 'katarina-amazon-reckoning',
      title: 'Crush Marquis Martinez’s Flagship',
      body: 'Sortie from the Cayenne harbor and defeat Marquis Martinez’s flagship.',
      completed: martinezWon,
    },
    {
      id: 'katarina-seville-homecoming',
      title: 'Return to the Seville Royal Palace',
      body: 'Return to the Seville palace to clear your name and claim your royal pardon.',
      completed: endingDone,
    },
  ];
};

export default getCatalinaJournal;
