import { characterId, type StoryCharacter } from '../../core/types';

const martinez: StoryCharacter = {
  id: characterId('martinez'),
  names: { en: 'Martinez', zh: '马丁内斯' },
  role: 'antagonist',
  dialogueStyle: { color: 'text-stone-700' },
};

export default martinez;
