import { characterId, type StoryCharacter } from '../../core/types';

const ezequiel: StoryCharacter = {
  id: characterId('ezequiel'),
  names: { en: 'Ezequiel', zh: '艾泽格' },
  role: 'npc',
  dialogueStyle: { color: 'text-sky-800' },
};

export default ezequiel;
