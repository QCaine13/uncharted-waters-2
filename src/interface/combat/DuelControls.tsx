import React from 'react';
import type {
  DuelAction,
  DuelAttack,
  DuelDefense,
  DuelState,
} from '../../combat/types';
import { t } from '../../localization';
import { attackLabel, defenseLabel } from './combatPresentation';

interface Props {
  duel: DuelState;
  onAction: (action: DuelAction) => void;
  disabled?: boolean;
}

const attacks: DuelAttack[] = ['thrust', 'slash', 'heavy'];
const defenses: DuelDefense[] = ['parry', 'block', 'dodge'];
const buttonClass =
  'border-2 border-amber-900 bg-orange-100 px-4 py-3 text-2xl font-bold text-amber-900 hover:bg-amber-200 focus:outline focus:outline-4 focus:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50';

export default function DuelControls({
  duel,
  onAction,
  disabled = false,
}: Props) {
  if (duel.outcome !== null) return null;
  const attacking = duel.phase === 'attack';

  return (
    <section
      data-test="duelControls"
      data-phase={duel.phase}
      className="space-y-3"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-2xl font-bold">
          {t(attacking ? 'Choose your attack' : 'Choose your defense')}
        </h2>
        <p className="text-xl text-amber-200">
          {attacking
            ? t('Opponent’s defense: {defense}', {
                defense: defenseLabel(duel.enemyDefense),
              })
            : t('Incoming attack: {attack}', {
                attack: attackLabel(duel.enemyAttack),
              })}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {attacking
          ? attacks.map((attack) => (
              <button
                type="button"
                key={attack}
                data-test={`duel-attack-${attack}`}
                className={buttonClass}
                disabled={disabled}
                onClick={() => onAction({ type: 'attack', attack })}
              >
                {attackLabel(attack)}
              </button>
            ))
          : defenses.map((defense) => (
              <button
                type="button"
                key={defense}
                data-test={`duel-defend-${defense}`}
                className={buttonClass}
                disabled={disabled}
                onClick={() => onAction({ type: 'defend', defense })}
              >
                {defenseLabel(defense)}
              </button>
            ))}
      </div>
      <p className="text-lg text-slate-200">
        {t(
          attacking
            ? 'Avoid the attack your opponent is prepared to stop.'
            : 'Parry stops thrusts. Block stops slashes. Dodge stops heavy strikes.',
        )}
      </p>
    </section>
  );
}
