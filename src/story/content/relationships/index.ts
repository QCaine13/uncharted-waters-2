import type { CharacterRelationship } from '../../core/types';
import joaoLisbonRelationships from './joao-lisbon';
import joaoFirstVoyageRelationships from './joao-first-voyage';
import joaoConflictAndGrowthRelationships from './joao-conflict-and-growth';
import joaoMassawaRelationships from './joao-massawa';

export const storyRelationships: CharacterRelationship[] = [
  ...joaoLisbonRelationships,
  ...joaoFirstVoyageRelationships,
  ...joaoConflictAndGrowthRelationships,
  ...joaoMassawaRelationships,
];

export default storyRelationships;
