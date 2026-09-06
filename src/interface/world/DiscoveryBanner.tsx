import React, { useState } from 'react';

import { classNames } from '../interfaceUtils';
import updateInterface from '../../state/updateInterface';
import type { Landmark } from '../../data/discoveryData';
import { t } from '../../localization';

interface Props {
  hidden: boolean;
}

// No timers (design spec section 3): the banner persists across renders
// until worldTimeTick replaces it with a later discovery, or dock() clears
// it with an empty array. Never a setTimeout-driven auto-dismiss.
export default function DiscoveryBanner({ hidden }: Props) {
  const [discovered, setDiscovered] = useState<Landmark[]>([]);

  updateInterface.discovery = (nextDiscovered) => {
    setDiscovered(nextDiscovered);
  };

  return (
    <div
      className={classNames(
        'absolute top-8 inset-x-0 flex flex-col items-center gap-2',
        hidden ? 'hidden' : '',
      )}
      data-test="discoveryBanner"
    >
      {discovered.map((landmark) => (
        <div
          key={landmark.id}
          className="bg-black bg-opacity-75 text-white text-xl px-6 py-2"
        >
          {t('Discovered: {name} — +{fame} adventure fame, +{gold}g', {
            name: t(landmark.name),
            fame: landmark.fame,
            gold: landmark.gold,
          })}
        </div>
      ))}
    </div>
  );
}
