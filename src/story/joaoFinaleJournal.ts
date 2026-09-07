import type { State } from '../state/state';
import { getCalendarParts } from '../time/calendar';
import type { JournalEntry } from './firstVoyageJournal';
import { CONFLICT_AND_GROWTH_COMPLETE_EVENT_ID } from './content/arcs/joao/conflict-and-growth';
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

const MINUTES_PER_DAY = 1440;

const objective = (
  id: string,
  title: string,
  body: string,
  values?: Record<string, string | number>,
): JournalEntry => ({
  id,
  title,
  body,
  completed: false,
  current: true,
  kind: 'objective',
  ...(values ? { values } : {}),
});

const preparation: JournalEntry = {
  id: 'm3-preparation',
  title: 'Prepare for long voyages and battle',
  body: 'Stock food and water, fill each ship to its minimum crew at a pub, repair at a shipyard, and buy ammunition at a harbor. The starter ship cannot recruit above its minimum crew through the current menus. The Royal Crown can be sold to fund long travel, but it is not required.',
  completed: false,
  current: false,
  kind: 'advice',
};

const dateValues = (
  currentTime: number,
  nextYear: number,
  nextMonth: number,
  nextDay: number,
): Record<string, number> => {
  const current = getCalendarParts(currentTime);
  return {
    currentYear: current.year,
    currentMonth: current.month,
    currentDay: current.day,
    nextYear,
    nextMonth,
    nextDay,
  };
};

const monthDay = (
  monthIndex: number,
  day: number,
): { year: number; month: number; day: number } => ({
  year: Math.floor(monthIndex / 12),
  month: (monthIndex % 12) + 1,
  day,
});

const waitingObjective = (state: State): JournalEntry => {
  const current = getCalendarParts(state.timePassed);
  const anchorTime = state.storyEventTimes[WAITING_FOR_PIETRO_EVENT_ID];
  const anchor = Number.isFinite(anchorTime)
    ? getCalendarParts(anchorTime)
    : current;
  const firstEligibleMonth = anchor.monthIndex + 1;
  const eligible =
    current.monthIndex >= firstEligibleMonth && current.day >= 11;

  if (eligible) {
    return objective(
      'm3-invasion-authorized',
      'Return for Pietro’s news',
      'The date gate is open. Visit the Axum (Massawa) residence now.',
    );
  }

  const next = monthDay(
    current.monthIndex < firstEligibleMonth
      ? firstEligibleMonth
      : current.monthIndex,
    11,
  );
  return objective(
    'm3-wait-for-pietro',
    'Wait for Pietro in a later month',
    'Current date: {currentMonth}/{currentDay}/{currentYear}. The first eligible return is {nextMonth}/{nextDay}/{nextYear}: visit the Axum (Massawa) residence on day 11 of a later month or after. Lodge Check In advances to 08:00 the next morning.',
    dateValues(state.timePassed, next.year, next.month, next.day),
  );
};

const allianceObjective = (state: State): JournalEntry => {
  const current = getCalendarParts(state.timePassed);
  const anchorTime = state.storyEventTimes[MARTINEZ_EXPOSED_EVENT_ID];
  const anchor = Number.isFinite(anchorTime)
    ? getCalendarParts(anchorTime)
    : current;
  const minutesToday =
    ((state.timePassed % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const earliestDay = anchor.dayIndex + 1;
  const eligibleDay = current.dayIndex >= earliestDay;
  const inWindow = minutesToday >= 540 && minutesToday < 900;

  let targetDayIndex = Math.max(current.dayIndex, earliestDay);
  if (eligibleDay && minutesToday >= 900) targetDayIndex += 1;
  const target = getCalendarParts(targetDayIndex * MINUTES_PER_DAY);
  const values = dateValues(
    state.timePassed,
    target.year,
    target.month,
    target.day,
  );

  if (eligibleDay && inWindow) {
    return objective(
      'm3-spanish-alliance',
      'Meet the Spanish officer now',
      'The appointment is open at this South American harbor from 09:00–14:59 on {nextMonth}/{nextDay}/{nextYear}.',
      values,
    );
  }

  return objective(
    'm3-alliance-wait',
    'Return for the alliance appointment',
    'Current date: {currentMonth}/{currentDay}/{currentYear}. Return to this South American harbor from 09:00–14:59 on {nextMonth}/{nextDay}/{nextYear}. Lodge Check In wakes the crew at 08:00; make ordinary facility visits until 09:00. If you miss 14:59, return during the window on a later day.',
    values,
  );
};

const currentObjective = (state: State): JournalEntry => {
  const completed = new Set(state.storyEvents ?? []);
  const has = (eventId: string): boolean => completed.has(eventId);
  const firstBattle = state.combatResults['joao.m3.ottoman-one'];
  const secondBattle = state.combatResults['joao.m3.ottoman-two'];
  const rudolph = state.combatResults['joao.m3.rudolph'];
  const amazon = state.combatResults['joao.m3.amazon'];
  const activeEncounterId = state.activeCombat?.encounterId;

  if (!has(FIVE_DAY_VOYAGE_EVENT_ID)) {
    return objective(
      'm3-five-day-voyage',
      'Sail for five uninterrupted days',
      'After M2, spend five uninterrupted days at sea. Docking resets the count.',
    );
  }
  if (!has(ALI_MASSAWA_LEAD_EVENT_ID)) {
    return objective(
      'm3-ali-lead',
      'Ask Ali about the voyage',
      'Enter the next facility after the five-day voyage to hear Ali’s lead.',
    );
  }
  if (!has(RELIGIOUS_LEAD_EVENT_ID)) {
    return objective(
      'm3-religious-lead',
      'Seek the Christian kingdom',
      'Visit the Axum (Massawa) religious house for news of the Christian kingdom.',
    );
  }
  if (!has(STAFF_REQUEST_EVENT_ID)) {
    return objective(
      'm3-staff-request',
      'Meet Taphiel',
      'Visit Taphiel at the Axum (Massawa) residence.',
    );
  }
  if (!has(PIETRO_COMMISSIONED_EVENT_ID)) {
    return objective(
      'm3-pietro-commission',
      'Commission Pietro',
      'Ask Pietro to recover the Staff of the Saint at the Lisbon residence.',
    );
  }
  if (!has(WAITING_FOR_PIETRO_EVENT_ID)) {
    return objective(
      'm3-begin-wait',
      'Begin the wait for Pietro',
      'Return to the Axum (Massawa) residence so Taphiel can record the start of the wait.',
    );
  }
  if (!has(INVASION_AUTHORIZED_EVENT_ID)) return waitingObjective(state);
  if (!has(FIRST_SORTIE_READY_EVENT_ID)) {
    return objective(
      'm3-first-sortie',
      'Prepare the first sortie',
      'Visit the Axum (Massawa) harbor and accept the first sortie when the fleet is ready.',
    );
  }
  if (!has(OTTOMAN_ONE_START_EVENT_ID)) {
    return objective(
      'm3-ottoman-one',
      'Meet the Ottoman vanguard',
      'Sail east and slightly south of the Axum (Massawa) harbor to water near 15.2°N, 42.7°E.',
    );
  }
  if (!firstBattle || activeEncounterId === 'joao.m3.ottoman-one') {
    return objective(
      'm3-ottoman-one-battle',
      'Finish the vanguard battle',
      'Defeat or successfully retreat from the Ottoman vanguard.',
    );
  }
  if (firstBattle === 'defeat') {
    return objective(
      'm3-ottoman-one-retry',
      'Retry the Ottoman vanguard',
      'Return to the Axum (Massawa) harbor to retry immediately or prepare first.',
    );
  }
  if (!has(SECOND_SORTIE_READY_EVENT_ID)) {
    return objective(
      'm3-second-sortie',
      'Prepare the second sortie',
      'Return to the Axum (Massawa) harbor and accept the second sortie.',
    );
  }
  if (!has(OTTOMAN_TWO_START_EVENT_ID)) {
    return objective(
      'm3-ottoman-two',
      'Meet the Ottoman main fleet',
      'Return east and slightly south of Axum (Massawa), near 15.2°N, 42.7°E.',
    );
  }
  if (!secondBattle || activeEncounterId === 'joao.m3.ottoman-two') {
    return objective(
      'm3-ottoman-two-battle',
      'Finish the main-fleet battle',
      'Defeat or successfully retreat from the Ottoman main fleet.',
    );
  }
  if (secondBattle === 'defeat') {
    return objective(
      'm3-ottoman-two-retry',
      'Retry the Ottoman main fleet',
      'Return to the Axum (Massawa) harbor to retry immediately or prepare first.',
    );
  }
  if (!has(DEFENSE_REPORTED_EVENT_ID)) {
    return objective(
      'm3-defense-report',
      'Report the defense',
      'Report both withdrawn Ottoman fleets at the southwest residence in Axum (Massawa).',
    );
  }
  if (!has(STAFF_RECEIVED_EVENT_ID)) {
    return objective(
      'm3-staff-at-pub',
      'Collect the Staff',
      'Meet Pietro at the Axum (Massawa) pub and receive the Staff of the Saint.',
    );
  }
  if (!has(STAFF_RETURNED_EVENT_ID)) {
    return objective(
      'm3-return-staff',
      'Return the Staff',
      'Carry the Staff of the Saint to Taphiel at the Axum (Massawa) residence.',
    );
  }
  if (!has(MASSAWA_COMPLETE_EVENT_ID)) {
    return objective(
      'm3-massawa-complete',
      'Complete the defense of Axum',
      'Visit the Axum (Massawa) harbor to close the chapter. The Royal Crown may be sold to fund the voyage ahead, but it is not required.',
    );
  }
  if (!has(JAPAN_REQUEST_EVENT_ID)) {
    return objective(
      'm3-japan-request',
      'Hear Enrico’s Japan request',
      'Visit a pub outside the Far East and accept Enrico’s request when ready.',
    );
  }
  if (!has(ENRICO_FAREWELL_EVENT_ID)) {
    return objective(
      'm3-enrico-farewell',
      'Carry Enrico to Japan',
      'Sail to the Nagasaki harbor, where Enrico will leave the fleet for Sakai.',
    );
  }
  if (!has(LETTER_NOTICE_EVENT_ID)) {
    return objective(
      'm3-letter-notice',
      'Return to Lisbon',
      'Return to Lisbon and enter any facility to hear that Enrico left a letter.',
    );
  }
  if (!has(ENRICO_LETTER_EVENT_ID)) {
    return objective(
      'm3-enrico-letter',
      'Read Enrico’s letter',
      'Visit the Lisbon Guild and read Enrico’s letter.',
    );
  }
  if (!has(SAKAI_LEAD_EVENT_ID)) {
    return objective(
      'm3-sakai-lead',
      'Meet Enrico in Sakai',
      'Visit the Sakai Guild to learn where the search continues.',
    );
  }
  if (!has(SOUTH_AMERICA_ARRIVAL_EVENT_ID)) {
    return objective(
      'm3-south-america',
      'Reach South America',
      'Sail to any South American port and enter a facility other than its pub.',
    );
  }
  if (!has(RUDOLPH_START_EVENT_ID)) {
    return objective(
      'm3-rudolph',
      'Ask about Lucia',
      'Visit the pub at that South American port and ask about Lucia.',
    );
  }
  if (!rudolph) {
    return objective(
      'm3-rudolph-duel',
      'Finish Rudolph’s duel',
      'Any duel result continues Lucia’s rescue.',
    );
  }
  if (!has(LUCIA_RESCUED_EVENT_ID)) {
    return objective(
      'm3-lucia-rescued',
      'Bring Lucia to safety',
      'Continue at the South American pub after Rudolph’s duel; victory, defeat, or draw all rescue Lucia.',
    );
  }
  if (!has(MARTINEZ_EXPOSED_EVENT_ID)) {
    return objective(
      'm3-martinez-exposed',
      'Expose Martinez’s orders',
      'Visit the harbor at a South American port with Lucia and Katarina.',
    );
  }
  if (!has(SPANISH_ALLIANCE_EVENT_ID)) return allianceObjective(state);
  if (!has(AMAZON_START_EVENT_ID)) {
    return objective(
      'm3-amazon',
      'Sail to the Amazon fleet',
      'Sail east of Cayenne to the Amazon river mouth near 0.5°S, 50.0°W.',
    );
  }
  if (!amazon || activeEncounterId === 'joao.m3.amazon') {
    return objective(
      'm3-amazon-battle',
      'Finish the Amazon battle',
      'Defeat Martinez’s fleet to end its hold over Lucia.',
    );
  }
  if (amazon !== 'victory') {
    return objective(
      'm3-amazon-retry',
      'Retry the Amazon fleet',
      'Return to the Cayenne harbor to retry immediately or prepare first.',
    );
  }
  if (!has(AMAZON_VICTORY_EVENT_ID)) {
    return objective(
      'm3-amazon-victory',
      'Finish the Amazon victory',
      'Continue the victory report after the battle.',
    );
  }
  return objective(
    'm3-homecoming',
    'Return home to Lisbon',
    'Visit the Lisbon residence for João’s homecoming.',
  );
};

export const getJoaoFinaleJournal = (state: State): JournalEntry[] => {
  if (!state.storyEvents.includes(CONFLICT_AND_GROWTH_COMPLETE_EVENT_ID)) {
    return [];
  }
  if (state.storyEvents.includes(JOAO_ENDING_EVENT_ID)) {
    return [
      {
        id: 'm3-complete',
        title: 'João’s main story is complete',
        body: 'João returned home after rescuing Lucia and breaking Martinez’s command.',
        completed: true,
        current: false,
        kind: 'objective',
      },
    ];
  }

  return [currentObjective(state), preparation];
};

export default getJoaoFinaleJournal;
