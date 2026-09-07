import state from '../state/state';
import { getConflictAndGrowthJournal } from './conflictAndGrowthJournal';

const event = (suffix: string) => `joao.conflict-and-growth.${suffix}`;

const current = () =>
  getConflictAndGrowthJournal(state).find(({ current: active }) => active);

describe('conflict and growth journal', () => {
  beforeEach(() => {
    state.storyEvents = ['joao.first-voyage.chapter-complete'];
    state.items = ['4'];
    state.equipment = { weaponId: null, armorId: null };
    state.combatResults = {};
    state.activeCombat = null;
  });

  test('starts with the exact daytime Ceuta destination and accurate preparation', () => {
    const entries = getConflictAndGrowthJournal(state);
    expect(entries[0]).toMatchObject({
      id: 'm2-domingo-missing',
      title: 'Find Domingo in Ceuta',
      current: true,
      completed: false,
    });
    expect(entries[0].body).toContain('08:00–16:00');
    expect(entries[0].body).toContain('35.1° N, 5.7° W');
    expect(entries[0].body).toContain('approximate game-map position');
    expect(entries[1]).toMatchObject({
      id: 'm2-preparation',
      title: 'Preparation',
      kind: 'advice',
    });
    expect(entries[1].body).toContain('Equip your owned Rapier');
    expect(entries[1].body).toContain('minimum crew');
    expect(entries[1].body).toContain('shot and lumber');
    expect(entries[1].body).not.toContain('21');
    expect(entries[1].body).not.toContain('Leather Armor');
  });

  test('explains first-duel progress and the house draw rematch', () => {
    state.storyEvents.push(
      event('domingo-missing'),
      event('lodge-search'),
      event('kahn-shipyard-start'),
    );
    state.combatResults['joao.m2.kahn-shipyard'] = 'defeat';
    expect(current()).toMatchObject({
      id: 'm2-identity-revealed',
      title: 'Hear Domingo’s identity',
    });
    expect(current()?.body).toContain('Ceuta harbor');

    state.storyEvents.push(
      event('identity-revealed'),
      event('kahn-house-start'),
    );
    state.combatResults['joao.m2.kahn-house'] = 'draw';
    expect(current()).toMatchObject({
      id: 'm2-kahn-house-rematch',
      title: 'Rematch Kahn',
    });
    expect(current()?.body).toContain('Franco house');
  });

  test('documents the two docking legs, retreat success, and defeat retry', () => {
    state.storyEvents.push(
      event('domingo-missing'),
      event('lodge-search'),
      event('kahn-shipyard-start'),
      event('identity-revealed'),
      event('kahn-house-start'),
      event('father-cleared'),
      event('domingo-farewell'),
      event('katarina-warning'),
    );
    state.combatResults['joao.m2.kahn-shipyard'] = 'defeat';
    state.combatResults['joao.m2.kahn-house'] = 'victory';
    expect(current()?.body).toContain('one consecutive day');

    state.storyEvents.push(event('pursuit-first-sea'));
    expect(current()?.body).toContain('Visit any harbor');
    expect(current()?.body).toContain('resets days at sea');

    state.storyEvents.push(
      event('pursuit-first-port'),
      event('katarina-battle-start'),
    );
    state.combatResults['joao.m2.katarina'] = 'defeat';
    expect(current()).toMatchObject({
      id: 'm2-katarina-retry',
      title: 'Retry Katarina from Lisbon',
    });
    expect(current()?.body).toContain('Lisbon harbor');

    state.activeCombat = {} as typeof state.activeCombat;
    expect(current()?.body).toContain('range 3');
    expect(current()?.body).toContain('successful retreat');
  });

  test('gives the playable Ali route and stops at the Istanbul report', () => {
    state.storyEvents.push(
      event('domingo-missing'),
      event('lodge-search'),
      event('kahn-shipyard-start'),
      event('identity-revealed'),
      event('kahn-house-start'),
      event('father-cleared'),
      event('domingo-farewell'),
      event('katarina-warning'),
      event('pursuit-first-sea'),
      event('pursuit-first-port'),
      event('katarina-battle-start'),
      event('ali-request'),
      event('lisbon-inquiry'),
    );
    state.combatResults['joao.m2.kahn-shipyard'] = 'defeat';
    state.combatResults['joao.m2.kahn-house'] = 'victory';
    state.combatResults['joao.m2.katarina'] = 'retreat';
    expect(current()).toMatchObject({
      id: 'm2-sasha-found',
      title: 'Find Sasha in Basra',
    });
    expect(current()?.body).toContain('29.4° N, 48.7° E');
    expect(current()?.body).toContain('around Africa’s southern tip');

    state.storyEvents.push(event('sasha-found'));
    expect(current()).toMatchObject({
      id: 'm2-chapter-complete',
      title: 'Report to Ali in Istanbul',
    });
    expect(current()?.body).toContain('40.6° N, 29.0° E');

    state.storyEvents.push(event('chapter-complete'));
    const entries = getConflictAndGrowthJournal(state);
    expect(entries[0]).toMatchObject({
      id: 'm2-complete',
      title: 'Conflict and growth complete',
      completed: true,
    });
    expect(entries[0].body).toContain('M2 is complete');
    expect(entries[1]).toMatchObject({
      id: 'm3-future',
      kind: 'future',
      current: false,
    });
    expect(entries[1].body).toContain('future chapter');
    expect(entries[1].body).not.toContain('Massawa');
  });
});
