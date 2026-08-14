import React, { useState } from 'react';

import Assets from '../../assets';
import { classNames } from '../interfaceUtils';
import updateInterface from '../../state/updateInterface';
import { getPlayerFleet } from '../../state/selectorsFleet';
import { getProvisionSummary, ProvisionSummary } from '../../state/provisions';

const provisionClass = 'flex items-center py-2';
const quantityClass = 'flex-1 text-right text-xl';

interface Props {
  hidden: boolean;
}

export const getProvisionStatusText = ({
  dailyConsumption,
  daysRemaining,
  status,
}: ProvisionSummary): string | null => {
  if (dailyConsumption === 0 || daysRemaining === null) {
    return null;
  }
  if (status === 'exhausted') {
    return 'Supplies exhausted';
  }
  if (daysRemaining === 0) {
    return 'Less than 1 day remaining';
  }
  if (status === 'low') {
    return `Only ${daysRemaining} day${
      daysRemaining === 1 ? '' : 's'
    } remaining`;
  }
  return `${daysRemaining} days remaining`;
};

export const getStarvationReportText = ({
  crewLosses,
  adrift,
}: ProvisionSummary): string | null => {
  const deaths = (crewLosses ?? []).reduce(
    (total, loss) => total + loss.deaths,
    0,
  );

  if (deaths === 0) {
    return null;
  }

  const lost = `Lost ${deaths} crew member${deaths === 1 ? '' : 's'} to starvation`;

  return adrift ? `${lost} — the fleet drifted into port` : lost;
};

export default function Provisions({ hidden }: Props) {
  const [summary, setSummary] = useState<ProvisionSummary>(() =>
    getProvisionSummary(getPlayerFleet()),
  );

  updateInterface.provisions = (nextSummary) => {
    setSummary(nextSummary);
  };

  const { water, food, lumber, shot } = summary.provisions;
  let warningClass = '';

  if (summary.status === 'exhausted') {
    warningClass = 'text-red-600';
  } else if (summary.status === 'low') {
    warningClass = 'text-orange-500';
  }
  const statusText = getProvisionStatusText(summary);
  const starvationText = getStarvationReportText(summary);

  return (
    <div
      className={classNames('mt-20', hidden ? 'hidden' : '')}
      data-test="provisions"
    >
      <div className="text-sm mb-4">Provisions</div>
      {!!statusText && (
        <div
          className={classNames('text-sm mb-2', warningClass)}
          data-test="provisionStatus"
        >
          {statusText}
        </div>
      )}
      {!!starvationText && (
        <div
          className="text-sm mb-2 text-red-600"
          data-test="provisionStarvation"
        >
          {starvationText}
        </div>
      )}
      <div className={classNames(provisionClass, warningClass)}>
        <img
          src={Assets.images('worldWater').toDataURL()}
          alt="Water"
          className="w-8 h-16"
        />
        <div className={quantityClass} data-test="provision-water">
          {water}
        </div>
      </div>
      <div className={classNames(provisionClass, warningClass)}>
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
