import state from '../state/state';
import {
  ALI_MASSAWA_LEAD_EVENT_ID,
  DEFENSE_REPORTED_EVENT_ID,
  FIRST_SORTIE_READY_EVENT_ID,
  FIVE_DAY_VOYAGE_EVENT_ID,
  INVASION_AUTHORIZED_EVENT_ID,
  MASSAWA_COMPLETE_EVENT_ID,
  OTTOMAN_ONE_START_EVENT_ID,
  OTTOMAN_TWO_START_EVENT_ID,
  PIETRO_COMMISSIONED_EVENT_ID,
  RELIGIOUS_LEAD_EVENT_ID,
  SECOND_SORTIE_READY_EVENT_ID,
  STAFF_RECEIVED_EVENT_ID,
  STAFF_REQUEST_EVENT_ID,
  STAFF_RETURNED_EVENT_ID,
  WAITING_FOR_PIETRO_EVENT_ID,
} from './content/arcs/joao/massawa';
import {
  AMAZON_START_EVENT_ID,
  AMAZON_VICTORY_EVENT_ID,
  ENRICO_FAREWELL_EVENT_ID,
  ENRICO_LETTER_EVENT_ID,
  JAPAN_REQUEST_EVENT_ID,
  JOAO_ENDING_EVENT_ID,
  LETTER_NOTICE_EVENT_ID,
  LUCIA_RESCUED_EVENT_ID,
  MARTINEZ_EXPOSED_EVENT_ID,
  RUDOLPH_START_EVENT_ID,
  SAKAI_LEAD_EVENT_ID,
  SOUTH_AMERICA_ARRIVAL_EVENT_ID,
  SPANISH_ALLIANCE_EVENT_ID,
} from './content/arcs/joao/finale';
import { getJoaoFinaleJournal } from './joaoFinaleJournal';

const M2_COMPLETE = 'joao.conflict-and-growth.chapter-complete';
const MASSAWA_DONE = [
  FIVE_DAY_VOYAGE_EVENT_ID,
  ALI_MASSAWA_LEAD_EVENT_ID,
  RELIGIOUS_LEAD_EVENT_ID,
  STAFF_REQUEST_EVENT_ID,
  PIETRO_COMMISSIONED_EVENT_ID,
  WAITING_FOR_PIETRO_EVENT_ID,
  INVASION_AUTHORIZED_EVENT_ID,
  FIRST_SORTIE_READY_EVENT_ID,
  OTTOMAN_ONE_START_EVENT_ID,
  SECOND_SORTIE_READY_EVENT_ID,
  OTTOMAN_TWO_START_EVENT_ID,
  DEFENSE_REPORTED_EVENT_ID,
  STAFF_RECEIVED_EVENT_ID,
  STAFF_RETURNED_EVENT_ID,
  MASSAWA_COMPLETE_EVENT_ID,
] as const;
const THROUGH_SAKAI = [
  ...MASSAWA_DONE,
  JAPAN_REQUEST_EVENT_ID,
  ENRICO_FAREWELL_EVENT_ID,
  LETTER_NOTICE_EVENT_ID,
  ENRICO_LETTER_EVENT_ID,
  SAKAI_LEAD_EVENT_ID,
] as const;
const minutesAt = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
): number =>
  (Date.UTC(year, month - 1, day, hour, minute) - Date.UTC(1522, 4, 17)) /
  60_000;

const current = () =>
  getJoaoFinaleJournal(state).find(({ current: active }) => active);

const completeMassawa = (): void => {
  state.storyEvents = [M2_COMPLETE, ...MASSAWA_DONE];
  state.combatResults = {
    'joao.m3.ottoman-one': 'victory',
    'joao.m3.ottoman-two': 'retreat',
  };
};

describe('João M3 journal', () => {
  beforeEach(() => {
    state.storyEvents = [M2_COMPLETE];
    state.storyEventTimes = {};
    state.timePassed = minutesAt(1522, 7, 20, 10);
    state.items = [];
    state.combatResults = {};
    state.activeCombat = null;
  });

  test('stays hidden until M2 is complete', () => {
    state.storyEvents = [];
    expect(getJoaoFinaleJournal(state)).toEqual([]);
  });

  test('opens after M2 with the five-day latch and accurate fleet preparation', () => {
    const entries = getJoaoFinaleJournal(state);
    expect(entries[0]).toMatchObject({
      id: 'm3-five-day-voyage',
      current: true,
      completed: false,
    });
    expect(entries[0].body).toContain('five uninterrupted days at sea');
    expect(entries[1]).toMatchObject({
      id: 'm3-preparation',
      kind: 'advice',
    });
    expect(entries[1].body).toContain('food and water');
    expect(entries[1].body).toContain('minimum crew');
    expect(entries[1].body).toContain('repair');
    expect(entries[1].body).toContain('ammunition');
    expect(entries[1].body).toContain('Royal Crown');
    expect(entries[1].body).toContain('not required');
  });

  test('guides the Massawa lead through the exact religious house and residence', () => {
    state.storyEvents.push(FIVE_DAY_VOYAGE_EVENT_ID);
    expect(current()).toMatchObject({ id: 'm3-ali-lead' });
    expect(current()?.body).toContain('next facility');

    state.storyEvents.push(ALI_MASSAWA_LEAD_EVENT_ID);
    expect(current()).toMatchObject({ id: 'm3-religious-lead' });
    expect(current()?.body).toContain('Axum (Massawa) religious house');

    state.storyEvents.push(RELIGIOUS_LEAD_EVENT_ID);
    expect(current()).toMatchObject({ id: 'm3-staff-request' });
    expect(current()?.body).toContain('Axum (Massawa) residence');

    state.storyEvents.push(STAFF_REQUEST_EVENT_ID);
    expect(current()).toMatchObject({ id: 'm3-pietro-commission' });
    expect(current()?.body).toContain('Lisbon residence');

    state.storyEvents.push(PIETRO_COMMISSIONED_EVENT_ID);
    expect(current()).toMatchObject({ id: 'm3-begin-wait' });
    expect(current()?.body).toContain('Axum (Massawa) residence');
  });

  test('derives the current and next eligible Massawa dates from the real wait timestamp', () => {
    const waitAt = minutesAt(1522, 7, 20, 10);
    state.storyEvents.push(
      FIVE_DAY_VOYAGE_EVENT_ID,
      ALI_MASSAWA_LEAD_EVENT_ID,
      RELIGIOUS_LEAD_EVENT_ID,
      STAFF_REQUEST_EVENT_ID,
      PIETRO_COMMISSIONED_EVENT_ID,
      WAITING_FOR_PIETRO_EVENT_ID,
    );
    state.storyEventTimes[WAITING_FOR_PIETRO_EVENT_ID] = waitAt;
    state.timePassed = minutesAt(1522, 8, 10, 8);
    expect(current()).toMatchObject({
      id: 'm3-wait-for-pietro',
      values: {
        currentYear: 1522,
        currentMonth: 8,
        currentDay: 10,
        nextYear: 1522,
        nextMonth: 8,
        nextDay: 11,
      },
    });

    state.timePassed = minutesAt(1522, 8, 11, 8);
    expect(current()).toMatchObject({ id: 'm3-invasion-authorized' });
    expect(current()?.body).toContain('residence');
  });

  test('guides both Massawa battle retries and the second sortie', () => {
    state.storyEvents.push(
      FIVE_DAY_VOYAGE_EVENT_ID,
      ALI_MASSAWA_LEAD_EVENT_ID,
      RELIGIOUS_LEAD_EVENT_ID,
      STAFF_REQUEST_EVENT_ID,
      PIETRO_COMMISSIONED_EVENT_ID,
      WAITING_FOR_PIETRO_EVENT_ID,
      INVASION_AUTHORIZED_EVENT_ID,
      FIRST_SORTIE_READY_EVENT_ID,
      OTTOMAN_ONE_START_EVENT_ID,
    );
    state.combatResults['joao.m3.ottoman-one'] = 'defeat';
    expect(current()).toMatchObject({ id: 'm3-ottoman-one-retry' });
    expect(current()?.body).toContain('Axum (Massawa) harbor');

    state.combatResults['joao.m3.ottoman-one'] = 'retreat';
    expect(current()).toMatchObject({ id: 'm3-second-sortie' });
    expect(current()?.body).toContain('Axum (Massawa) harbor');

    state.storyEvents.push(
      SECOND_SORTIE_READY_EVENT_ID,
      OTTOMAN_TWO_START_EVENT_ID,
    );
    state.combatResults['joao.m3.ottoman-two'] = 'defeat';
    expect(current()).toMatchObject({ id: 'm3-ottoman-two-retry' });
    expect(current()?.body).toContain('Axum (Massawa) harbor');
  });

  test('points both sorties to geographic coordinates and never exposes internal tiles', () => {
    state.storyEvents.push(
      FIVE_DAY_VOYAGE_EVENT_ID,
      ALI_MASSAWA_LEAD_EVENT_ID,
      RELIGIOUS_LEAD_EVENT_ID,
      STAFF_REQUEST_EVENT_ID,
      PIETRO_COMMISSIONED_EVENT_ID,
      WAITING_FOR_PIETRO_EVENT_ID,
      INVASION_AUTHORIZED_EVENT_ID,
      FIRST_SORTIE_READY_EVENT_ID,
    );
    expect(current()?.body).toContain('east and slightly south');
    expect(current()?.body).toContain('15.2°N, 42.7°E');
    expect(current()?.body).not.toMatch(/115[2-6]|52[7-9]|53[0-3]/);

    state.storyEvents.push(
      OTTOMAN_ONE_START_EVENT_ID,
      SECOND_SORTIE_READY_EVENT_ID,
    );
    state.combatResults['joao.m3.ottoman-one'] = 'victory';
    expect(current()?.body).toContain('15.2°N, 42.7°E');
  });

  test('routes the recovered Staff from the pub to the residence, then the harbor', () => {
    state.storyEvents.push(
      FIVE_DAY_VOYAGE_EVENT_ID,
      ALI_MASSAWA_LEAD_EVENT_ID,
      RELIGIOUS_LEAD_EVENT_ID,
      STAFF_REQUEST_EVENT_ID,
      PIETRO_COMMISSIONED_EVENT_ID,
      WAITING_FOR_PIETRO_EVENT_ID,
      INVASION_AUTHORIZED_EVENT_ID,
      FIRST_SORTIE_READY_EVENT_ID,
      OTTOMAN_ONE_START_EVENT_ID,
      SECOND_SORTIE_READY_EVENT_ID,
      OTTOMAN_TWO_START_EVENT_ID,
      DEFENSE_REPORTED_EVENT_ID,
    );
    state.combatResults = {
      'joao.m3.ottoman-one': 'victory',
      'joao.m3.ottoman-two': 'retreat',
    };
    expect(current()).toMatchObject({ id: 'm3-staff-at-pub' });
    expect(current()?.body).toContain('Axum (Massawa) pub');

    state.storyEvents.push(STAFF_RECEIVED_EVENT_ID);
    state.items.push('m3-staff-of-the-saint');
    expect(current()).toMatchObject({ id: 'm3-return-staff' });
    expect(current()?.body).toContain('residence');

    state.items = ['45'];
    state.storyEvents.push(STAFF_RETURNED_EVENT_ID);
    expect(current()).toMatchObject({ id: 'm3-massawa-complete' });
    expect(current()?.body).toContain('harbor');
  });

  test('guides the Japan request, departure, Lisbon letter, and Sakai guild', () => {
    completeMassawa();
    expect(current()).toMatchObject({ id: 'm3-japan-request' });
    expect(current()?.body).toContain('pub outside the Far East');

    state.storyEvents.push(JAPAN_REQUEST_EVENT_ID);
    expect(current()).toMatchObject({ id: 'm3-enrico-farewell' });
    expect(current()?.body).toContain('Nagasaki harbor');

    state.storyEvents.push(ENRICO_FAREWELL_EVENT_ID);
    expect(current()).toMatchObject({ id: 'm3-letter-notice' });
    expect(current()?.body).toContain('Lisbon');

    state.storyEvents.push(LETTER_NOTICE_EVENT_ID);
    expect(current()).toMatchObject({ id: 'm3-enrico-letter' });
    expect(current()?.body).toContain('Lisbon Guild');

    state.storyEvents.push(ENRICO_LETTER_EVENT_ID);
    expect(current()).toMatchObject({ id: 'm3-sakai-lead' });
    expect(current()?.body).toContain('Sakai Guild');
  });

  test('continues through Lucia rescue and reports the missed appointment with a real date', () => {
    completeMassawa();
    state.storyEvents.push(...THROUGH_SAKAI.slice(MASSAWA_DONE.length));
    expect(current()).toMatchObject({ id: 'm3-south-america' });
    expect(current()?.body).toContain('South American port');

    state.storyEvents.push(SOUTH_AMERICA_ARRIVAL_EVENT_ID);
    expect(current()).toMatchObject({ id: 'm3-rudolph' });
    expect(current()?.body).toContain('pub');

    state.storyEvents.push(RUDOLPH_START_EVENT_ID);
    state.combatResults['joao.m3.rudolph'] = 'defeat';
    expect(current()).toMatchObject({ id: 'm3-lucia-rescued' });

    state.storyEvents.push(LUCIA_RESCUED_EVENT_ID, MARTINEZ_EXPOSED_EVENT_ID);
    state.storyEventTimes[MARTINEZ_EXPOSED_EVENT_ID] = minutesAt(
      1522,
      12,
      31,
      10,
    );
    state.timePassed = minutesAt(1523, 1, 1, 15);
    expect(current()).toMatchObject({
      id: 'm3-alliance-wait',
      values: {
        currentYear: 1523,
        currentMonth: 1,
        currentDay: 1,
        nextYear: 1523,
        nextMonth: 1,
        nextDay: 2,
      },
    });
    expect(current()?.body).toContain('09:00–14:59');
    expect(current()?.body).toContain('08:00');
  });

  test('marks the open appointment as actionable on the current day', () => {
    completeMassawa();
    state.storyEvents.push(
      ...THROUGH_SAKAI.slice(MASSAWA_DONE.length),
      SOUTH_AMERICA_ARRIVAL_EVENT_ID,
      RUDOLPH_START_EVENT_ID,
      LUCIA_RESCUED_EVENT_ID,
      MARTINEZ_EXPOSED_EVENT_ID,
    );
    state.combatResults['joao.m3.rudolph'] = 'draw';
    state.storyEventTimes[MARTINEZ_EXPOSED_EVENT_ID] = minutesAt(
      1523,
      1,
      1,
      10,
    );
    state.timePassed = minutesAt(1523, 1, 2, 9);
    expect(current()).toMatchObject({
      id: 'm3-spanish-alliance',
      values: { nextYear: 1523, nextMonth: 1, nextDay: 2 },
    });
  });

  test.each(['retreat', 'draw', 'defeat'] as const)(
    'sends an Amazon %s to the Cayenne harbor retry',
    (outcome) => {
      completeMassawa();
      state.storyEvents.push(
        ...THROUGH_SAKAI.slice(MASSAWA_DONE.length),
        SOUTH_AMERICA_ARRIVAL_EVENT_ID,
        RUDOLPH_START_EVENT_ID,
        LUCIA_RESCUED_EVENT_ID,
        MARTINEZ_EXPOSED_EVENT_ID,
        SPANISH_ALLIANCE_EVENT_ID,
        AMAZON_START_EVENT_ID,
      );
      state.combatResults['joao.m3.rudolph'] = 'victory';
      state.combatResults['joao.m3.amazon'] = outcome;
      expect(current()).toMatchObject({ id: 'm3-amazon-retry' });
      expect(current()?.body).toContain('Cayenne harbor');
    },
  );

  test('guides the final fleet geographically, then sends victory home', () => {
    completeMassawa();
    state.storyEvents.push(
      ...THROUGH_SAKAI.slice(MASSAWA_DONE.length),
      SOUTH_AMERICA_ARRIVAL_EVENT_ID,
      RUDOLPH_START_EVENT_ID,
      LUCIA_RESCUED_EVENT_ID,
      MARTINEZ_EXPOSED_EVENT_ID,
      SPANISH_ALLIANCE_EVENT_ID,
    );
    state.combatResults['joao.m3.rudolph'] = 'defeat';
    expect(current()).toMatchObject({ id: 'm3-amazon' });
    expect(current()?.body).toContain('east of Cayenne');
    expect(current()?.body).toContain('0.5°S, 50.0°W');
    expect(current()?.body).not.toMatch(/59[4-9]|60[0-2]|64[1-9]/);

    state.storyEvents.push(AMAZON_START_EVENT_ID);
    state.combatResults['joao.m3.amazon'] = 'victory';
    expect(current()).toMatchObject({ id: 'm3-amazon-victory' });

    state.storyEvents.push(AMAZON_VICTORY_EVENT_ID);
    expect(current()).toMatchObject({ id: 'm3-homecoming' });
    expect(current()?.body).toContain('Lisbon residence');
  });

  test('ends with completed M3 history and no future or current objective', () => {
    state.storyEvents.push(JOAO_ENDING_EVENT_ID);
    const entries = getJoaoFinaleJournal(state);
    expect(entries[0]).toMatchObject({
      id: 'm3-complete',
      completed: true,
      current: false,
    });
    expect(entries.some(({ current: active }) => active)).toBe(false);
    expect(entries.some(({ kind }) => kind === 'future')).toBe(false);
  });
});
