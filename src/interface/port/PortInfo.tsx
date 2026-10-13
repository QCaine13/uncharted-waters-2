import React from 'react';

import {
  getRegionOrIfSupplyPort,
  getPortData,
} from '../../game/port/portUtils';
import { getPortPriceIndex } from '../../state/actionsMarket';
import {
  getPortEconomy,
  getPortIndustry,
  getPortInvestment,
} from '../../state/selectors';
import { t } from '../../localization';
import state from '../../state/state';
import { getStoryPortName } from '../../story/portStoryNames';

interface Props {
  portId: string;
}

export default function PortInfo({ portId }: Props) {
  const port = getPortData(portId);

  const economy = port.isSupplyPort ? 0 : getPortEconomy(portId);
  const industry = port.isSupplyPort ? 0 : getPortIndustry(portId);
  const investment = getPortInvestment(portId);

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
      <div className="mb-4 text-right text-xl" data-test="portEconomy">
        {economy}
      </div>
      <div className="text-sm">{t('Investment')}</div>
      <div
        className="mb-4 text-right text-xl"
        data-test="portEconomyInvestment"
      >
        {investment.economy}
      </div>
      <div className="text-sm">{t('Industry')}</div>
      <div className="mb-4 text-right text-xl" data-test="portIndustry">
        {industry}
      </div>
      <div className="text-sm">{t('Investment')}</div>
      <div
        className="mb-4 text-right text-xl"
        data-test="portIndustryInvestment"
      >
        {investment.industry}
      </div>
      <div className="text-sm">{t('Price Index')}</div>
      <div className="mb-4 text-right text-xl">
        {priceIndex === null ? '—' : `${priceIndex}%`}
      </div>
    </div>
  );
}
