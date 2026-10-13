import React from 'react';

import { t } from '../localization';

export default function CatalinaEnding() {
  return (
    <div
      className="mb-5 rounded border border-amber-700 bg-amber-50 p-4 text-black break-words"
      data-test="catalinaEnding"
    >
      <div className="mb-2 text-2xl font-bold">{t('Katarina’s reckoning')}</div>
      <div className="text-lg">
        {t(
          'Katarina avenged Michael and Hernan by crushing Marquis Martinez’s armada at the Amazon and winning a royal pardon in Seville.',
        )}
      </div>
      <div className="mt-2 text-lg font-bold">
        {t('The main story is complete. You can continue exploring.')}
      </div>
    </div>
  );
}
