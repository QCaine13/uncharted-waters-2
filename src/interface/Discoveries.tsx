import React, { useState } from 'react';

import { getDiscoveries } from '../state/selectors';
import MessageBox from './common/MessageBox';
import Menu from './common/Menu';
import { t } from '../localization';

// Conventional coordinate formatting, e.g. -34.36 -> "34.4° S" (design spec
// section 5). Kept as plain functions, not a component, so a sign bug in
// either hemisphere letter shows up directly in a unit test.
export const formatLatitude = (latitude: number): string =>
  `${Math.abs(latitude).toFixed(1)}° ${t(latitude < 0 ? 'S' : 'N')}`;

export const formatLongitude = (longitude: number): string =>
  `${Math.abs(longitude).toFixed(1)}° ${t(longitude < 0 ? 'W' : 'E')}`;

export default function Discoveries() {
  const discoveries = getDiscoveries();

  const [selectedI, setSelectedI] = useState(0);

  if (!discoveries.length) {
    return (
      <MessageBox>
        <div className="text-2xl px-4 py-2 text-black w-64">
          {t('You have no discoveries.')}
        </div>
      </MessageBox>
    );
  }

  const landmark = discoveries[selectedI];

  return (
    <MessageBox>
      <div className="flex">
        <div className="w-[280px]">
          <Menu
            options={discoveries.map(({ name }, i) => ({
              label: name,
              value: i,
            }))}
            onSelect={() => {}}
            onActiveIndex={setSelectedI}
          />
        </div>
        <div className="relative w-[736px] h-[304px] px-16 pt-8 text-black">
          <div className="text-2xl text-blue-600">{t(landmark.name)}</div>
          <div className="text-xl mt-4">
            {t('+{fame} adventure fame, +{gold}g', {
              fame: landmark.fame,
              gold: landmark.gold,
            })}
          </div>
          <div className="text-xl mt-2">
            {`${formatLatitude(landmark.latitude)}, ${formatLongitude(
              landmark.longitude,
            )}`}
          </div>
        </div>
      </div>
    </MessageBox>
  );
}
