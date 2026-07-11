import {
  CharacterMessage,
  messagePositions,
  Message,
  VendorMessage,
} from './questData';
import type { DialogueStep } from '../../story/core/types';
import type { StoryFrame } from '../../story/core/runtime';
import { characterId } from '../../story/core/types';

export type VendorMessageBoxType =
  | (Pick<VendorMessage, 'body'> & MessageBoxCommonType)
  | null;

export type CharacterMessageBoxType =
  | (Pick<CharacterMessage, 'body' | 'characterId'> & MessageBoxCommonType)
  | null;

type MessageBoxCommonType = {
  acknowledge?: () => void;
  confirm?: {
    yes: () => void;
    no: () => void;
  };
};

export type MessageBoxes = [
  VendorMessageBoxType,
  CharacterMessageBoxType,
  CharacterMessageBoxType,
];

const interpolatePlayerName = (body: string) =>
  body
    .replace('$firstName', 'João')
    .replace('$lastName', 'Franco');

export const getMessageBoxesFromFrame = (
  history: readonly DialogueStep[],
  frame: StoryFrame,
  chooseChoice?: (choiceId: string) => void,
): MessageBoxes => {
  let message: Pick<DialogueStep, 'body' | 'position' | 'speaker'> | undefined;
  if (frame.type === 'dialogue') {
    message = frame;
  } else if (frame.type === 'choice') {
    message = {
      body: frame.prompt,
      position: frame.position,
      speaker: frame.speaker,
    };
  }
  const yes =
    frame.type === 'choice' && frame.options.find(({ id }) => id === 'yes');
  const no =
    frame.type === 'choice' && frame.options.find(({ id }) => id === 'no');
  const confirm =
    chooseChoice && yes && no
      ? {
          yes: () => chooseChoice(yes.id),
          no: () => chooseChoice(no.id),
        }
      : undefined;

  return messagePositions.map((position) => {
    if (position === 0) {
      if (message?.position === position) {
        return {
          body: interpolatePlayerName(message.body),
          ...(confirm === undefined ? {} : { confirm }),
        };
      }

      const vendorSpoken = history.some(
        (earlierMessage) => earlierMessage.position === position,
      );

      if (vendorSpoken) {
        return { body: '' };
      }

      return null;
    }

    if (message?.position === position) {
      return {
        body: interpolatePlayerName(message.body),
        characterId: message.speaker,
        ...(confirm === undefined ? {} : { confirm }),
      };
    }

    const latestCharacterId = [...history]
      .reverse()
      .find((earlierMessage) => earlierMessage.position === position)?.speaker;

    if (latestCharacterId) {
      return {
        body: '',
        characterId: latestCharacterId,
      };
    }

    return null;
  }) as MessageBoxes;
};

const toDialogueStep = (message: Message): DialogueStep => ({
  type: 'dialogue',
  body: message.body,
  position: message.position,
  ...('characterId' in message
    ? { speaker: characterId(message.characterId) }
    : {}),
  ...(message.fadeBeforeNext ? { fadeBeforeNext: true } : {}),
});

const getMessageBoxes = (messages: Message[], step: number): MessageBoxes =>
  getMessageBoxesFromFrame(
    messages.slice(0, step).map(toDialogueStep),
    toDialogueStep(messages[step]),
  );

export default getMessageBoxes;
