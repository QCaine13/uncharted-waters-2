import { characterId, type StoryArc } from '../../../../core/types';
import { ERNST_WORLDMAP_ARC_ID, ernstWorldmapEvents } from './events';

export { ernstWorldmapDialogue } from './dialogue';
export * from './events';

export const ernstWorldmapArc: StoryArc = {
  id: ERNST_WORLDMAP_ARC_ID,
  protagonist: characterId('ernst'),
  title: 'Ernst: Atlas of the Four Seas',
  eventIds: ernstWorldmapEvents.map(({ id }) => id),
};

export const ernstWorldmap = {
  arc: ernstWorldmapArc,
  events: ernstWorldmapEvents,
};

export default ernstWorldmap;
