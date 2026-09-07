import type { State } from '../state/state';
import { legacyToSemanticEvent } from './legacy/lisbonCompletionKeys';
import {
  CHAPTER_COMPLETE_EVENT_ID,
  COMMISSION_ACCEPTED_EVENT_ID,
  DOMINGO_MET_EVENT_ID,
  DOMINGO_RECRUITED_EVENT_ID,
  GIBRALTAR_DISCOVERY_ID,
} from './content/arcs/joao/first-voyage';

export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  completed: boolean;
  current?: boolean;
  kind?: 'objective' | 'advice' | 'future';
  values?: Record<string, string | number>;
}

const openingSteps = [
  {
    id: 'opening-house',
    eventId: legacyToSemanticEvent.houseBeforeQuest,
    title: 'Meet your father',
    body: 'Visit your father at the Franco house in Lisbon.',
  },
  {
    id: 'opening-pub',
    eventId: legacyToSemanticEvent.pubAfterQuest,
    title: 'Say farewell',
    body: 'Visit Carlotta at the Lisbon pub.',
  },
  {
    id: 'opening-shipyard',
    eventId: legacyToSemanticEvent.shipyardAfterQuest,
    title: 'Collect your ship',
    body: 'Collect Hermes II at the Lisbon shipyard.',
  },
  {
    id: 'opening-church',
    eventId: legacyToSemanticEvent.churchAfterQuest,
    title: 'Recruit Enrico',
    body: 'Meet Father Felippe and Enrico at the Lisbon church.',
  },
  {
    id: 'opening-mother',
    eventId: legacyToSemanticEvent.houseAfterQuestAndPub,
    title: 'Meet your mother',
    body: 'Return to your mother at the Franco house from 22:00 to midnight.',
  },
  {
    id: 'opening-harbor',
    eventId: legacyToSemanticEvent.harborFinal,
    title: 'Set sail',
    body: 'Finish preparations with Rocco at the Lisbon harbor.',
  },
] as const;

export const getFirstVoyageJournal = (state: State): JournalEntry[] => {
  const completedEvents = new Set(state.storyEvents ?? []);
  const chapterCompleted = completedEvents.has(CHAPTER_COMPLETE_EVENT_ID);
  const domingoMet = completedEvents.has(DOMINGO_MET_EVENT_ID);
  const domingoRecruited =
    chapterCompleted ||
    (completedEvents.has(DOMINGO_RECRUITED_EVENT_ID) &&
      state.mates.some(({ sailorId }) => sailorId === '34'));
  const discoveredGibraltar = state.discoveries.includes(
    GIBRALTAR_DISCOVERY_ID,
  );
  const reportedGibraltar = state.reportedDiscoveries.includes(
    GIBRALTAR_DISCOVERY_ID,
  );

  return [
    ...openingSteps.map(({ id, eventId, title, body }) => ({
      id,
      title,
      body,
      completed: chapterCompleted || completedEvents.has(eventId),
    })),
    {
      id: 'commission',
      title: 'First voyage commission',
      body: 'Accept the first-voyage commission at the Lisbon Guild.',
      completed:
        chapterCompleted || completedEvents.has(COMMISSION_ACCEPTED_EVENT_ID),
    },
    {
      id: 'domingo',
      title: 'Domingo',
      body: domingoMet
        ? 'Reconsider Domingo’s offer at the Lisbon Guild.'
        : 'Sail for 3 consecutive days to meet the sailor following your wake.',
      completed: domingoRecruited,
    },
    {
      id: 'gibraltar',
      title: 'Chart Gibraltar',
      body: 'Sail south from Lisbon around Iberia’s southwest coast, then east toward Seville and Ceuta. Chart Gibraltar near 36° N, 5.6° W.',
      completed: chapterCompleted || discoveredGibraltar,
    },
    {
      id: 'report',
      title: 'Report Gibraltar',
      body: 'Return to the Lisbon Guild and report the Strait of Gibraltar.',
      completed: chapterCompleted || reportedGibraltar,
    },
    {
      id: 'chapter',
      title: 'Complete the chapter',
      body: 'Collect the 500g commission reward at the Lisbon Guild.',
      completed: completedEvents.has(CHAPTER_COMPLETE_EVENT_ID),
    },
  ];
};

export default getFirstVoyageJournal;
