import type {
  CombatLogRecord,
  DuelAttack,
  DuelDefense,
} from '../../combat/types';
import { t } from '../../localization';

const attacks: Record<DuelAttack, string> = {
  thrust: 'Thrust',
  slash: 'Slash',
  heavy: 'Heavy strike',
};
const defenses: Record<DuelDefense, string> = {
  parry: 'Parry',
  block: 'Block',
  dodge: 'Dodge',
};

export const attackLabel = (attack: unknown): string =>
  t(
    typeof attack === 'string' &&
      Object.prototype.hasOwnProperty.call(attacks, attack)
      ? attacks[attack as DuelAttack]
      : 'Attack move',
  );

export const defenseLabel = (defense: unknown): string =>
  t(
    typeof defense === 'string' &&
      Object.prototype.hasOwnProperty.call(defenses, defense)
      ? defenses[defense as DuelDefense]
      : 'Defense move',
  );

export const formatCombatLog = ({ key, data }: CombatLogRecord): string => {
  const amount = (name: string): number => {
    const value = data[name];
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  };
  switch (key) {
    case 'combat.duel.attack':
      return t(
        'Your {attack} met the opponent’s {defense}, dealing {damage} damage.',
        {
          attack: attackLabel(data.attack),
          defense: defenseLabel(data.enemyDefense),
          damage: amount('damage'),
        },
      );
    case 'combat.duel.defend':
      return t(
        'The opponent’s {attack} met your {defense}, dealing {damage} damage.',
        {
          attack: attackLabel(data.enemyAttack),
          defense: defenseLabel(data.defense),
          damage: amount('damage'),
        },
      );
    case 'combat.naval.approach':
      return t('Closed to distance {range}.', { range: amount('rangeAfter') });
    case 'combat.naval.withdraw':
      return t('Pulled back to distance {range}.', {
        range: amount('rangeAfter'),
      });
    case 'combat.naval.fire':
      return t('Spent {shot} shot; the enemy lost {damage} hull.', {
        shot: amount('shotCost'),
        damage: amount('damage'),
      });
    case 'combat.naval.board':
      return t(
        'Boarding: the enemy lost {enemy} crew; you lost {player} crew.',
        {
          enemy: amount('enemyCrewLoss'),
          player: amount('playerCrewLoss'),
        },
      );
    case 'combat.naval.repair':
      return t('Spent {lumber} lumber; restored {hull} hull.', {
        lumber: amount('lumberCost'),
        hull: amount('hullRestored'),
      });
    case 'combat.naval.enemy-response':
      if (data.response === 'fire') {
        return t('Enemy cannon fire cost you {damage} hull.', {
          damage: amount('damage'),
        });
      }
      if (data.response === 'board') {
        return t('Enemy boarding cost you {damage} crew.', {
          damage: amount('damage'),
        });
      }
      if (data.response === 'approach')
        return t('The enemy closed the distance.');
      break;
    case 'combat.naval.challenge':
      return t('You challenged the enemy captain to a duel.');
    case 'combat.naval.challenge-result':
      if (data.duelOutcome === 'victory')
        return t('You won the captain’s duel and the naval battle.');
      if (data.duelOutcome === 'defeat')
        return t('You lost the captain’s duel and the naval battle.');
      if (data.duelOutcome === 'draw')
        return t('The captain’s duel was drawn; the naval battle continues.');
      break;
    case 'combat.naval.retreat':
      return t('Your flagship escaped beyond the retreat edge.');
    default:
      break;
  }
  return t('An action was completed.');
};
