import React, { useSyncExternalStore } from 'react';
import {
  advanceSeaStory,
  getSeaStorySession,
  subscribeSeaStory,
} from '../../story/seaStory';
import { getStoryFrame } from '../../story/core/runtime';
import type { DialogueStep } from '../../story/core/types';
import { getMessageBoxesFromFrame } from '../quest/getMessageBoxes';
import CharacterMessageBox from '../port/CharacterMessageBox';
import MessageBox from '../common/MessageBox';
import Confirm from '../common/Confirm';
import Acknowledge from '../common/Acknowledge';
import useLocale from '../../localization/useLocale';
import { t } from '../../localization';

export default function SeaStory() {
  useLocale();
  const session = useSyncExternalStore(subscribeSeaStory, getSeaStorySession);
  if (session === null) return null;
  const frame = getStoryFrame(session);
  if (frame === null || frame.type === 'effect') return null;

  const proceed = (choiceId?: string) => advanceSeaStory(session, choiceId);
  const history = session.steps
    .slice(0, session.stepIndex)
    .filter((step): step is DialogueStep => step.type === 'dialogue');
  const messages = getMessageBoxesFromFrame(history, frame, proceed);
  if (frame.type === 'dialogue') {
    const current = messages[frame.position];
    if (current) current.acknowledge = () => proceed();
  }
  const confirm = messages.find((message) => message?.confirm)?.confirm;
  const acknowledge = messages.find(
    (message) => message?.acknowledge,
  )?.acknowledge;

  return (
    <div
      className="absolute inset-0 z-20 bg-black/70"
      role="dialog"
      aria-label={t('Sea encounter')}
      data-test="seaStory"
    >
      {messages[0] && (
        <div className="absolute top-8 left-8">
          <MessageBox>
            <div
              className="w-[240px] min-h-[160px] p-5 text-xl text-black"
              data-test="seaNarration"
            >
              {messages[0].body}
            </div>
          </MessageBox>
        </div>
      )}
      <CharacterMessageBox messageBox={messages[1]} position={1} />
      <CharacterMessageBox messageBox={messages[2]} position={2} />
      {confirm && (
        <Confirm
          onYes={confirm.yes}
          onNo={confirm.no}
          initialPosition={{ x: 760, y: 650 }}
        />
      )}
      {acknowledge && <Acknowledge onAcknowledge={acknowledge} />}
    </div>
  );
}
