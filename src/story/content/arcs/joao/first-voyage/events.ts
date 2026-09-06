import {
  characterId,
  storyArcId,
  storyEventId,
  type StoryCondition,
  type StoryEvent,
} from '../../../../core/types';
import { firstVoyageDialogue } from './dialogue';

export const FIRST_VOYAGE_ARC_ID = storyArcId('joao.first-voyage');
export const COMMISSION_ACCEPTED_EVENT_ID = storyEventId(
  'joao.first-voyage.commission-accepted',
);
export const DOMINGO_MET_EVENT_ID = storyEventId(
  'joao.first-voyage.domingo-met',
);
export const DOMINGO_RECRUITED_EVENT_ID = storyEventId(
  'joao.first-voyage.domingo-recruited',
);
export const CHAPTER_COMPLETE_EVENT_ID = storyEventId(
  'joao.first-voyage.chapter-complete',
);
export const GIBRALTAR_DISCOVERY_ID = 'strait-of-gibraltar';

const HARBOR_FINAL_EVENT_ID = storyEventId('joao.lisbon-opening.harbor-final');

const completed = (
  eventId: ReturnType<typeof storyEventId>,
): StoryCondition => ({
  type: 'eventCompleted',
  eventId,
});

const notCompleted = (
  eventId: ReturnType<typeof storyEventId>,
): StoryCondition => ({ type: 'not', condition: completed(eventId) });

const atLisbonGuild = (...conditions: StoryCondition[]): StoryCondition => ({
  type: 'all',
  conditions: [
    { type: 'stage', stage: 'building' },
    { type: 'atPort', portId: '1' },
    { type: 'atBuilding', buildingId: '7' },
    ...conditions,
  ],
});

const commission: StoryEvent = {
  id: COMMISSION_ACCEPTED_EVENT_ID,
  arcId: FIRST_VOYAGE_ARC_ID,
  priority: 3,
  trigger: atLisbonGuild(
    completed(HARBOR_FINAL_EVENT_ID),
    notCompleted(COMMISSION_ACCEPTED_EVENT_ID),
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: firstVoyageDialogue.commission.introduction,
      position: 0,
    },
    {
      type: 'choice',
      prompt: firstVoyageDialogue.commission.prompt,
      position: 0,
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: firstVoyageDialogue.commission.accept,
              position: 0,
            },
            {
              type: 'effect',
              effects: [
                {
                  type: 'completeEvent',
                  eventId: COMMISSION_ACCEPTED_EVENT_ID,
                },
              ],
            },
          ],
        },
        {
          id: 'no',
          label: 'No',
          steps: [
            {
              type: 'dialogue',
              body: firstVoyageDialogue.commission.decline,
              position: 0,
            },
          ],
        },
      ],
    },
  ],
};

const domingoMeeting: StoryEvent = {
  id: DOMINGO_MET_EVENT_ID,
  arcId: FIRST_VOYAGE_ARC_ID,
  priority: 1,
  trigger: {
    type: 'all',
    conditions: [
      { type: 'stage', stage: 'world' },
      completed(HARBOR_FINAL_EVENT_ID),
      { type: 'daysAtSea', min: 3 },
      notCompleted(DOMINGO_MET_EVENT_ID),
    ],
  },
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: firstVoyageDialogue.domingoMeeting.introduction,
      position: 1,
      speaker: characterId('domingo'),
    },
    {
      type: 'dialogue',
      body: firstVoyageDialogue.domingoMeeting.question,
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: firstVoyageDialogue.domingoMeeting.answer,
      position: 1,
      speaker: characterId('domingo'),
    },
    {
      type: 'choice',
      prompt: firstVoyageDialogue.domingoMeeting.prompt,
      position: 1,
      speaker: characterId('domingo'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: firstVoyageDialogue.domingoMeeting.accept,
              position: 1,
              speaker: characterId('domingo'),
            },
            {
              type: 'effect',
              effects: [
                { type: 'completeEvent', eventId: DOMINGO_MET_EVENT_ID },
                { type: 'addCompanion', characterId: characterId('domingo') },
                {
                  type: 'completeEvent',
                  eventId: DOMINGO_RECRUITED_EVENT_ID,
                },
              ],
            },
          ],
        },
        {
          id: 'no',
          label: 'No',
          steps: [
            {
              type: 'dialogue',
              body: firstVoyageDialogue.domingoMeeting.decline,
              position: 1,
              speaker: characterId('domingo'),
            },
            {
              type: 'effect',
              effects: [
                { type: 'completeEvent', eventId: DOMINGO_MET_EVENT_ID },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const domingoReconsideration: StoryEvent = {
  id: DOMINGO_RECRUITED_EVENT_ID,
  arcId: FIRST_VOYAGE_ARC_ID,
  priority: 2,
  trigger: atLisbonGuild(
    completed(DOMINGO_MET_EVENT_ID),
    notCompleted(DOMINGO_RECRUITED_EVENT_ID),
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: firstVoyageDialogue.domingoReconsideration.introduction,
      position: 1,
      speaker: characterId('domingo'),
    },
    {
      type: 'choice',
      prompt: firstVoyageDialogue.domingoReconsideration.prompt,
      position: 1,
      speaker: characterId('domingo'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: firstVoyageDialogue.domingoReconsideration.accept,
              position: 1,
              speaker: characterId('domingo'),
            },
            {
              type: 'effect',
              effects: [
                { type: 'addCompanion', characterId: characterId('domingo') },
                {
                  type: 'completeEvent',
                  eventId: DOMINGO_RECRUITED_EVENT_ID,
                },
              ],
            },
          ],
        },
        {
          id: 'no',
          label: 'No',
          steps: [
            {
              type: 'dialogue',
              body: firstVoyageDialogue.domingoReconsideration.decline,
              position: 1,
              speaker: characterId('domingo'),
            },
          ],
        },
      ],
    },
  ],
};

const chapterComplete: StoryEvent = {
  id: CHAPTER_COMPLETE_EVENT_ID,
  arcId: FIRST_VOYAGE_ARC_ID,
  priority: 1,
  trigger: atLisbonGuild(
    completed(COMMISSION_ACCEPTED_EVENT_ID),
    completed(DOMINGO_RECRUITED_EVENT_ID),
    { type: 'hasCompanion', characterId: characterId('domingo') },
    {
      type: 'hasReportedDiscovery',
      discoveryId: GIBRALTAR_DISCOVERY_ID,
    },
    notCompleted(CHAPTER_COMPLETE_EVENT_ID),
  ),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: firstVoyageDialogue.chapterComplete.chart,
      position: 0,
    },
    {
      type: 'dialogue',
      body: firstVoyageDialogue.chapterComplete.reward,
      position: 0,
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: CHAPTER_COMPLETE_EVENT_ID },
        { type: 'receiveGold', amount: 500 },
      ],
    },
  ],
};

export const firstVoyageEvents: StoryEvent[] = [
  commission,
  domingoMeeting,
  domingoReconsideration,
  chapterComplete,
];

export default firstVoyageEvents;
