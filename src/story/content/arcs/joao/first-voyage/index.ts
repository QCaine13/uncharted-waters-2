import { characterId, type StoryArc } from '../../../../core/types';
import { FIRST_VOYAGE_ARC_ID, firstVoyageEvents } from './events';

export { firstVoyageDialogue } from './dialogue';
export {
  CHAPTER_COMPLETE_EVENT_ID,
  COMMISSION_ACCEPTED_EVENT_ID,
  DOMINGO_MET_EVENT_ID,
  DOMINGO_RECRUITED_EVENT_ID,
  FIRST_VOYAGE_ARC_ID,
  GIBRALTAR_DISCOVERY_ID,
  firstVoyageEvents,
} from './events';

export const firstVoyageArc: StoryArc = {
  id: FIRST_VOYAGE_ARC_ID,
  protagonist: characterId('joao'),
  title: 'João: First Voyage',
  eventIds: firstVoyageEvents.map(({ id }) => id),
};

export const joaoFirstVoyage = {
  arc: firstVoyageArc,
  events: firstVoyageEvents,
};

export default joaoFirstVoyage;
