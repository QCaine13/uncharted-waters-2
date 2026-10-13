import { characterId, type StoryArc } from '../../../../core/types';
import { KATARINA_VENGEANCE_ARC_ID, katarinaVengeanceEvents } from './events';

export { katarinaVengeanceDialogue } from './dialogue';
export * from './events';

export const katarinaVengeanceArc: StoryArc = {
  id: KATARINA_VENGEANCE_ARC_ID,
  protagonist: characterId('katarina'),
  title: 'Katarina: Crimson Corsairs of Vengeance',
  eventIds: katarinaVengeanceEvents.map(({ id }) => id),
};

export const katarinaVengeance = {
  arc: katarinaVengeanceArc,
  events: katarinaVengeanceEvents,
};

export default katarinaVengeance;
