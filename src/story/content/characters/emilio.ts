import { characterId, type StoryCharacter } from '../../core/types';

const emilio: StoryCharacter = {
  id: characterId('emilio'),
  names: { en: 'Emilio Sanches', zh: '埃米利奥·桑切斯' },
  role: 'companion',
  portraitId: '36',
  dialogueStyle: { color: 'text-amber-700' },
  sailorId: '36',
};

export default emilio;
