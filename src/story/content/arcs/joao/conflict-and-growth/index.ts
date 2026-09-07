import { characterId, type StoryArc } from '../../../../core/types';
import { CONFLICT_AND_GROWTH_ARC_ID, conflictAndGrowthEvents } from './events';

export { conflictAndGrowthDialogue } from './dialogue';
export * from './events';

export const conflictAndGrowthArc: StoryArc = {
  id: CONFLICT_AND_GROWTH_ARC_ID,
  protagonist: characterId('joao'),
  title: 'João: Conflict and Growth',
  eventIds: conflictAndGrowthEvents.map(({ id }) => id),
};

export const joaoConflictAndGrowth = {
  arc: conflictAndGrowthArc,
  events: conflictAndGrowthEvents,
};

export default joaoConflictAndGrowth;
