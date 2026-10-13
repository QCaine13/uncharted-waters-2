import { characterId, type StoryCharacter } from '../../core/types';

const matthew: StoryCharacter = {
  id: characterId('matthew'),
  names: { en: 'Matthew Roy', zh: '马修·罗伊' },
  role: 'companion',
  portraitId: '37',
  dialogueStyle: { color: 'text-red-700' },
  sailorId: '37',
};

export default matthew;
