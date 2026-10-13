import { characterId, type StoryCharacter } from '../../core/types';

const hans: StoryCharacter = {
  id: characterId('hans'),
  names: { en: 'Hans', zh: '汉斯' },
  role: 'companion',
  portraitId: '38',
  dialogueStyle: { color: 'text-sky-700' },
  sailorId: '38',
};

export default hans;
