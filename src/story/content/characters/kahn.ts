import { characterId, type StoryCharacter } from '../../core/types';

const kahn: StoryCharacter = {
  id: characterId('kahn'),
  names: { en: 'Antonio Kahn', zh: '安东尼奥·卡恩' },
  role: 'antagonist',
  dialogueStyle: { color: 'text-red-800' },
};

export default kahn;
