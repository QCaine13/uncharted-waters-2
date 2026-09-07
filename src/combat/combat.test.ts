import { itemData } from '../data/itemData';
import { encounterCatalog } from './encounters';
import { advanceDuel, createDuel } from './duel';
import { createPlayerDuelStats } from './stats';
import { advanceNaval, createNaval } from './naval';
import type {
  DuelAction,
  DuelAttack,
  DuelCombatantStats,
  DuelDefense,
} from './types';

const player: DuelCombatantStats = {
  swordplay: 60,
  level: 3,
  weaponRating: 20,
  armorRating: 10,
  weaponCategory: '1',
};

const enemy: DuelCombatantStats = {
  swordplay: 66,
  level: 2,
  weaponRating: 10,
  armorRating: 0,
  weaponCategory: '1',
};

describe('duel rules', () => {
  test('creates a deterministic encounter with rotating enemy tells', () => {
    const duel = createDuel({ encounterId: 'test.duel', player, enemy });

    expect(duel).toMatchObject({
      kind: 'duel',
      encounterId: 'test.duel',
      revision: 0,
      round: 1,
      phase: 'attack',
      outcome: null,
      enemyDefense: 'parry',
      enemyAttack: 'thrust',
      player: { hp: 86, maxHp: 86, stats: player },
      enemy: { hp: 84, maxHp: 84, stats: enemy },
      log: [],
    });

    const afterAttack = advanceDuel(duel, { type: 'attack', attack: 'slash' });
    const afterDefense = advanceDuel(afterAttack, {
      type: 'defend',
      defense: 'parry',
    });

    expect(afterAttack).toMatchObject({
      revision: 1,
      phase: 'defend',
      enemy: { hp: 61 },
    });
    expect(afterDefense).toMatchObject({
      revision: 2,
      round: 2,
      phase: 'attack',
      enemyDefense: 'block',
      enemyAttack: 'slash',
      player: { hp: 86 },
    });
  });

  test('matching a defense to the attack prevents all damage', () => {
    const attacks: DuelAttack[] = ['thrust', 'slash', 'heavy'];
    const defenses: DuelDefense[] = ['parry', 'block', 'dodge'];
    let duel = createDuel({ encounterId: 'test.duel', player, enemy });

    for (let index = 0; index < 3; index += 1) {
      const beforeHp = duel.player.hp;
      duel = advanceDuel(duel, { type: 'attack', attack: attacks[index] });
      expect(duel.enemy.hp).toBe(84);
      duel = advanceDuel(duel, {
        type: 'defend',
        defense: defenses[index],
      });
      expect(duel.player.hp).toBe(beforeHp);
    }
  });

  test('ends in victory during attack and defeat during defense', () => {
    const created = createDuel({ encounterId: 'test.duel', player, enemy });
    const nearVictory = {
      ...created,
      enemy: { ...created.enemy, hp: 1 },
    };
    const victory = advanceDuel(nearVictory, {
      type: 'attack',
      attack: 'slash',
    });
    expect(victory.outcome).toBe('victory');
    expect(victory.enemy.hp).toBe(0);

    const nearDefeat = {
      ...advanceDuel(created, { type: 'attack', attack: 'slash' }),
      player: { ...created.player, hp: 1 },
    };
    const defeat = advanceDuel(nearDefeat, {
      type: 'defend',
      defense: 'block',
    });
    expect(defeat.outcome).toBe('defeat');
    expect(defeat.player.hp).toBe(0);
  });

  test('draws after ten complete unresolved rounds and bounds structured logs', () => {
    const counterAttack: Record<DuelDefense, DuelAttack> = {
      parry: 'thrust',
      block: 'slash',
      dodge: 'heavy',
    };
    const counterDefense: Record<DuelAttack, DuelDefense> = {
      thrust: 'parry',
      slash: 'block',
      heavy: 'dodge',
    };
    let duel = createDuel({ encounterId: 'test.duel', player, enemy });

    for (let round = 1; round <= 10; round += 1) {
      duel = advanceDuel(duel, {
        type: 'attack',
        attack: counterAttack[duel.enemyDefense],
      });
      duel = advanceDuel(duel, {
        type: 'defend',
        defense: counterDefense[duel.enemyAttack],
      });
    }

    expect(duel.outcome).toBe('draw');
    expect(duel.round).toBe(10);
    expect(duel.log).toHaveLength(8);
    expect(duel.log[0]).toEqual(
      expect.objectContaining({
        key: expect.any(String),
        data: expect.any(Object),
      }),
    );
  });

  test('returns the same reference for wrong phase, terminal, and unknown actions', () => {
    const duel = createDuel({ encounterId: 'test.duel', player, enemy });
    expect(advanceDuel(duel, { type: 'defend', defense: 'parry' })).toBe(duel);
    expect(advanceDuel(duel, { type: 'dance' } as unknown as DuelAction)).toBe(
      duel,
    );

    const terminal = { ...duel, outcome: 'draw' as const };
    expect(advanceDuel(terminal, { type: 'attack', attack: 'slash' })).toBe(
      terminal,
    );
  });

  test('does not mutate an input snapshot', () => {
    const duel = createDuel({ encounterId: 'test.duel', player, enemy });
    const before = JSON.stringify(duel);
    const next = advanceDuel(duel, { type: 'attack', attack: 'slash' });

    expect(JSON.stringify(duel)).toBe(before);
    expect(next).not.toBe(duel);
    expect(next.player).not.toBe(duel.player);
    expect(next.enemy).not.toBe(duel.enemy);
  });
});

describe('combat stats and encounters', () => {
  test('applies owned weapon/armor ratings, weapon preference, and experience levels', () => {
    expect(
      createPlayerDuelStats({
        sailorId: '1',
        equipment: { weaponId: '4', armorId: '18' },
        ownedItemIds: ['4', '18'],
        mateProgress: { '1': { battleExperience: 250 } },
      }),
    ).toEqual({
      swordplay: 82,
      level: 3,
      weaponRating: itemData['4'].rating,
      armorRating: itemData['18'].rating,
      weaponCategory: '2',
    });
  });

  test('unknown, unowned, and wrong-category equipment contributes no rating', () => {
    expect(
      createPlayerDuelStats({
        sailorId: '1',
        equipment: { weaponId: 'unknown', armorId: '4' },
        ownedItemIds: ['4'],
        mateProgress: {},
      }),
    ).toEqual({
      swordplay: 82,
      level: 1,
      weaponRating: 0,
      armorRating: 0,
      weaponCategory: null,
    });
    expect(
      createPlayerDuelStats({
        sailorId: '1',
        equipment: { weaponId: '12', armorId: '20' },
        ownedItemIds: [],
        mateProgress: {},
      }),
    ).toMatchObject({ weaponRating: 0, armorRating: 0 });
  });

  test('publishes the three stable M2 encounters with exact enemy stats', () => {
    expect(encounterCatalog).toEqual({
      'joao.m2.kahn-shipyard': {
        kind: 'duel',
        enemy: {
          swordplay: 66,
          level: 2,
          weaponRating: 10,
          armorRating: 0,
          weaponCategory: null,
        },
      },
      'joao.m2.kahn-house': {
        kind: 'duel',
        enemy: {
          swordplay: 78,
          level: 3,
          weaponRating: 20,
          armorRating: 10,
          weaponCategory: null,
        },
      },
      'joao.m2.katarina': {
        kind: 'naval',
        enemy: { hull: 42, maxHull: 42, crew: 18, guns: 8 },
        captain: {
          swordplay: 84,
          level: 4,
          weaponRating: 25,
          armorRating: 15,
          weaponCategory: null,
        },
      },
    });
  });
});

describe('naval rules', () => {
  const naval = () =>
    createNaval({
      encounterId: 'test.naval',
      player: { hull: 30, maxHull: 30, crew: 18, guns: 8, shot: 2, lumber: 1 },
      playerDuel: player,
    });

  test('enforces action availability without consuming rounds or resources', () => {
    const created = naval();
    (
      [
        { type: 'board' },
        { type: 'challenge' },
        { type: 'retreat' },
        { type: 'repair' },
      ] as const
    ).forEach((action) => {
      expect(advanceNaval(created, action)).toBe(created);
    });
    const noShot = { ...created, player: { ...created.player, shot: 0 } };
    expect(advanceNaval(noShot, { type: 'fire' })).toBe(noShot);
  });

  test('spends shot, deals cannon damage, and receives the range response', () => {
    const result = advanceNaval(naval(), { type: 'fire' });

    expect(result).toMatchObject({
      revision: 1,
      round: 2,
      player: { hull: 26, shot: 1 },
      enemy: { hull: 34 },
      range: 2,
    });
    expect(result.log[0]).toEqual({
      key: 'combat.naval.fire',
      data: {
        round: 1,
        rangeBefore: 2,
        rangeAfter: 2,
        shotCost: 1,
        damage: 8,
      },
    });
  });

  test('withdraws to the edge without immediate pursuit and can retreat', () => {
    const withdrawn = advanceNaval(naval(), { type: 'withdraw' });
    expect(withdrawn).toMatchObject({ range: 3, outcome: null });
    expect(withdrawn.player.hull).toBe(30);

    const retreated = advanceNaval(withdrawn, { type: 'retreat' });
    expect(retreated.outcome).toBe('retreat');
    expect(retreated.round).toBe(withdrawn.round);
  });

  test('receives cannon fire when withdrawing to close or cannon range', () => {
    const created = naval();

    const fromAdjacent = advanceNaval(
      { ...created, range: 0 },
      { type: 'withdraw' },
    );
    expect(fromAdjacent).toMatchObject({ range: 1, player: { hull: 26 } });

    const fromClose = advanceNaval(
      { ...created, range: 1 },
      { type: 'withdraw' },
    );
    expect(fromClose).toMatchObject({ range: 2, player: { hull: 26 } });
  });

  test('can be defeated by the deterministic enemy response', () => {
    const created = naval();
    const fragile = { ...created, player: { ...created.player, hull: 4 } };
    const result = advanceNaval(fragile, { type: 'fire' });
    expect(result.outcome).toBe('defeat');
    expect(result.player.hull).toBe(0);
  });

  test('boards with real crew losses and resolves zero enemy crew as victory', () => {
    const adjacent = { ...naval(), range: 0 as const };
    const exchange = advanceNaval(adjacent, { type: 'board' });
    expect(exchange).toMatchObject({
      player: { crew: 12 },
      enemy: { crew: 12 },
    });

    const nearlyWon = {
      ...adjacent,
      enemy: { ...adjacent.enemy, crew: 2 },
    };
    expect(advanceNaval(nearlyWon, { type: 'board' }).outcome).toBe('victory');
  });

  test('simultaneous boarding crew exhaustion resolves as defeat', () => {
    const created = naval();
    const lastCrews = {
      ...created,
      range: 0 as const,
      player: { ...created.player, crew: 1 },
      enemy: { ...created.enemy, crew: 2 },
    };

    const result = advanceNaval(lastCrews, { type: 'board' });

    expect(result.player.crew).toBe(0);
    expect(result.enemy.crew).toBe(0);
    expect(result.outcome).toBe('defeat');
  });

  test('repairs with lumber, caps hull, and then receives the enemy response', () => {
    const damaged = { ...naval(), player: { ...naval().player, hull: 25 } };
    const result = advanceNaval(damaged, { type: 'repair' });
    expect(result.player).toMatchObject({ hull: 26, lumber: 0 });
  });

  test('runs a nested Katarina duel: victory wins, defeat loses, draw resumes', () => {
    const adjacent = { ...naval(), range: 0 as const };
    const challenge = advanceNaval(adjacent, { type: 'challenge' });
    expect(challenge.boardingDuel).toMatchObject({
      encounterId: 'joao.m2.katarina',
      phase: 'attack',
    });

    const outcomes = [
      ['victory', 'victory'],
      ['defeat', 'defeat'],
      ['draw', null],
    ] as const;
    outcomes.forEach(([duelOutcome, navalOutcome]) => {
      const active = {
        ...challenge,
        boardingDuel: { ...challenge.boardingDuel!, outcome: duelOutcome },
      };
      const resolved = advanceNaval(active, { type: 'resolveChallenge' });
      expect(resolved.outcome).toBe(navalOutcome);
      expect(resolved.boardingDuel).toBeNull();
      if (duelOutcome === 'draw') expect(resolved.range).toBe(0);
    });
  });

  test('forwards duel actions and does not mutate naval input snapshots', () => {
    const adjacent = { ...naval(), range: 0 as const };
    const challenge = advanceNaval(adjacent, { type: 'challenge' });
    const before = JSON.stringify(challenge);
    const action: DuelAction = { type: 'attack', attack: 'slash' };
    const next = advanceNaval(challenge, { type: 'duel', action });

    expect(JSON.stringify(challenge)).toBe(before);
    expect(next).not.toBe(challenge);
    expect(next.boardingDuel?.revision).toBe(1);

    const nearlyWon = {
      ...challenge,
      boardingDuel: {
        ...challenge.boardingDuel!,
        enemy: { ...challenge.boardingDuel!.enemy, hp: 1 },
      },
    };
    const completed = advanceNaval(nearlyWon, {
      type: 'duel',
      action: { type: 'attack', attack: 'slash' },
    });
    expect(completed.outcome).toBe('victory');
    expect(completed.revision).toBe(nearlyWon.revision + 1);
  });
});
