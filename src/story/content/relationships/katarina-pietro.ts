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
  arc: string,
): CharacterRelationship => ({
  id: relationshipId(id),
  from: characterId(from),
  to: characterId(to),
  type,
  reciprocal,
  sourceArc: storyArcId(arc),
});

const katarinaPietroRelationships: CharacterRelationship[] = [
  relationship(
    'katarina.emilio.companion',
    'emilio',
    'katarina',
    'companion',
    'companion',
    'katarina.vengeance',
  ),
  relationship(
    'katarina.martinez.enemy',
    'martinez',
    'katarina',
    'enemy',
    'enemy',
    'katarina.vengeance',
  ),
  relationship(
    'pietro.camillo.companion',
    'camillo',
    'pietro',
    'companion',
    'companion',
    'pietro.adventure',
  ),
  relationship(
    'pietro.duchess-christiana.employer',
    'duchess-christiana',
    'pietro',
    'employer',
    'employee',
    'pietro.adventure',
  ),
];

export default katarinaPietroRelationships;
