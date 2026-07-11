import { characterId, type StoryArc } from '../../../../core/types';
import { lisbonOpeningArcId, lisbonOpeningEvents } from './events';

export { legacyToSemanticEvent, lisbonOpeningDialogue } from './dialogue';
export { lisbonOpeningArcId, lisbonOpeningEvents } from './events';

export const lisbonOpeningArc: StoryArc = {
  id: lisbonOpeningArcId,
  protagonist: characterId('joao'),
  title: 'João: Lisbon Opening',
  eventIds: lisbonOpeningEvents.map(({ id }) => id),
};

export const joaoLisbonOpening = {
  arc: lisbonOpeningArc,
  events: lisbonOpeningEvents,
};

export default joaoLisbonOpening;
