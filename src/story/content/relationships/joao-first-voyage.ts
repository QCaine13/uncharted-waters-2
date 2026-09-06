import {
  characterId,
  relationshipId,
  storyArcId,
  type CharacterRelationship,
} from '../../core/types';

const joaoFirstVoyageRelationships: CharacterRelationship[] = [
  {
    id: relationshipId('joao.domingo.companion'),
    from: characterId('domingo'),
    to: characterId('joao'),
    type: 'companion',
    reciprocal: 'companion',
    sourceArc: storyArcId('joao.first-voyage'),
  },
];

export default joaoFirstVoyageRelationships;
