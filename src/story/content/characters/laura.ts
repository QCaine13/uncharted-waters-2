import { characterId, type StoryCharacter } from '../../core/types';

const laura: StoryCharacter = {
  id: characterId('laura'),
  names: { en: 'Laura', zh: '劳拉' },
  role: 'companion',
  portraitId: '39',
  dialogueStyle: { color: 'text-pink-700' },
  sailorId: '39',
};

export default laura;
