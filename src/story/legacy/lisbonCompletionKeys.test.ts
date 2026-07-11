import { compileStoryContent } from '../core/registry';
import {
  characterId,
  legacyQuestId,
  storyArcId,
  storyEventId,
  type StoryContentSource,
} from '../core/types';
import {
  getCompletedStoryEvents,
  getLegacyCompletionKey,
} from './lisbonCompletionKeys';

const introduction = storyEventId('joao.lisbon-opening.house-introduction');
const houseBeforeQuest = legacyQuestId('houseBeforeQuest');

const fixture = (): StoryContentSource => ({
  characters: [
    {
      id: characterId('joao'),
      names: { en: 'João' },
      role: 'protagonist',
      dialogueStyle: { color: 'blue' },
    },
  ],
  relationships: [],
  arcs: [
    {
      id: storyArcId('joao.lisbon-opening'),
      protagonist: characterId('joao'),
      title: 'Lisbon opening',
      eventIds: [introduction],
    },
  ],
  events: [
    {
      id: introduction,
      arcId: storyArcId('joao.lisbon-opening'),
      priority: 10,
      trigger: { type: 'atBuilding', buildingId: '8' },
      repeat: 'once',
      legacyCompletionKey: houseBeforeQuest,
      steps: [{ type: 'dialogue', body: 'Welcome home.', position: 0 }],
    },
  ],
});

describe('Save v2 completion adapter', () => {
  test('maps recognized legacy keys and ignores unknown keys', () => {
    const content = compileStoryContent(fixture(), 'strict');

    expect(
      getCompletedStoryEvents(
        [houseBeforeQuest, legacyQuestId('unknownQuest')],
        content,
      ),
    ).toEqual(new Set([introduction]));
  });

  test('returns the exact legacy completion key for a semantic event', () => {
    const content = compileStoryContent(fixture(), 'strict');

    expect(getLegacyCompletionKey(introduction, content)).toBe(
      houseBeforeQuest,
    );
    expect(
      getLegacyCompletionKey(storyEventId('unknown-event'), content),
    ).toBeNull();
  });
});
