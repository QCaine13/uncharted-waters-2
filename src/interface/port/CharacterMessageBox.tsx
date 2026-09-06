import React from 'react';

import Assets from '../../assets';
import { classNames } from '../interfaceUtils';
import MessageBox from '../common/MessageBox';
import { CharacterMessageBoxType } from '../quest/getMessageBoxes';
import characterData from '../../data/characterData';
import getSailor from '../../data/sailorData';
import { compiledStoryContent } from '../../story';
import { characterId as toCharacterId } from '../../story/core/types';
import { t } from '../../localization';

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
  const presentationCharacterId =
    compiledStoryContent.charactersById.get(toCharacterId(characterId))
      ?.legacyCharacterId ?? characterId;

  const { name, color = 'text-black' } =
    characterData[presentationCharacterId] ||
    getSailor(presentationCharacterId);

  return (
    <div
      className={positionClassMap[position]}
      data-test={`characterMessageBox${position}`}
    >
      <MessageBox>
        <div className="flex w-[592px] h-[256px] text-2xl p-4">
          <img
            src={Assets.characters(presentationCharacterId)}
            className="w-32 h-40"
            alt=""
          />
          <div className="flex-1 text-2xl pl-4">
            <div className={classNames('text-base mb-2', color)}>{t(name)}</div>
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
