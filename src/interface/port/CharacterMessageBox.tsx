import React, { useEffect } from 'react';

import { classNames } from '../interfaceUtils';
import MessageBox from '../common/MessageBox';
import DialogueIndicator from '../dialog/DialogueIndicator';
import { CharacterMessageBoxType } from '../quest/getMessageBoxes';
import characterData from '../../data/characterData';
import getSailor from '../../data/sailorData';
import { compiledStoryContent } from '../../story';
import { characterId as toCharacterId } from '../../story/core/types';
import { getLocale, t } from '../../localization';
import CharacterPortrait from '../common/CharacterPortrait';
import { sfcAudio } from '../../sound/sfcAudio';

export type Position = 1 | 2;

interface Props {
  messageBox: CharacterMessageBoxType;
  position: Position;
}

const positionClassMap: { [key in Position]: string } = {
  1: 'absolute top-4 left-[304px]',
  2: 'absolute top-[320px] ml-[416px]',
};

export default function CharacterMessageBox({ messageBox, position }: Props) {
  useEffect(() => {
    if (messageBox?.body) {
      sfcAudio.playDialogueBeep(messageBox.characterId);
    }
  }, [messageBox?.body, messageBox?.characterId]);

  if (messageBox === null) {
    return null;
  }

  const { body, characterId, acknowledge } = messageBox;
  const canonical = characterId
    ? compiledStoryContent.charactersById.get(toCharacterId(characterId))
    : undefined;
  const legacy = canonical ? undefined : characterData[characterId];
  const sailor = canonical ? undefined : getSailor(characterId);
  const sourceName =
    canonical?.names.en ?? legacy?.name ?? sailor?.name ?? characterId;
  const name =
    canonical && getLocale() === 'zh-CN' && canonical.names.zh
      ? canonical.names.zh
      : t(sourceName);
  const color = canonical?.dialogueStyle.color ?? legacy?.color ?? 'text-black';
  let portraitId: string | undefined;
  if (canonical) {
    portraitId = canonical.portraitId ?? canonical.legacyCharacterId;
  } else if (legacy || sailor) {
    portraitId = characterId;
  }

  return (
    <div
      className={positionClassMap[position]}
      data-test={`characterMessageBox${position}`}
    >
      <MessageBox>
        <div className="flex w-[592px] h-[256px] text-2xl p-4">
          <CharacterPortrait
            portraitId={portraitId}
            name={name}
            className="w-32 h-40"
          />
          <div className="flex-1 text-2xl pl-4 flex flex-col justify-between">
            <div>
              <div className={classNames('text-base mb-2 font-bold', color)}>
                {name}
              </div>
              <div className="leading-[1.6]">
                {t(body)}
                {acknowledge && <DialogueIndicator />}
              </div>
            </div>
            {acknowledge && (
              <div className="text-right pr-2">
                <span className="inline-block text-[#d4a742] text-2xl animate-bounce select-none">
                  ▼
                </span>
              </div>
            )}
          </div>
        </div>
      </MessageBox>
    </div>
  );
}
