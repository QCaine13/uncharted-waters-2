import { characterId, type StoryArc } from '../../../../core/types';
import { MASSAWA_ARC_ID, massawaEvents } from './events';

export { massawaDialogue } from './dialogue';
export * from './events';

export const massawaArc: StoryArc = {
  id: MASSAWA_ARC_ID,
  protagonist: characterId('joao'),
  title: 'João: Massawa and the Staff',
  eventIds: massawaEvents.map(({ id }) => id),
};

export const joaoMassawa = {
  arc: massawaArc,
  events: massawaEvents,
};

export default joaoMassawa;
