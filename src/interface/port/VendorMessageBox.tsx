import React, { useEffect } from 'react';

import MessageBox from '../common/MessageBox';
import DialogueIndicator from '../dialog/DialogueIndicator';
import Assets from '../../assets';
import { VendorMessageBoxType } from '../quest/getMessageBoxes';
import { t } from '../../localization';
import { sfcAudio } from '../../sound/sfcAudio';

interface Props {
  buildingId: string;
  messageBox: VendorMessageBoxType;
}

export default function VendorMessageBox({ buildingId, messageBox }: Props) {
  const body = messageBox?.body;

  useEffect(() => {
    if (body) {
      sfcAudio.playDialogueBeep(buildingId);
    }
  }, [body, buildingId]);

  return (
    <div className="flex" data-test="vendorMessageBox">
      <div className="p-4 pr-0">
        <img src={Assets.buildings(buildingId)} alt="" className="w-[272px]" />
      </div>
      <div className={messageBox !== null ? '' : 'invisible'}>
        <MessageBox>
          <div className="w-[448px] h-[224px] text-2xl px-4 py-2">
            {messageBox !== null && (
              <div className="h-full flex flex-col justify-between leading-[1.6]">
                <div>
                  {t(messageBox.body)}
                  {messageBox.acknowledge && <DialogueIndicator />}
                </div>
                {messageBox.acknowledge && (
                  <div className="text-right pr-2">
                    <span className="inline-block text-[#d4a742] text-2xl animate-bounce select-none">
                      ▼
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </MessageBox>
      </div>
    </div>
  );
}
