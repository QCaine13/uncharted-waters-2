import { characterId, type StoryCharacter } from '../../core/types';

const duchessChristiana: StoryCharacter = {
  id: characterId('duchess-christiana'),
  names: { en: 'Duchess Christiana' },
  role: 'family',
  dialogueStyle: { color: 'text-yellow-600' },
  legacyCharacterId: '20',
};

export default duchessChristiana;
