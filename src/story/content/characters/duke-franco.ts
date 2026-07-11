import { characterId, type StoryCharacter } from '../../core/types';

const dukeFranco: StoryCharacter = {
  id: characterId('duke-franco'),
  names: { en: 'Duke Franco' },
  role: 'family',
  dialogueStyle: { color: 'text-red-600' },
  legacyCharacterId: '19',
};

export default dukeFranco;
