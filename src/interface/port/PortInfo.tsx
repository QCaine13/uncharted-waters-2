import React from 'react';

import {
  getRegionOrIfSupplyPort,
  getPortData,
} from '../../game/port/portUtils';
import { getPortPriceIndex } from '../../state/actionsMarket';
import { t } from '../../localization';
import state from '../../state/state';
import { getStoryPortName } from '../../story/portStoryNames';

interface Props {
  portId: string;
}

// TODO Investments
export default function PortInfo({ portId }: Props) {
  const port = getPortData(portId);

  let economy = 0;
  let industry = 0;

  if (!port.isSupplyPort) {
    ({ economy, industry } = port);
  }

  const name = getStoryPortName(portId, state.storyEvents);
  const priceIndex = getPortPriceIndex(portId);

  return (
    <div className="p-5">
      <div
        className="text-2xl font-bold whitespace-nowrap"
        data-test="portName"
      >
        {t(name)}
      </div>
      <div className="mb-20">{t(getRegionOrIfSupplyPort(portId))}</div>
      <div className="text-sm">{t('Economy')}</div>
      <div className="mb-4 text-right text-xl">{economy}</div>
      <div className="text-sm">{t('Investment')}</div>
      <div className="mb-4 text-right text-xl">{economy}</div>
      <div className="text-sm">{t('Industry')}</div>
      <div className="mb-4 text-right text-xl">{industry}</div>
      <div className="text-sm">{t('Investment')}</div>
      <div className="mb-4 text-right text-xl">{industry}</div>
      <div className="text-sm">{t('Price Index')}</div>
      <div className="mb-4 text-right text-xl">
        {priceIndex === null ? '—' : `${priceIndex}%`}
      </div>
    </div>
  );
}
