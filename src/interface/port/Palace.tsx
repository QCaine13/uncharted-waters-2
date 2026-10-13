import React, { useState } from 'react';
import useBuilding from './hooks/useBuilding';
import { VendorMessageBoxType } from '../quest/getMessageBoxes';
import BuildingMenu from '../common/BuildingMenu';
import BuildingWrapper from './BuildingWrapper';
import {
  getRoyalRank,
  getTotalFame,
  getTotalInvestment,
} from '../../state/selectors';
import {
  requestRoyalFunding,
  ROYAL_FUNDING_GRANT,
} from '../../state/actionsPort';
import { t } from '../../localization';

const palaceOptions = ['Meet Ruler', 'Defect', 'Gold', 'Ship'] as const;
type PalaceOption = typeof palaceOptions[number];

const enabledPalaceOptions: PalaceOption[] = ['Meet Ruler', 'Gold'];

export default function Palace() {
  const { selectOption, back, reset, state } = useBuilding<PalaceOption>();
  const [fundingGrant, setFundingGrant] = useState<number | null>(null);

  const { option } = state;

  let vendorMessage: VendorMessageBoxType = {
    body: 'Welcome to the Royal Palace. State your business before the court.',
  };

  if (option === 'Meet Ruler') {
    const rank = t(getRoyalRank());
    const fame = getTotalFame();
    const invested = getTotalInvestment();

    vendorMessage = {
      body: t(
        'The Crown recognizes your service! Current Rank: {rank} (Total Fame: {fame}, Port Investment: {invested}).',
        {
          rank,
          fame,
          invested,
        },
      ),
      acknowledge: reset,
    };
  }

  if (option === 'Gold') {
    if (fundingGrant !== null) {
      vendorMessage = {
        body:
          fundingGrant > 0
            ? t(
                'By royal decree, the treasury grants you {gold} gold pieces for your expedition.',
                { gold: fundingGrant },
              )
            : t(
                'Royal expedition subsidies are granted only when your treasury is below {gold}g and your total fame reaches at least 20.',
                { gold: ROYAL_FUNDING_GRANT },
              ),
        acknowledge: () => {
          setFundingGrant(null);
          reset();
        },
      };
    }
  }

  const menu = (
    <BuildingMenu
      options={palaceOptions.map((s) => ({
        label: s === 'Gold' ? 'Gold Funding' : s,
        value: s,
        disabled: !enabledPalaceOptions.includes(s),
      }))}
      onSelect={(s) => {
        if (s === 'Gold') {
          setFundingGrant(requestRoyalFunding());
        }
        selectOption(s);
      }}
      onCancel={back}
      hidden={option !== null}
    />
  );

  return (
    <BuildingWrapper
      buildingId="6"
      vendorMessageBox={vendorMessage}
      menu={menu}
    />
  );
}
