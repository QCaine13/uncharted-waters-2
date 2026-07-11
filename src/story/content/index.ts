import type { StoryContentSource } from '../core/types';
import { joaoLisbonOpening } from './arcs/joao/lisbon-opening';
import { storyCharacters } from './characters';
import { storyRelationships } from './relationships';

export { joaoLisbonOpening } from './arcs/joao/lisbon-opening';
export { storyCharacters } from './characters';
export { storyRelationships } from './relationships';
export { storyValidationCatalogs } from './catalogs';

export const storyContentSource: StoryContentSource = {
  characters: storyCharacters,
  relationships: storyRelationships,
  arcs: [joaoLisbonOpening.arc],
  events: joaoLisbonOpening.events,
};

export default storyContentSource;
