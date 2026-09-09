import {
  characterId,
  relationshipId,
  storyArcId,
  type CharacterRelationship,
  type RelationshipType,
} from '../../core/types';

const relationship = (
  id: string,
  from: string,
  to: string,
  type: RelationshipType,
  reciprocal: RelationshipType,
): CharacterRelationship => ({
  id: relationshipId(id),
  from: characterId(from),
  to: characterId(to),
  type,
  reciprocal,
  sourceArc: storyArcId('joao.conflict-and-growth'),
});

const joaoConflictAndGrowthRelationships: CharacterRelationship[] = [
  relationship('joao.kahn.rival', 'kahn', 'joao', 'rival', 'rival'),
  relationship('joao.katarina.enemy', 'katarina', 'joao', 'enemy', 'enemy'),
  relationship(
    'joao.ali.acquaintance',
    'ali',
    'joao',
    'acquaintance',
    'acquaintance',
  ),
  relationship('ali.sasha.sibling', 'ali', 'sasha', 'sibling', 'sibling'),
];

export default joaoConflictAndGrowthRelationships;
