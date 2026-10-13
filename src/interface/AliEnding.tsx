import React from 'react';

import { t } from '../localization';

export default function AliEnding() {
  return (
    <div
      className="mb-5 rounded border border-amber-700 bg-amber-50 p-4 text-black break-words"
      data-test="aliEnding"
    >
      <div className="mb-2 text-2xl font-bold">{t('Ali’s fortune')}</div>
      <div className="text-lg">
        {t(
          'Ali built a legendary trading fleet from a single dhow, reunited with his sister Sasha in Basra, and rose to Grand Commercial Advisor in Istanbul.',
        )}
      </div>
      <div className="mt-2 text-lg font-bold">
        {t('The main story is complete. You can continue exploring.')}
      </div>
    </div>
  );
}
