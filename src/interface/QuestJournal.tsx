import React from 'react';

import { t } from '../localization';
import { getFirstVoyageJournal } from '../story/firstVoyageJournal';
import state from '../state/state';
import MessageBox from './common/MessageBox';

const entryMarker = (completed: boolean, current: boolean): string => {
  if (completed) return '✓';
  return current ? '→' : '○';
};

const entryStatus = (completed: boolean, current: boolean): string => {
  if (completed) return t('Complete');
  return t(current ? 'Current objective' : 'Upcoming objective');
};

export default function QuestJournal() {
  const entries = getFirstVoyageJournal(state);
  const current = entries.find(({ completed }) => !completed)?.id;

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
                  <span>{entryMarker(entry.completed, isCurrent)}</span>
                  <span>{t(entry.title)}</span>
                  <span className="text-sm font-normal text-amber-700">
                    {entryStatus(entry.completed, isCurrent)}
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
