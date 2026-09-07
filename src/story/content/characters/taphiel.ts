import { characterId, type StoryCharacter } from '../../core/types';

const taphiel: StoryCharacter = {
  id: characterId('taphiel'),
  names: { en: 'Taphiel', zh: '塔菲尔' },
  role: 'npc',
  dialogueStyle: { color: 'text-slate-600' },
};

export default taphiel;
