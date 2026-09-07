import { characterId, type StoryCharacter } from '../../core/types';

const ali: StoryCharacter = {
  id: characterId('ali'),
  names: { en: 'Ali Vezas', zh: '阿兰·维斯特' },
  role: 'npc',
  dialogueStyle: { color: 'text-teal-700' },
};

export default ali;
