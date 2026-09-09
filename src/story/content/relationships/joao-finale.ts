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
  sourceArc: storyArcId('joao.finale'),
});

const joaoFinaleRelationships: CharacterRelationship[] = [
  relationship('joao.rudolph.enemy', 'rudolph', 'joao', 'enemy', 'enemy'),
  relationship(
    'joao.ezequiel.acquaintance',
    'ezequiel',
    'joao',
    'acquaintance',
    'acquaintance',
  ),
  relationship('joao.martinez.enemy', 'martinez', 'joao', 'enemy', 'enemy'),
];

export default joaoFinaleRelationships;
