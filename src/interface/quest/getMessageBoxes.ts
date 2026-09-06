import type { DialogueStep } from '../../story/core/types';
import type { StoryFrame } from '../../story/core/runtime';
import { getLocale, t } from '../../localization';

const messagePositions = [0, 1, 2] as const;

export type VendorMessage = { body: string; position: 0 };
export type CharacterMessage = {
  body: string;
  position: 1 | 2;
  characterId: string;
};
type PassiveMessage = VendorMessage | CharacterMessage;

export type VendorMessageBoxType =
  | ({ body: string } & MessageBoxCommonType)
  | null;

export type CharacterMessageBoxType =
  | ({ body: string; characterId: string } & MessageBoxCommonType)
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
  t(body)
    .replace('$firstName', getLocale() === 'zh-CN' ? '约翰' : 'João')
    .replace('$lastName', getLocale() === 'zh-CN' ? '法雷尔' : 'Franco');

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

const toDialogueStep = (message: PassiveMessage): DialogueStep => ({
  type: 'dialogue',
  body: message.body,
  position: message.position,
  ...('characterId' in message
    ? { speaker: message.characterId as DialogueStep['speaker'] }
    : {}),
});

const getMessageBoxes = (
  messages: readonly PassiveMessage[],
  step: number,
): MessageBoxes =>
  getMessageBoxesFromFrame(
    messages.slice(0, step).map(toDialogueStep),
    toDialogueStep(messages[step]),
  );

export default getMessageBoxes;
