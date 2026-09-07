import React from 'react';

import { t } from '../localization';

export default function JoaoEnding() {
  return (
    <div
      className="mb-5 rounded border border-amber-700 bg-amber-50 p-4 text-black break-words"
      data-test="joaoEnding"
    >
      <div className="mb-2 text-2xl font-bold">{t('João’s homecoming')}</div>
      <div className="text-lg">
        {t(
          'João returned home with his family’s accusation resolved, Lucia rescued, and the alliance victorious.',
        )}
      </div>
      <div className="mt-2 text-lg font-bold">
        {t('The main story is complete. You can continue exploring.')}
      </div>
    </div>
  );
}
