import React from 'react';
import type { NavalAction, NavalState } from '../../combat/types';
import { t } from '../../localization';

interface Props {
  naval: NavalState;
  onAction: (action: NavalAction) => void;
  disabled?: boolean;
}

interface Choice {
  action: NavalAction;
  label: string;
  test: string;
  reason: string | null;
}

const buttonClass =
  'w-full border-2 border-amber-900 bg-orange-100 px-3 py-2 text-xl font-bold text-amber-900 hover:bg-amber-200 focus:outline focus:outline-4 focus:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50';

const fireReason = (naval: NavalState): string | null => {
  if (naval.player.guns === 0) return 'Your ship has no cannons.';
  if (naval.player.shot === 0) return 'No cannon shot remains.';
  if (naval.range > 2) return 'Move within cannon range first.';
  return null;
};

const repairReason = (naval: NavalState): string | null => {
  if (naval.player.lumber === 0) return 'No repair lumber remains.';
  if (naval.player.hull >= naval.player.maxHull)
    return 'The hull is already fully repaired.';
  return null;
};

const challengeReason = (naval: NavalState): string | null => {
  if (naval.range !== 0) return 'Move alongside the enemy first.';
  if (naval.player.crew < naval.enemy.crew)
    return 'You need at least as many crew as the enemy to challenge its captain.';
  return null;
};

const choicesFor = (naval: NavalState): Choice[] => [
  {
    action: { type: 'approach' },
    label: 'Approach',
    test: 'naval-approach',
    reason: naval.range === 0 ? 'Already alongside the enemy.' : null,
  },
  {
    action: { type: 'withdraw' },
    label: 'Increase distance',
    test: 'naval-withdraw',
    reason: naval.range === 3 ? 'Already at the retreat edge.' : null,
  },
  {
    action: { type: 'fire' },
    label: 'Fire cannons',
    test: 'naval-fire',
    reason: fireReason(naval),
  },
  {
    action: { type: 'board' },
    label: 'Board',
    test: 'naval-board',
    reason: naval.range !== 0 ? 'Move alongside the enemy first.' : null,
  },
  {
    action: { type: 'repair' },
    label: 'Repair hull',
    test: 'naval-repair',
    reason: repairReason(naval),
  },
  {
    action: { type: 'challenge' },
    label: 'Challenge the captain',
    test: 'naval-challenge',
    reason: challengeReason(naval),
  },
  {
    action: { type: 'retreat' },
    label: 'Retreat',
    test: 'naval-retreat',
    reason: naval.range !== 3 ? 'Reach distance 3 before retreating.' : null,
  },
];

export default function NavalControls({
  naval,
  onAction,
  disabled = false,
}: Props) {
  if (naval.outcome !== null || naval.boardingDuel !== null) return null;

  return (
    <section data-test="navalControls">
      <h2 className="mb-2 text-2xl font-bold">{t('Your move')}</h2>
      <div className="grid grid-cols-3 gap-3">
        {choicesFor(naval).map(({ action, label, test, reason }) => (
          <div key={test} className="min-w-0">
            <button
              type="button"
              className={buttonClass}
              data-test={test}
              disabled={disabled || reason !== null}
              onClick={() => onAction(action)}
            >
              {t(label)}
            </button>
            {reason && (
              <p className="mt-1 text-sm leading-tight text-red-200">
                {t(reason)}
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-base text-slate-200">
        {t('Cannon fire costs one shot. Repairs cost one unit of lumber.')}
      </p>
    </section>
  );
}
