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

const ottoErnstAliRelationships: CharacterRelationship[] = [
  relationship(
    'otto.matthew.companion',
    'matthew',
    'otto',
    'companion',
    'companion',
    'otto.armada',
  ),
  relationship(
    'otto.ezequiel.rival',
    'ezequiel',
    'otto',
    'rival',
    'rival',
    'otto.armada',
  ),
  relationship(
    'ernst.hans.companion',
    'hans',
    'ernst',
    'companion',
    'companion',
    'ernst.worldmap',
  ),
  relationship(
    'ernst.laura.companion',
    'laura',
    'ernst',
    'companion',
    'companion',
    'ernst.worldmap',
  ),
  relationship(
    'ernst.mercator.mentor',
    'mercator',
    'ernst',
    'mentor',
    'student',
    'ernst.worldmap',
  ),
  relationship(
    'ali.salim.companion',
    'salim',
    'ali',
    'companion',
    'companion',
    'ali.merchant',
  ),
];

export default ottoErnstAliRelationships;
