import { characterId, type StoryCharacter } from '../../core/types';

const camillo: StoryCharacter = {
  id: characterId('camillo'),
  names: { en: 'Camillo Stefano', zh: '卡米洛·斯特凡诺' },
  role: 'companion',
  portraitId: '35',
  dialogueStyle: { color: 'text-emerald-800' },
  sailorId: '35',
};

export default camillo;
