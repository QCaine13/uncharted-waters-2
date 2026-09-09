import { characterId, type StoryArc } from '../../../../core/types';
import { finaleEvents, JOAO_FINALE_ARC_ID } from './events';

export { finaleDialogue } from './dialogue';
export * from './events';

export const finaleArc: StoryArc = {
  id: JOAO_FINALE_ARC_ID,
  protagonist: characterId('joao'),
  title: 'João: Japan, Lucia, and the Amazon',
  eventIds: finaleEvents.map(({ id }) => id),
};

export const joaoFinale = {
  arc: finaleArc,
  events: finaleEvents,
};

export default joaoFinale;
