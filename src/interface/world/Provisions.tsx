import React, { useState } from 'react';

import Assets from '../../assets';
import { getProvisionSummary } from '../../state/provisions';
import type { ProvisionSummary } from '../../state/provisions';
import { getPlayerFleet } from '../../state/selectorsFleet';
import { classNames } from '../interfaceUtils';
import updateInterface from '../../state/updateInterface';

const provisionClass = 'flex items-center py-2';
const quantityClass = 'flex-1 text-right text-xl';

interface Props {
  hidden: boolean;
}

export default function Provisions({ hidden }: Props) {
  const [summary, setSummary] = useState<ProvisionSummary>(() =>
    getProvisionSummary(getPlayerFleet()),
  );

  updateInterface.provisions = (nextSummary) => {
    setSummary(nextSummary);
  };

  const { water, food, lumber, shot } = summary.provisions;

  return (
    <div className={classNames('mt-20', hidden ? 'hidden' : '')}>
      <div className="text-sm mb-4">Provisions</div>
      <div className={provisionClass}>
        <img
          src={Assets.images('worldWater').toDataURL()}
          alt="Water"
          className="w-8 h-16"
        />
        <div className={quantityClass} data-test="provision-water">
          {water}
        </div>
      </div>
      <div className={provisionClass}>
        <img
          src={Assets.images('worldFood').toDataURL()}
          alt="food"
          className="w-8 h-16"
        />
        <div className={quantityClass} data-test="provision-food">
          {food}
        </div>
      </div>
      <div className={provisionClass}>
        <img
          src={Assets.images('worldLumber').toDataURL()}
          alt="Lumber"
          className="w-8 h-16"
        />
        <div className={quantityClass}>{lumber}</div>
      </div>
      <div className={provisionClass}>
        <img
          src={Assets.images('worldShot').toDataURL()}
          alt="Shot"
          className="w-8 h-16"
        />
        <div className={quantityClass}>{shot}</div>
      </div>
    </div>
  );
}
