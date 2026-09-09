import { characterId, type StoryCharacter } from '../../core/types';

const rudolph: StoryCharacter = {
  id: characterId('rudolph'),
  names: { en: 'Rudolph', zh: '鲁道夫' },
  role: 'antagonist',
  dialogueStyle: { color: 'text-red-700' },
};

export default rudolph;
