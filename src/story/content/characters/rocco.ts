import { characterId, type StoryCharacter } from '../../core/types';

const rocco: StoryCharacter = {
  id: characterId('rocco'),
  names: { en: 'Old Sea Hand Rocco' },
  role: 'companion',
  dialogueStyle: { color: 'text-amber-800' },
  sailorId: '32',
  legacyCharacterId: '32',
};

export default rocco;
