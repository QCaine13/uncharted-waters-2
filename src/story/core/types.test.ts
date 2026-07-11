import {
  characterId,
  legacyQuestId,
  relationshipId,
  storyArcId,
  storyEventId,
} from './types';

describe('story identifiers', () => {
  test('retain stable serialized string values', () => {
    expect(characterId('joao')).toBe('joao');
    expect(relationshipId('joao.rocco.mentor')).toBe('joao.rocco.mentor');
    expect(storyArcId('joao.lisbon-opening')).toBe('joao.lisbon-opening');
    expect(storyEventId('joao.lisbon-opening.house-introduction')).toBe(
      'joao.lisbon-opening.house-introduction',
    );
    expect(legacyQuestId('houseBeforeQuest')).toBe('houseBeforeQuest');
  });
});
