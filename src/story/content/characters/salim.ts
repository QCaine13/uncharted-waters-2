import { characterId, type StoryCharacter } from '../../core/types';

const salim: StoryCharacter = {
  id: characterId('salim'),
  names: { en: 'Salim', zh: '萨利姆' },
  role: 'companion',
  portraitId: '41',
  dialogueStyle: { color: 'text-amber-800' },
  sailorId: '40',
};

export default salim;
