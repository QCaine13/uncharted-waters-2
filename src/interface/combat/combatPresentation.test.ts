import { createDuel, advanceDuel } from '../../combat/duel';
import { createNaval, advanceNaval } from '../../combat/naval';
import { encounterCatalog } from '../../combat/encounters';
import { setLocale } from '../../localization';
import {
  formatCombatLog,
  attackLabel,
  defenseLabel,
  getCombatResultPreview,
} from './combatPresentation';

afterEach(() => setLocale('zh-CN'));

test('shows the actual shot cost and hull damage from a cannon action in both languages', () => {
  const battle = createNaval({
    encounterId: 'joao.m2.katarina',
    player: { hull: 30, maxHull: 30, crew: 20, guns: 10, shot: 6, lumber: 2 },
    playerDuel: encounterCatalog['joao.m2.kahn-house'].enemy,
  });
  const after = advanceNaval(battle, { type: 'fire' });
  const shot = after.log[0];
  setLocale('zh-CN');
  expect(formatCombatLog(shot)).toBe('消耗 1 发炮弹，敌船损失 8 点耐久。');
  expect(formatCombatLog(after.log[1])).toBe('敌船开炮，我方损失 4 点耐久。');
  setLocale('en');
  expect(formatCombatLog(shot)).toBe('Spent 1 shot; the enemy lost 8 hull.');
});

test('distinguishes a stopped attack from a successful defense without exposing raw action IDs', () => {
  const initial = createDuel({
    encounterId: 'joao.m2.kahn-shipyard',
    player: encounterCatalog['joao.m2.kahn-house'].enemy,
    enemy: encounterCatalog['joao.m2.kahn-shipyard'].enemy,
  });
  const afterAttack = advanceDuel(initial, {
    type: 'attack',
    attack: 'thrust',
  });
  const afterDefense = advanceDuel(afterAttack, {
    type: 'defend',
    defense: 'parry',
  });
  setLocale('zh-CN');
  expect(formatCombatLog(afterAttack.log[0])).toBe(
    '你使出突刺，对手用招架应对，受到 0 点伤害。',
  );
  expect(formatCombatLog(afterDefense.log[1])).toBe(
    '对手使出突刺，你用招架应对，受到 0 点伤害。',
  );
  expect(attackLabel('heavy')).toBe('重击');
  expect(defenseLabel('dodge')).toBe('闪避');
});

test('reports both sides of boarding losses and distinguishes captain draw from victory', () => {
  setLocale('zh-CN');
  expect(
    formatCombatLog({
      key: 'combat.naval.board',
      data: { enemyCrewLoss: 6, playerCrewLoss: 3 },
    }),
  ).toBe('接舷交战：敌方损失 6 名船员，我方损失 3 名船员。');
  expect(
    formatCombatLog({
      key: 'combat.naval.challenge-result',
      data: { duelOutcome: 'draw' },
    }),
  ).toBe('船长决斗未分胜负，海战继续。');
  expect(
    formatCombatLog({
      key: 'combat.naval.challenge-result',
      data: { duelOutcome: 'victory' },
    }),
  ).toBe('你赢得船长决斗，海战获胜。');
});

test('renders an unfamiliar saved log record as neutral text', () => {
  setLocale('en');
  expect(
    formatCombatLog({
      key: 'future.combat.action',
      data: { privateId: 'future' },
    }),
  ).toBe('An action was completed.');
});

test.each([
  ['joao.m2.kahn-shipyard', 'victory', { joao: 0, others: 0 }, null],
  ['joao.m2.kahn-house', 'victory', { joao: 100, others: 0 }, null],
  ['joao.m2.katarina', 'defeat', { joao: 0, others: 0 }, 'Lisbon'],
  ['joao.m2.katarina', 'retreat', { joao: 25, others: 25 }, null],
  ['joao.m3.ottoman-one', 'victory', { joao: 100, others: 50 }, null],
  ['joao.m3.ottoman-one', 'retreat', { joao: 25, others: 25 }, null],
  ['joao.m3.ottoman-one', 'defeat', { joao: 0, others: 0 }, 'Massawa'],
  ['joao.m3.ottoman-two', 'victory', { joao: 100, others: 50 }, null],
  ['joao.m3.ottoman-two', 'retreat', { joao: 25, others: 25 }, null],
  ['joao.m3.ottoman-two', 'defeat', { joao: 0, others: 0 }, 'Massawa'],
  ['joao.m3.rudolph', 'victory', { joao: 100, others: 0 }, null],
  ['joao.m3.rudolph', 'defeat', { joao: 0, others: 0 }, null],
  ['joao.m3.amazon', 'victory', { joao: 150, others: 75 }, null],
  ['joao.m3.amazon', 'retreat', { joao: 0, others: 0 }, null],
  ['joao.m3.amazon', 'draw', { joao: 0, others: 0 }, null],
  ['joao.m3.amazon', 'defeat', { joao: 0, others: 0 }, 'Cayenne'],
  ['future.encounter', 'victory', { joao: 0, others: 0 }, null],
] as const)(
  'previews %s %s with its actual rewards and recovery name',
  (encounterId, outcome, experience, recoveryPortNameKey) => {
    expect(getCombatResultPreview(encounterId, outcome)).toEqual({
      experience,
      recoveryPortNameKey,
    });
  },
);
