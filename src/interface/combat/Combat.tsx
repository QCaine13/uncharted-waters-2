import React, { useSyncExternalStore } from 'react';
import type {
  CombatOutcome,
  CombatState,
  DuelState,
  NavalState,
} from '../../combat/types';
import { getCombatSnapshot, subscribeCombat } from '../../combat/combatEvents';
import { itemData } from '../../data/itemData';
import { t } from '../../localization';
import useLocale from '../../localization/useLocale';
import { actCombat, finishCombat } from '../../state/actionsCombat';
import state from '../../state/state';
import DuelControls from './DuelControls';
import NavalControls from './NavalControls';
import { formatCombatLog } from './combatPresentation';

const encounterNames: Record<string, string> = {
  'joao.m2.kahn-shipyard': 'Kahn at the shipyard',
  'joao.m2.kahn-house': 'Kahn at the Franco house',
  'joao.m2.katarina': 'Katarina’s pursuit',
};

const outcomeTitles: Record<CombatOutcome, string> = {
  victory: 'Battle won',
  defeat: 'Battle lost',
  draw: 'Duel drawn',
  retreat: 'Retreat successful',
};

const rangeNames = [
  'Adjacent',
  'Close range',
  'Cannon range',
  'Retreat edge',
] as const;

const equipmentName = (itemId: string): string =>
  itemData[itemId as keyof typeof itemData]?.name ?? itemId;

function CombatantCard({
  title,
  hp,
  maximum,
}: {
  title: string;
  hp: number;
  maximum: number;
}) {
  return (
    <div className="border-4 border-amber-900 bg-[#f3e3d3] p-4 text-amber-900 shadow-[inset_0_0_0_2px_#f3a261]">
      <h2 className="text-2xl font-bold">{t(title)}</h2>
      <div className="mt-2 text-xl">
        {t('HP {current}/{maximum}', { current: hp, maximum })}
      </div>
      <div className="mt-2 h-3 border border-black bg-blue-900">
        <div
          className="h-full bg-red-600"
          style={{ width: `${maximum === 0 ? 0 : (hp / maximum) * 100}%` }}
        />
      </div>
    </div>
  );
}

function DuelSummary({ duel }: { duel: DuelState }) {
  const enemyName =
    duel.encounterId === 'joao.m2.katarina'
      ? 'Katarina Erantzo'
      : 'Antonio Kahn';
  return (
    <>
      <div className="grid grid-cols-2 gap-5">
        <CombatantCard
          title="João Franco"
          hp={duel.player.hp}
          maximum={duel.player.maxHp}
        />
        <CombatantCard
          title={enemyName}
          hp={duel.enemy.hp}
          maximum={duel.enemy.maxHp}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-6 text-base text-amber-200">
        <span>
          {state.equipment.weaponId
              ? t('Weapon: {name}', {
                  name: t(equipmentName(state.equipment.weaponId)),
                })
            : t('No weapon equipped')}
        </span>
        <span>
          {state.equipment.armorId
              ? t('Armor: {name}', {
                  name: t(equipmentName(state.equipment.armorId)),
                })
            : t('No armor equipped')}
        </span>
        <span>
          {t('Battle level {level}', { level: duel.player.stats.level })}
        </span>
      </div>
    </>
  );
}

function NavalSummary({ naval }: { naval: NavalState }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-5">
        <div className="border-4 border-amber-900 bg-[#f3e3d3] p-4 text-xl text-amber-900">
          <h2 className="text-2xl font-bold">{t('Your flagship')}</h2>
          <p>
            {t('Hull {current}/{maximum}', {
              current: naval.player.hull,
              maximum: naval.player.maxHull,
            })}
          </p>
          <p>{t('Crew {count}', { count: naval.player.crew })}</p>
          <p>
            {t('Effective firepower {count}', { count: naval.player.guns })}
          </p>
          <p>{t('Cannon shot {count}', { count: naval.player.shot })}</p>
          <p>{t('Repair lumber {count}', { count: naval.player.lumber })}</p>
        </div>
        <div className="border-4 border-amber-900 bg-[#f3e3d3] p-4 text-xl text-amber-900">
          <h2 className="text-2xl font-bold">{t('Enemy flagship')}</h2>
          <p>
            {t('Hull {current}/{maximum}', {
              current: naval.enemy.hull,
              maximum: naval.enemy.maxHull,
            })}
          </p>
          <p>{t('Crew {count}', { count: naval.enemy.crew })}</p>
          <p>{t('Effective firepower {count}', { count: naval.enemy.guns })}</p>
        </div>
      </div>
      <div
        className="text-center text-2xl font-bold text-amber-200"
        data-test="naval-range"
      >
        {t('Distance {range}', { range: naval.range })} —{' '}
        {t(rangeNames[naval.range])}
      </div>
    </div>
  );
}

function Result({ combat }: { combat: CombatState }) {
  const lines: string[] = [];
  if (combat.kind === 'naval') {
    if (combat.outcome === 'victory') {
      lines.push(t('João gains {amount} battle experience.', { amount: 100 }));
      lines.push(
        t('Each companion gains {amount} battle experience.', { amount: 50 }),
      );
    } else if (combat.outcome === 'retreat') {
      lines.push(
        t('Every current mate gains {amount} battle experience.', {
          amount: 25,
        }),
      );
    } else if (combat.outcome === 'defeat') {
      lines.push(
        t(
          'Your fleet will return safely to Lisbon. The flagship will receive emergency repairs and replacement crew.',
        ),
      );
      lines.push(t('Your ships, items and gold are retained.'));
    }
  } else if (
    combat.encounterId === 'joao.m2.kahn-house' &&
    combat.outcome === 'victory'
  ) {
    lines.push(t('João gains {amount} battle experience.', { amount: 100 }));
  } else {
    lines.push(t('No experience is awarded for this encounter.'));
  }

  return (
    <section
      className="mx-auto mt-10 max-w-3xl border-4 border-amber-900 bg-[#f3e3d3] p-8 text-center text-amber-900"
      data-test="combat-result"
    >
      <h2 className="text-4xl font-bold">
        {t(outcomeTitles[combat.outcome!])}
      </h2>
      {lines.map((line) => (
        <p className="mt-3 text-xl" key={line}>
          {line}
        </p>
      ))}
      <button
        type="button"
        className="mt-8 border-2 border-amber-900 bg-orange-100 px-8 py-3 text-2xl font-bold hover:bg-amber-200"
        data-test="finish-combat"
        onClick={() => finishCombat(combat)}
      >
        {t('Continue')}
      </button>
    </section>
  );
}

export default function Combat() {
  useLocale();
  const combat = useSyncExternalStore(subscribeCombat, getCombatSnapshot);
  if (combat === null) return null;

  const dispatch = (action: Parameters<typeof actCombat>[1]) =>
    actCombat(combat, action);
  const nested = combat.kind === 'naval' ? combat.boardingDuel : null;
  let body: React.ReactNode;
  if (combat.outcome !== null) {
    body = <Result combat={combat} />;
  } else if (nested) {
    body = (
      <div className="space-y-4">
        <DuelSummary duel={nested} />
        {nested.outcome === null ? (
          <DuelControls
            duel={nested}
            onAction={(action) => dispatch({ type: 'duel', action })}
          />
        ) : (
          <section className="text-center">
            <h2 className="text-3xl font-bold">
              {t(outcomeTitles[nested.outcome])}
            </h2>
            <button
              type="button"
              className="mt-4 border-2 border-amber-900 bg-orange-100 px-6 py-3 text-xl font-bold text-amber-900"
              onClick={() => dispatch({ type: 'resolveChallenge' })}
            >
              {t('Return to naval battle')}
            </button>
          </section>
        )}
      </div>
    );
  } else if (combat.kind === 'duel') {
    body = (
      <div className="space-y-4">
        <DuelSummary duel={combat} />
        <DuelControls duel={combat} onAction={dispatch} />
      </div>
    );
  } else {
    body = (
      <div className="space-y-3">
        <NavalSummary naval={combat} />
        <NavalControls naval={combat} onAction={dispatch} />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-20 overflow-hidden bg-slate-900/95 p-6 text-white"
      role="dialog"
      aria-label={t(combat.kind === 'duel' ? 'Duel' : 'Naval battle')}
      data-test="combat"
    >
      <header className="mb-3 flex items-center justify-between border-b-2 border-amber-500 pb-2">
        <h1 className="text-3xl font-bold">
          {t(encounterNames[combat.encounterId] ?? 'Battle')}
        </h1>
        <p className="text-2xl">
          {t('Round {round}', { round: combat.round })}
        </p>
      </header>

      {body}

      {combat.log.length > 0 && (
        <section
          className="mt-3 max-h-36 overflow-y-auto border-2 border-amber-700 bg-black/60 p-3"
          aria-label={t('Battle log')}
          data-test="combat-log"
        >
          <h2 className="text-lg font-bold">{t('Battle log')}</h2>
          <ol className="text-base">
            {combat.log.map((record) => (
              <li key={JSON.stringify(record)}>{formatCombatLog(record)}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
