import { characterId, type StoryCharacter } from '../../core/types';

const katarina: StoryCharacter = {
  id: characterId('katarina'),
  names: { en: 'Katarina Erantzo', zh: '卡特琳娜·艾兰茨' },
  role: 'antagonist',
  dialogueStyle: { color: 'text-rose-700' },
};

export default katarina;
