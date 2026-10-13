import React from 'react';

import { t } from '../localization';

export default function ErnstEnding() {
  return (
    <div
      className="mb-5 rounded border border-amber-700 bg-amber-50 p-4 text-black break-words"
      data-test="ernstEnding"
    >
      <div className="mb-2 text-2xl font-bold">{t('Ernst’s world atlas')}</div>
      <div className="text-lg">
        {t(
          'Ernst, Laura, and Hans united the bearings of every ocean into Master Mercator’s complete world atlas in Amsterdam.',
        )}
      </div>
      <div className="mt-2 text-lg font-bold">
        {t('The main story is complete. You can continue exploring.')}
      </div>
    </div>
  );
}
