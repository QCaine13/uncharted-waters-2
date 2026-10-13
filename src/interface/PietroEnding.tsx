import React from 'react';

import { t } from '../localization';

export default function PietroEnding() {
  return (
    <div
      className="mb-5 rounded border border-amber-700 bg-amber-50 p-4 text-black break-words"
      data-test="pietroEnding"
    >
      <div className="mb-2 text-2xl font-bold">{t('Pietro’s triumph')}</div>
      <div className="text-lg">
        {t(
          'Pietro cleared the Conti family debts, aided João at Massawa, and unlocked the golden horizon of El Dorado.',
        )}
      </div>
      <div className="mt-2 text-lg font-bold">
        {t('The main story is complete. You can continue exploring.')}
      </div>
    </div>
  );
}
