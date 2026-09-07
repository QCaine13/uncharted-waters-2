import React from 'react';

import { t } from '../localization';
import { getFirstVoyageJournal } from '../story/firstVoyageJournal';
import { getConflictAndGrowthJournal } from '../story/conflictAndGrowthJournal';
import { CHAPTER_COMPLETE_EVENT_ID } from '../story/content/arcs/joao/first-voyage';
import type { JournalEntry } from '../story/firstVoyageJournal';
import state from '../state/state';
import MessageBox from './common/MessageBox';

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
  const firstVoyage = getFirstVoyageJournal(state);
  const entries = state.storyEvents.includes(CHAPTER_COMPLETE_EVENT_ID)
    ? [...getConflictAndGrowthJournal(state), ...firstVoyage]
    : firstVoyage;
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
        <div className="space-y-3">
          {entries.map((entry) => {
            const isCurrent = entry.id === current;
            return (
              <div
                className={entry.completed ? 'text-gray-500' : 'text-black'}
                data-test={`journal-entry-${entry.id}`}
                key={entry.id}
              >
                <div className="flex items-baseline gap-3 text-xl font-bold">
                  <span>{entryMarker(entry, isCurrent)}</span>
                  <span>{t(entry.title)}</span>
                  <span className="text-sm font-normal text-amber-700">
                    {entryStatus(entry, isCurrent)}
                  </span>
                </div>
                <div className="text-lg ml-8">{t(entry.body)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </MessageBox>
  );
}
