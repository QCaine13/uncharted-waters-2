import { characterId, type StoryCharacter } from '../../core/types';

const otto: StoryCharacter = {
  id: characterId('otto'),
  names: { en: 'Otto Baynes', zh: '奥托·斯宾诺拉' },
  role: 'protagonist',
  portraitId: '3',
  dialogueStyle: { color: 'text-amber-700' },
  sailorId: '3',
};

export default otto;
