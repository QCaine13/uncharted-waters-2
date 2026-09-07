import type { CharacterRelationship } from '../../core/types';
import joaoLisbonRelationships from './joao-lisbon';
import joaoFirstVoyageRelationships from './joao-first-voyage';
import joaoConflictAndGrowthRelationships from './joao-conflict-and-growth';

export const storyRelationships: CharacterRelationship[] = [
  ...joaoLisbonRelationships,
  ...joaoFirstVoyageRelationships,
  ...joaoConflictAndGrowthRelationships,
];

export default storyRelationships;
