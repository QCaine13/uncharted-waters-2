import type { CharacterRelationship } from '../../core/types';
import joaoLisbonRelationships from './joao-lisbon';
import joaoFirstVoyageRelationships from './joao-first-voyage';
import joaoConflictAndGrowthRelationships from './joao-conflict-and-growth';
import joaoMassawaRelationships from './joao-massawa';
import joaoFinaleRelationships from './joao-finale';
import katarinaPietroRelationships from './katarina-pietro';

export const storyRelationships: CharacterRelationship[] = [
  ...joaoLisbonRelationships,
  ...joaoFirstVoyageRelationships,
  ...joaoConflictAndGrowthRelationships,
  ...joaoMassawaRelationships,
  ...joaoFinaleRelationships,
  ...katarinaPietroRelationships,
];

export default storyRelationships;
