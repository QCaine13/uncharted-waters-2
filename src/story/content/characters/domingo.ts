import { characterId, type StoryCharacter } from '../../core/types';

const domingo: StoryCharacter = {
  id: characterId('domingo'),
  names: { en: 'Domingo', zh: '多明戈' },
  role: 'companion',
  dialogueStyle: { color: 'text-emerald-700' },
  sailorId: '34',
  legacyCharacterId: '34',
};

export default domingo;
