import { characterId, type StoryCharacter } from '../../core/types';

const carlotta: StoryCharacter = {
  id: characterId('carlotta'),
  names: { en: 'Carlotta, Owner of the Pub' },
  role: 'npc',
  dialogueStyle: { color: 'text-amber-600' },
  legacyCharacterId: '98',
};

export default carlotta;
