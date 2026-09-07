import { characterId, type StoryCharacter } from '../../core/types';

const secondReliefCaptain: StoryCharacter = {
  id: characterId('m3-relief-captain'),
  names: { en: 'Second Relief Captain', zh: '第二代理船长' },
  role: 'companion',
  dialogueStyle: { color: 'text-slate-600' },
  sailorId: 'm3-relief-captain',
};

export default secondReliefCaptain;
