import type { CharacterRelationship } from '../../core/types';
import joaoLisbonRelationships from './joao-lisbon';
import joaoFirstVoyageRelationships from './joao-first-voyage';

export const storyRelationships: CharacterRelationship[] = [
  ...joaoLisbonRelationships,
  ...joaoFirstVoyageRelationships,
];

export default storyRelationships;
