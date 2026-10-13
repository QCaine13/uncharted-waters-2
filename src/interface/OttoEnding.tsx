import React from 'react';

import { t } from '../localization';

export default function OttoEnding() {
  return (
    <div
      className="mb-5 rounded border border-amber-700 bg-amber-50 p-4 text-black break-words"
      data-test="ottoEnding"
    >
      <div className="mb-2 text-2xl font-bold">{t('Otto’s triumph')}</div>
      <div className="text-lg">
        {t(
          'Otto shattered the Spanish Invincible Armada in the Bay of Biscay and returned to London as Lord High Admiral of the Royal Navy.',
        )}
      </div>
      <div className="mt-2 text-lg font-bold">
        {t('The main story is complete. You can continue exploring.')}
      </div>
    </div>
  );
}
