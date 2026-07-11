import { characterId, type StoryCharacter } from '../../core/types';

const joao: StoryCharacter = {
  id: characterId('joao'),
  names: { en: 'João' },
  role: 'protagonist',
  dialogueStyle: { color: 'text-blue-600' },
  sailorId: '1',
  legacyCharacterId: '1',
};

export default joao;
