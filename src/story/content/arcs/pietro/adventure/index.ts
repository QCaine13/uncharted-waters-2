import { characterId, type StoryArc } from '../../../../core/types';
import { PIETRO_ADVENTURE_ARC_ID, pietroAdventureEvents } from './events';

export { pietroAdventureDialogue } from './dialogue';
export * from './events';

export const pietroAdventureArc: StoryArc = {
  id: PIETRO_ADVENTURE_ARC_ID,
  protagonist: characterId('pietro'),
  title: 'Pietro: Horizon of Gold and Relics',
  eventIds: pietroAdventureEvents.map(({ id }) => id),
};

export const pietroAdventure = {
  arc: pietroAdventureArc,
  events: pietroAdventureEvents,
};

export default pietroAdventure;
