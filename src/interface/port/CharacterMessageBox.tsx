import React from 'react';

import Assets from '../../assets';
import { classNames } from '../interfaceUtils';
import MessageBox from '../common/MessageBox';
import { CharacterMessageBoxType } from '../quest/getMessageBoxes';
import characterData from '../../data/characterData';
import getSailor from '../../data/sailorData';
import { compiledStoryContent } from '../../story';
import { characterId as toCharacterId } from '../../story/core/types';
import { getLocale, t } from '../../localization';
import CharacterPortrait from '../common/CharacterPortrait';

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
  if (messageBox === null) {
    return null;
  }

  const { body, characterId, acknowledge } = messageBox;
  const canonical = compiledStoryContent.charactersById.get(
    toCharacterId(characterId),
  );
  const legacy = canonical ? undefined : characterData[characterId];
  const sailor = canonical ? undefined : getSailor(characterId);
  const sourceName =
    canonical?.names.en ?? legacy?.name ?? sailor?.name ?? characterId;
  const name =
    canonical && getLocale() === 'zh-CN' && canonical.names.zh
      ? canonical.names.zh
      : t(sourceName);
  const color =
    canonical?.dialogueStyle.color ?? legacy?.color ?? 'text-black';
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
          <div className="flex-1 text-2xl pl-4">
            <div className={classNames('text-base mb-2', color)}>{name}</div>
            {t(body)}
            {acknowledge && (
              <img
                src={Assets.images('dialogCaretDown').toDataURL()}
                alt=""
                className="w-8 h-8 animate-ping mx-auto mt-8"
              />
            )}
          </div>
        </div>
      </MessageBox>
    </div>
  );
}
