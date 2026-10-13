import type { State } from '../state/state';
import type { JournalEntry } from './firstVoyageJournal';
import {
  PIETRO_ALEXANDRIA_RELIC_EVENT_ID,
  PIETRO_BASRA_STAFF_EVENT_ID,
  PIETRO_CAYENNE_FLEET_EVENT_ID,
  PIETRO_ENDING_EVENT_ID,
  PIETRO_GENOA_DEPARTURE_EVENT_ID,
  PIETRO_LISBON_PATRONAGE_EVENT_ID,
  PIETRO_MASSAWA_HANDOFF_EVENT_ID,
} from './content/arcs/pietro/adventure';

export const getPietroJournal = (state: State): JournalEntry[] => {
  const completedEvents = new Set(state.storyEvents ?? []);
  const endingDone = completedEvents.has(PIETRO_ENDING_EVENT_ID);
  const gibraltarDiscovered =
    endingDone || state.discoveries.includes('strait-of-gibraltar');
  const basraWon =
    endingDone || state.combatResults['pietro.basra-raider'] === 'victory';
  const amazonDiscovered =
    endingDone || state.discoveries.includes('mouth-of-the-amazon');
  const eldoradoWon =
    endingDone || state.combatResults['pietro.eldorado-fleet'] === 'victory';

  return [
    {
      id: 'pietro-genoa-departure',
      title: 'Embark from Genoa',
      body: 'Meet Camillo at the Genoa harbor to board the Sanuto and answer Duchess Christiana’s summons.',
      completed:
        endingDone || completedEvents.has(PIETRO_GENOA_DEPARTURE_EVENT_ID),
    },
    {
      id: 'pietro-lisbon-patronage',
      title: 'Secure Patronage at the Franco Residence',
      body: 'Visit Duchess Christiana and Butler Marco at the Franco residence in Lisbon.',
      completed:
        endingDone || completedEvents.has(PIETRO_LISBON_PATRONAGE_EVENT_ID),
    },
    {
      id: 'pietro-gibraltar-discovery',
      title: 'Sight the Strait of Gibraltar',
      body: 'Chart the Strait of Gibraltar near 36° N, 5.6° W on your voyage between Lisbon and the Mediterranean.',
      completed: gibraltarDiscovered,
    },
    {
      id: 'pietro-alexandria-relic',
      title: 'Investigate the Alexandria Tavern',
      body: 'Gather clues about your father’s logbook and the Staff of the Saint at the Alexandria pub.',
      completed:
        endingDone || completedEvents.has(PIETRO_ALEXANDRIA_RELIC_EVENT_ID),
    },
    {
      id: 'pietro-basra-staff',
      title: 'Win the Staff of the Saint in Basra',
      body: completedEvents.has(PIETRO_BASRA_STAFF_EVENT_ID)
        ? 'Defeat the treasure hunter boss in a duel at the Basra market.'
        : 'Sail around Africa to the Persian Gulf and visit the Basra market.',
      completed: basraWon,
    },
    {
      id: 'pietro-massawa-handoff',
      title: 'Rendezvous with João in Massawa',
      body: 'Deliver the Staff of the Saint to João Franco at the Massawa harbor and receive the Western Ocean charts.',
      completed:
        endingDone || completedEvents.has(PIETRO_MASSAWA_HANDOFF_EVENT_ID),
    },
    {
      id: 'pietro-amazon-discovery',
      title: 'Sight the Mouth of the Amazon',
      body: 'Cross the Atlantic to South America and chart the Mouth of the Amazon near 0.5° S, 50.0° W.',
      completed: amazonDiscovered,
    },
    {
      id: 'pietro-cayenne-fleet',
      title: 'Break the El Dorado Blockade',
      body: completedEvents.has(PIETRO_CAYENNE_FLEET_EVENT_ID)
        ? 'Defeat the El Dorado guardian fleet from the Cayenne harbor.'
        : 'Visit the Cayenne harbor after sighting the Mouth of the Amazon.',
      completed: eldoradoWon,
    },
    {
      id: 'pietro-lisbon-triumph',
      title: 'Report Your Triumph in Lisbon',
      body: 'Return to the Franco residence in Lisbon to celebrate the discovery of El Dorado and clear your family’s name.',
      completed: endingDone,
    },
  ];
};

export default getPietroJournal;
