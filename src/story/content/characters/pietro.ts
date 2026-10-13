import { characterId, type StoryCharacter } from '../../core/types';

const pietro: StoryCharacter = {
  id: characterId('pietro'),
  names: { en: 'Pietro', zh: '皮耶德' },
  role: 'npc',
  portraitId: '5',
  dialogueStyle: { color: 'text-slate-600' },
  sailorId: '4',
};

export default pietro;
