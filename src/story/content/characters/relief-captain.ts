import { characterId, type StoryCharacter } from '../../core/types';

const reliefCaptain: StoryCharacter = {
  id: characterId('m2-relief-captain'),
  names: { en: 'Relief Captain', zh: '代理船长' },
  role: 'companion',
  dialogueStyle: { color: 'text-slate-600' },
  sailorId: 'm2-relief-captain',
};

export default reliefCaptain;
