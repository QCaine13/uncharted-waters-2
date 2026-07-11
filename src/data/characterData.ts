import { storyCharacters } from '../story/content/characters';

export type Character = {
  name: string;
  color: string;
};

const characterData = Object.fromEntries(
  storyCharacters
    .filter((character) => character.legacyCharacterId !== undefined)
    .map(({ legacyCharacterId, names, dialogueStyle }) => [
      legacyCharacterId,
      { name: names.en, color: dialogueStyle.color },
    ]),
) as { [key: string]: Character };

export default characterData;
