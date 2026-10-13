import { characterId, type StoryCharacter } from '../../core/types';

const mercator: StoryCharacter = {
  id: characterId('mercator'),
  names: { en: 'Mercator', zh: '墨卡托' },
  role: 'npc',
  portraitId: '40',
  dialogueStyle: { color: 'text-indigo-800' },
};

export default mercator;
