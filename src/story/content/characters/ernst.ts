import { characterId, type StoryCharacter } from '../../core/types';

const ernst: StoryCharacter = {
  id: characterId('ernst'),
  names: { en: 'Ernst von Bohr', zh: '恩斯特·洛佩斯' },
  role: 'protagonist',
  portraitId: '4',
  dialogueStyle: { color: 'text-emerald-700' },
  sailorId: '5',
};

export default ernst;
