import { characterId, type StoryCharacter } from '../../core/types';

const pietro: StoryCharacter = {
  id: characterId('pietro'),
  names: { en: 'Pietro', zh: '皮耶德' },
  role: 'npc',
  dialogueStyle: { color: 'text-slate-600' },
};

export default pietro;
