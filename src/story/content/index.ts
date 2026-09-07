import type { StoryContentSource } from '../core/types';
import { joaoLisbonOpening } from './arcs/joao/lisbon-opening';
import { joaoFirstVoyage } from './arcs/joao/first-voyage';
import { joaoConflictAndGrowth } from './arcs/joao/conflict-and-growth';
import { storyCharacters } from './characters';
import { storyRelationships } from './relationships';

export { joaoLisbonOpening } from './arcs/joao/lisbon-opening';
export { joaoFirstVoyage } from './arcs/joao/first-voyage';
export { joaoConflictAndGrowth } from './arcs/joao/conflict-and-growth';
export { storyCharacters } from './characters';
export { storyRelationships } from './relationships';
export { storyValidationCatalogs } from './catalogs';

export const storyContentSource: StoryContentSource = {
  characters: storyCharacters,
  relationships: storyRelationships,
  arcs: [joaoLisbonOpening.arc, joaoFirstVoyage.arc, joaoConflictAndGrowth.arc],
  events: [
    ...joaoLisbonOpening.events,
    ...joaoFirstVoyage.events,
    ...joaoConflictAndGrowth.events,
  ],
};

export default storyContentSource;
