import {
  characterId,
  relationshipId,
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
});

const joaoLisbonRelationships: CharacterRelationship[] = [
  relationship(
    'joao.duke-franco.parent',
    'duke-franco',
    'joao',
    'parent',
    'child',
  ),
  relationship(
    'joao.duchess-christiana.parent',
    'duchess-christiana',
    'joao',
    'parent',
    'child',
  ),
  relationship('joao.rocco.mentor', 'rocco', 'joao', 'mentor', 'student'),
  relationship(
    'joao.rocco.companion',
    'rocco',
    'joao',
    'companion',
    'companion',
  ),
  relationship(
    'joao.enrico.companion',
    'enrico',
    'joao',
    'companion',
    'companion',
  ),
  relationship(
    'joao.carlotta.acquaintance',
    'carlotta',
    'joao',
    'acquaintance',
    'acquaintance',
  ),
  relationship(
    'joao.lucia.acquaintance',
    'lucia',
    'joao',
    'acquaintance',
    'acquaintance',
  ),
];

export default joaoLisbonRelationships;
