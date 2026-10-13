import type { CharacterRelationship } from '../../core/types';
import joaoLisbonRelationships from './joao-lisbon';
import joaoFirstVoyageRelationships from './joao-first-voyage';
import joaoConflictAndGrowthRelationships from './joao-conflict-and-growth';
import joaoMassawaRelationships from './joao-massawa';
import joaoFinaleRelationships from './joao-finale';
import katarinaPietroRelationships from './katarina-pietro';
import ottoErnstAliRelationships from './otto-ernst-ali';

export const storyRelationships: CharacterRelationship[] = [
  ...joaoLisbonRelationships,
  ...joaoFirstVoyageRelationships,
  ...joaoConflictAndGrowthRelationships,
  ...joaoMassawaRelationships,
  ...joaoFinaleRelationships,
  ...katarinaPietroRelationships,
  ...ottoErnstAliRelationships,
];

export default storyRelationships;
