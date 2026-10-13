import React from 'react';

import { t } from '../localization';
import { getFirstVoyageJournal } from '../story/firstVoyageJournal';
import { getConflictAndGrowthJournal } from '../story/conflictAndGrowthJournal';
import { getJoaoFinaleJournal } from '../story/joaoFinaleJournal';
import { getCatalinaJournal } from '../story/catalinaJournal';
import { getOttoJournal } from '../story/ottoJournal';
import { getErnstJournal } from '../story/ernstJournal';
import { getPietroJournal } from '../story/pietroJournal';
import { getAliJournal } from '../story/aliJournal';
import { CHAPTER_COMPLETE_EVENT_ID } from '../story/content/arcs/joao/first-voyage';
import { CONFLICT_AND_GROWTH_COMPLETE_EVENT_ID } from '../story/content/arcs/joao/conflict-and-growth';
import { JOAO_ENDING_EVENT_ID } from '../story/content/arcs/joao/finale';
import { KATARINA_ENDING_EVENT_ID } from '../story/content/arcs/katarina/vengeance';
import { OTTO_ENDING_EVENT_ID } from '../story/content/arcs/otto/armada';
import { ERNST_ENDING_EVENT_ID } from '../story/content/arcs/ernst/worldmap';
import { PIETRO_ENDING_EVENT_ID } from '../story/content/arcs/pietro/adventure';
import { ALI_ENDING_EVENT_ID } from '../story/content/arcs/ali/merchant';
import type { JournalEntry } from '../story/firstVoyageJournal';
import state from '../state/state';
import MessageBox from './common/MessageBox';
import JoaoEnding from './JoaoEnding';
import CatalinaEnding from './CatalinaEnding';
import OttoEnding from './OttoEnding';
import ErnstEnding from './ErnstEnding';
import PietroEnding from './PietroEnding';
import AliEnding from './AliEnding';

const entryMarker = (entry: JournalEntry, current: boolean): string => {
  if (entry.completed) return '✓';
  if (entry.kind === 'advice') return '•';
  if (entry.kind === 'future') return '◇';
  return current ? '→' : '○';
};

const entryStatus = (entry: JournalEntry, current: boolean): string => {
  if (entry.completed) return t('Complete');
  if (entry.kind === 'advice') return t('Preparation');
  if (entry.kind === 'future') return t('Future chapter');
  return t(current ? 'Current objective' : 'Upcoming objective');
};

export default function QuestJournal() {
  let entries: JournalEntry[];
  if (state.protagonistId === 'katarina') {
    entries = getCatalinaJournal(state);
  } else if (state.protagonistId === 'otto') {
    entries = getOttoJournal(state);
  } else if (state.protagonistId === 'ernst') {
    entries = getErnstJournal(state);
  } else if (state.protagonistId === 'pietro') {
    entries = getPietroJournal(state);
  } else if (state.protagonistId === 'ali') {
    entries = getAliJournal(state);
  } else {
    const firstVoyage = getFirstVoyageJournal(state);
    const m1Complete = state.storyEvents.includes(CHAPTER_COMPLETE_EVENT_ID);
    const m2Complete = state.storyEvents.includes(
      CONFLICT_AND_GROWTH_COMPLETE_EVENT_ID,
    );
    entries = firstVoyage;
    if (m1Complete)
      entries = [...getConflictAndGrowthJournal(state), ...entries];
    if (m2Complete) entries = [...getJoaoFinaleJournal(state), ...entries];
  }
  const current =
    entries.find(({ current: active }) => active)?.id ??
    entries.find(
      ({ completed, kind }) =>
        !completed && kind !== 'advice' && kind !== 'future',
    )?.id;

  return (
    <MessageBox>
      <div
        className="w-[720px] max-h-[560px] overflow-y-auto px-8 py-6 text-black"
        data-test="questJournal"
      >
        <div className="text-3xl text-blue-700 mb-4">{t('Voyage Journal')}</div>
        {state.protagonistId === 'katarina' &&
          state.storyEvents.includes(KATARINA_ENDING_EVENT_ID) && (
            <CatalinaEnding />
          )}
        {state.protagonistId === 'otto' &&
          state.storyEvents.includes(OTTO_ENDING_EVENT_ID) && <OttoEnding />}
        {state.protagonistId === 'ernst' &&
          state.storyEvents.includes(ERNST_ENDING_EVENT_ID) && <ErnstEnding />}
        {state.protagonistId === 'pietro' &&
          state.storyEvents.includes(PIETRO_ENDING_EVENT_ID) && (
            <PietroEnding />
          )}
        {state.protagonistId === 'ali' &&
          state.storyEvents.includes(ALI_ENDING_EVENT_ID) && <AliEnding />}
        {(state.protagonistId === undefined ||
          state.protagonistId === 'joao') &&
          state.storyEvents.includes(JOAO_ENDING_EVENT_ID) && <JoaoEnding />}
        <div className="space-y-3">
          {entries.map((entry) => {
            const isCurrent = entry.id === current;
            const titleText = t(entry.title);
            const statusText = entryStatus(entry, isCurrent);
            return (
              <div
                className={entry.completed ? 'text-gray-500' : 'text-black'}
                data-test={`journal-entry-${entry.id}`}
                key={entry.id}
              >
                <div className="flex items-baseline gap-3 text-xl font-bold">
                  <span>{entryMarker(entry, isCurrent)}</span>
                  <span>{titleText}</span>
                  {statusText !== titleText && (
                    <span className="text-sm font-normal text-amber-700">
                      {statusText}
                    </span>
                  )}
                </div>
                <div className="text-lg ml-8 break-words">
                  {t(entry.body, entry.values)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MessageBox>
  );
}
