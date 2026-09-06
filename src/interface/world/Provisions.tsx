import React, { useState } from 'react';

import Assets from '../../assets';
import { classNames } from '../interfaceUtils';
import updateInterface from '../../state/updateInterface';
import { getPlayerFleet } from '../../state/selectorsFleet';
import { getProvisionSummary, ProvisionSummary } from '../../state/provisions';
import { t } from '../../localization';

/*
  The icons are 16x32 pixel art drawn at their native size. At the 2x they used
  to be drawn at, four rows came to 320px — over a third of the 800px the whole
  HUD column has — and pushed the bottom of the column out past the game frame.
  Halving is the only step down that keeps whole source pixels; 1.5x would
  double some columns of a 16px-wide sprite and not others.
 */
const iconClass = 'w-4 h-8';
const provisionClass = 'flex items-center py-1';
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
    return t('Supplies exhausted');
  }
  if (daysRemaining === 0) {
    return t('Less than 1 day remaining');
  }
  if (status === 'low') {
    return t(daysRemaining === 1 ? 'Only {days} day remaining' : 'Only {days} days remaining', { days: daysRemaining });
  }
  return t('{days} days remaining', { days: daysRemaining });
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

  const lost = t(deaths === 1 ? 'Lost {deaths} crew member to starvation' : 'Lost {deaths} crew members to starvation', { deaths });

  return adrift ? t('{lost} — the fleet drifted into port', { lost }) : lost;
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
      className={classNames('mt-8', hidden ? 'hidden' : '')}
      data-test="provisions"
    >
      <div className="text-sm mb-4">{t('Provisions')}</div>
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
          alt={t('Water')}
          className={iconClass}
        />
        <div className={quantityClass} data-test="provision-water">
          {water}
        </div>
      </div>
      <div className={classNames(provisionClass, warningClass)}>
        <img
          src={Assets.images('worldFood').toDataURL()}
          alt={t('Food')}
          className={iconClass}
        />
        <div className={quantityClass} data-test="provision-food">
          {food}
        </div>
      </div>
      <div className={provisionClass}>
        <img
          src={Assets.images('worldLumber').toDataURL()}
          alt={t('Lumber')}
          className={iconClass}
        />
        <div className={quantityClass}>{lumber}</div>
      </div>
      <div className={provisionClass}>
        <img
          src={Assets.images('worldShot').toDataURL()}
          alt={t('Shot')}
          className={iconClass}
        />
        <div className={quantityClass}>{shot}</div>
      </div>
    </div>
  );
}
