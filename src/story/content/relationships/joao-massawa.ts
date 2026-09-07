import {
  characterId,
  relationshipId,
  storyArcId,
  type CharacterRelationship,
} from '../../core/types';

const joaoMassawaRelationships: CharacterRelationship[] = [
  {
    id: relationshipId('joao.pietro.acquaintance'),
    from: characterId('pietro'),
    to: characterId('joao'),
    type: 'acquaintance',
    reciprocal: 'acquaintance',
    sourceArc: storyArcId('joao.massawa'),
  },
  {
    id: relationshipId('joao.taphiel.acquaintance'),
    from: characterId('taphiel'),
    to: characterId('joao'),
    type: 'acquaintance',
    reciprocal: 'acquaintance',
    sourceArc: storyArcId('joao.massawa'),
  },
];

export default joaoMassawaRelationships;
