import { characterId, type StoryCharacter } from '../../core/types';

const lucia: StoryCharacter = {
  id: characterId('lucia'),
  names: { en: 'Lucia the Waitress' },
  role: 'npc',
  dialogueStyle: { color: 'text-pink-600' },
  legacyCharacterId: '99',
};

export default lucia;
