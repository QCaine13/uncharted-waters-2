import { characterId, type StoryCharacter } from '../../core/types';

const butlerMarco: StoryCharacter = {
  id: characterId('butler-marco'),
  names: { en: 'Butler Marco' },
  role: 'npc',
  dialogueStyle: { color: 'text-blue-900' },
  legacyCharacterId: '7',
};

export default butlerMarco;
