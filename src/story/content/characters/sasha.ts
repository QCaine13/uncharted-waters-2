import { characterId, type StoryCharacter } from '../../core/types';

const sasha: StoryCharacter = {
  id: characterId('sasha'),
  names: { en: 'Sasha', zh: '莎夏' },
  role: 'npc',
  dialogueStyle: { color: 'text-violet-700' },
};

export default sasha;
