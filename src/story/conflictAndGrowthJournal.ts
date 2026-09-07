import type { State } from '../state/state';
import type { JournalEntry } from './firstVoyageJournal';
import {
  ALI_REQUEST_EVENT_ID,
  CONFLICT_AND_GROWTH_COMPLETE_EVENT_ID,
  DOMINGO_FAREWELL_EVENT_ID,
  DOMINGO_MISSING_EVENT_ID,
  FATHER_CLEARED_EVENT_ID,
  IDENTITY_REVEALED_EVENT_ID,
  KAHN_HOUSE_START_EVENT_ID,
  KAHN_SHIPYARD_START_EVENT_ID,
  KATARINA_BATTLE_START_EVENT_ID,
  KATARINA_WARNING_EVENT_ID,
  LISBON_INQUIRY_EVENT_ID,
  LODGE_SEARCH_EVENT_ID,
  PURSUIT_FIRST_PORT_EVENT_ID,
  PURSUIT_FIRST_SEA_EVENT_ID,
  SASHA_FOUND_EVENT_ID,
} from './content/arcs/joao/conflict-and-growth';

type Milestone = Omit<JournalEntry, 'completed' | 'current'> & {
  eventId: string;
};

const milestone = (
  eventId: string,
  id: string,
  title: string,
  body: string,
): Milestone => ({ eventId, id, title, body, kind: 'objective' });

const history: Milestone[] = [
  milestone(
    DOMINGO_MISSING_EVENT_ID,
    'm2-domingo-missing',
    'Find Domingo in Ceuta',
    'Rocco learned that Domingo left the Ceuta pub.',
  ),
  milestone(
    LODGE_SEARCH_EVENT_ID,
    'm2-lodge-search',
    'Search the Ceuta lodge',
    'The innkeeper pointed toward a quarrel at the shipyard.',
  ),
  milestone(
    KAHN_SHIPYARD_START_EVENT_ID,
    'm2-kahn-shipyard',
    'Protect Domingo',
    'João stood against Kahn at the Ceuta shipyard.',
  ),
  milestone(
    IDENTITY_REVEALED_EVENT_ID,
    'm2-identity-revealed',
    'Hear Domingo’s identity',
    'Domingo revealed that he is Prince Alberto.',
  ),
  milestone(
    KAHN_HOUSE_START_EVENT_ID,
    'm2-kahn-house',
    'Face Kahn in Lisbon',
    'João faced Kahn again at the Franco house.',
  ),
  milestone(
    FATHER_CLEARED_EVENT_ID,
    'm2-father-cleared',
    'Clear Duke Franco',
    'Prince Alberto’s testimony cleared Duke Franco.',
  ),
  milestone(
    DOMINGO_FAREWELL_EVENT_ID,
    'm2-domingo-farewell',
    'Bid Domingo farewell',
    'Alberto returned to his duties after arranging the fleet handover.',
  ),
  milestone(
    KATARINA_WARNING_EVENT_ID,
    'm2-katarina-warning',
    'Answer the warning in Seville',
    'João accepted the pursuit waiting beyond Seville.',
  ),
  milestone(
    PURSUIT_FIRST_SEA_EVENT_ID,
    'm2-pursuit-first-sea',
    'Spot the pursuing sail',
    'Rocco spotted Katarina’s ship after a day at sea.',
  ),
  milestone(
    PURSUIT_FIRST_PORT_EVENT_ID,
    'm2-pursuit-first-port',
    'Dock during the pursuit',
    'The crew docked once before facing Katarina.',
  ),
  milestone(
    KATARINA_BATTLE_START_EVENT_ID,
    'm2-katarina-battle',
    'Face Katarina at sea',
    'Katarina confronted João over their families.',
  ),
  milestone(
    ALI_REQUEST_EVENT_ID,
    'm2-ali-request',
    'Hear Ali’s request',
    'Ali asked João to seek news of Sasha.',
  ),
  milestone(
    LISBON_INQUIRY_EVENT_ID,
    'm2-lisbon-inquiry',
    'Ask after Sasha in Lisbon',
    'Carlotta’s news placed Sasha in Basra.',
  ),
  milestone(
    SASHA_FOUND_EVENT_ID,
    'm2-sasha-found',
    'Find Sasha in Basra',
    'Sasha asked João to tell Ali that she is safe.',
  ),
];

const objective = (id: string, title: string, body: string): JournalEntry => ({
  id,
  title,
  body,
  completed: false,
  current: true,
  kind: 'objective',
});

const preparation: JournalEntry = {
  id: 'm2-preparation',
  title: 'Preparation',
  body: 'Equip your owned Rapier in Items and repair at a shipyard. Pubs top ships up to minimum crew; harbors sell shot and lumber.',
  completed: false,
  current: false,
  kind: 'advice',
};

const currentObjective = (
  completed: ReadonlySet<string>,
  state: State,
): JournalEntry => {
  const has = (eventId: string) => completed.has(eventId);
  const shipyardResult = state.combatResults?.['joao.m2.kahn-shipyard'];
  const houseResult = state.combatResults?.['joao.m2.kahn-house'];
  const navalResult = state.combatResults?.['joao.m2.katarina'];

  if (!has(DOMINGO_MISSING_EVENT_ID)) {
    return objective(
      'm2-domingo-missing',
      'Find Domingo in Ceuta',
      'Visit the Ceuta pub from 08:00–16:00. Ceuta is on Gibraltar’s south shore, near 35.1° N, 5.7° W on the approximate game-map position.',
    );
  }
  if (!has(LODGE_SEARCH_EVENT_ID)) {
    return objective(
      'm2-lodge-search',
      'Search the Ceuta lodge',
      'Visit the lodge in Ceuta and ask where Domingo went.',
    );
  }
  if (!has(KAHN_SHIPYARD_START_EVENT_ID)) {
    return objective(
      'm2-kahn-shipyard',
      'Protect Domingo',
      'Visit the Ceuta shipyard. In the duel, parry thrusts, block slashes, and dodge heavy attacks.',
    );
  }
  if (!shipyardResult) {
    return objective(
      'm2-kahn-shipyard-combat',
      'Finish the shipyard duel',
      'Read Kahn’s defense before attacking. Any duel result advances the search.',
    );
  }
  if (!has(IDENTITY_REVEALED_EVENT_ID)) {
    return objective(
      'm2-identity-revealed',
      'Hear Domingo’s identity',
      'Visit the Ceuta harbor after the duel; victory, defeat, or draw all continue.',
    );
  }
  if (!has(KAHN_HOUSE_START_EVENT_ID)) {
    return objective(
      'm2-kahn-house',
      'Face Kahn in Lisbon',
      'Return to the Franco house in Lisbon, near 38.7° N, 9.7° W on the approximate game-map position.',
    );
  }
  if (
    (state.activeCombat !== null || !houseResult) &&
    !has(FATHER_CLEARED_EVENT_ID)
  ) {
    return objective(
      'm2-kahn-house-combat',
      'Finish the house duel',
      'Read Kahn’s defense before attacking. A draw sends you back to the Franco house for a rematch.',
    );
  }
  if (houseResult === 'draw') {
    return objective(
      'm2-kahn-house-rematch',
      'Rematch Kahn',
      'Return to the Franco house in Lisbon and accept the rematch.',
    );
  }
  if (!has(FATHER_CLEARED_EVENT_ID)) {
    return objective(
      'm2-father-cleared',
      'Clear Duke Franco',
      'Visit Lisbon Palace after either victory or defeat in the house duel.',
    );
  }
  if (!has(DOMINGO_FAREWELL_EVENT_ID)) {
    return objective(
      'm2-domingo-farewell',
      'Bid Domingo farewell',
      'Return to the Franco house. Alberto will arrange a replacement if he captains one of your ships.',
    );
  }
  if (!has(KATARINA_WARNING_EVENT_ID)) {
    return objective(
      'm2-katarina-warning',
      'Answer the warning in Seville',
      'Visit the Seville pub, near 36.8° N, 6.0° W on the approximate game-map position. You may prepare before accepting the pursuit.',
    );
  }
  if (!has(PURSUIT_FIRST_SEA_EVENT_ID)) {
    return objective(
      'm2-pursuit-first-sea',
      'Draw the pursuer out',
      'Sail for one consecutive day after accepting the warning. Waiting in port does not advance this step.',
    );
  }
  if (!has(PURSUIT_FIRST_PORT_EVENT_ID)) {
    return objective(
      'm2-pursuit-first-port',
      'Dock during the pursuit',
      'Visit any harbor before departing again. Docking resets days at sea, so the next leg needs another full day.',
    );
  }
  if (!has(KATARINA_BATTLE_START_EVENT_ID)) {
    return objective(
      'm2-katarina-battle-start',
      'Meet Katarina at sea',
      'Sail for one consecutive day after the harbor visit; Katarina will speak before combat starts.',
    );
  }
  if (state.activeCombat !== null || !navalResult) {
    return objective(
      'm2-katarina-combat',
      'Survive Katarina’s pursuit',
      'Withdraw to range 3 to make a successful retreat, or win the battle. Sinking or losing all crew is defeat.',
    );
  }
  if (navalResult === 'defeat') {
    return objective(
      'm2-katarina-retry',
      'Retry Katarina from Lisbon',
      'Visit Lisbon harbor to retry immediately or prepare first. The safe fleet recovery does not require payment.',
    );
  }
  if (!has(ALI_REQUEST_EVENT_ID)) {
    return objective(
      'm2-ali-request',
      'Find Ali outside Lisbon',
      'Visit any pub outside Lisbon after a naval victory or successful retreat.',
    );
  }
  if (!has(LISBON_INQUIRY_EVENT_ID)) {
    return objective(
      'm2-lisbon-inquiry',
      'Ask after Sasha in Lisbon',
      'Visit the Lisbon pub and ask Carlotta for news of Ali’s sister.',
    );
  }
  if (!has(SASHA_FOUND_EVENT_ID)) {
    return objective(
      'm2-sasha-found',
      'Find Sasha in Basra',
      'Reach the Basra pub at the Persian Gulf’s north end, near 29.4° N, 48.7° E on the approximate game map. Sail around Africa’s southern tip into the Indian Ocean and resupply along the coast.',
    );
  }
  return objective(
    'm2-chapter-complete',
    'Report to Ali in Istanbul',
    'Visit the Istanbul lodge by the Bosporus, near 40.6° N, 29.0° E on the approximate game-map position.',
  );
};

export const getConflictAndGrowthJournal = (state: State): JournalEntry[] => {
  const completed = new Set(state.storyEvents ?? []);
  if (completed.has(CONFLICT_AND_GROWTH_COMPLETE_EVENT_ID)) {
    return [
      {
        id: 'm2-complete',
        title: 'Conflict and growth complete',
        body: 'M2 is complete: Ali knows Sasha is safe, while Lucia’s kidnapping remains unresolved.',
        completed: true,
        current: false,
        kind: 'objective',
      },
      {
        id: 'm3-future',
        title: 'A future voyage',
        body: 'Ali’s new lead continues in a future chapter.',
        completed: false,
        current: false,
        kind: 'future',
      },
    ];
  }

  return [
    currentObjective(completed, state),
    preparation,
    ...history
      .filter(({ eventId }) => completed.has(eventId))
      .reverse()
      .map(({ eventId: _eventId, ...entry }) => ({
        ...entry,
        completed: true,
        current: false,
      })),
  ];
};

export default getConflictAndGrowthJournal;
