import { characterId, type StoryCharacter } from '../../core/types';

const enrico: StoryCharacter = {
  id: characterId('enrico'),
  names: { en: 'Brother Enrico' },
  role: 'companion',
  dialogueStyle: { color: 'text-purple-800' },
  sailorId: '33',
  legacyCharacterId: '33',
};

export default enrico;
