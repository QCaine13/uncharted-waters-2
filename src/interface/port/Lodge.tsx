import React, { useEffect } from 'react';
import useBuilding from './hooks/useBuilding';
import { VendorMessageBoxType } from '../quest/getMessageBoxes';
import BuildingMenu from '../common/BuildingMenu';
import BuildingWrapper from './BuildingWrapper';
import { checkIn } from '../../state/actionsPort';
import { getPortEconomy, getPortIndustry } from '../../state/selectors';
import { getPortPriceIndex } from '../../state/actionsMarket';
import { getRegionOrIfSupplyPort } from '../../game/port/portUtils';
import { getStoryPortName } from '../../story/portStoryNames';
import gameState from '../../state/state';
import { t } from '../../localization';

const lodgeOptions = ['Check In', 'Gossip', 'Port Info'] as const;
type LodgeOptions = typeof lodgeOptions[number];

export default function Lodge() {
  const { selectOption, back, state } = useBuilding<LodgeOptions>();

  const { option } = state;

  useEffect(() => {
    if (option === 'Check In') {
      checkIn();
    }
  }, [option]);

  let vendorMessage: VendorMessageBoxType = {
    body: 'Welcome. You must be tired. Please make yourself at home.',
  };

  if (option === 'Gossip') {
    vendorMessage = {
      body: 'Merchants say that buying abundant goods at 100% or below and selling where they are scarce yields the best profits.',
      acknowledge: back,
    };
  }

  if (option === 'Port Info') {
    const portId = gameState.portId ?? '1';
    const portName = t(getStoryPortName(portId, gameState.storyEvents));
    const region = t(getRegionOrIfSupplyPort(portId));
    const economy = getPortEconomy(portId);
    const industry = getPortIndustry(portId);
    const priceIndex = getPortPriceIndex(portId) ?? 100;

    vendorMessage = {
      body: t(
        '{port} ({region}) — Economy: {economy}, Industry: {industry}, Price Index: {priceIndex}%.',
        {
          port: portName,
          region,
          economy,
          industry,
          priceIndex,
        },
      ),
      acknowledge: back,
    };
  }

  const menu = (
    <BuildingMenu
      options={lodgeOptions.map((s) => ({
        label: s,
        value: s,
      }))}
      onSelect={(s) => selectOption(s)}
      onCancel={back}
      hidden={option !== null}
    />
  );

  return (
    <BuildingWrapper
      buildingId="5"
      vendorMessageBox={vendorMessage}
      menu={menu}
    />
  );
}
