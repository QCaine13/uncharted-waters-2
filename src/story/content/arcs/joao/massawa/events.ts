import {
  characterId,
  storyArcId,
  storyEventId,
  type StoryCondition,
  type StoryEvent,
  type StoryEventId,
} from '../../../../core/types';
import { CONFLICT_AND_GROWTH_COMPLETE_EVENT_ID } from '../conflict-and-growth';
import { massawaDialogue as dialogue } from './dialogue';

export const MASSAWA_ARC_ID = storyArcId('joao.massawa');

const eventId = (suffix: string) => storyEventId(`joao.massawa.${suffix}`);

export const FIVE_DAY_VOYAGE_EVENT_ID = eventId('five-day-voyage');
export const ALI_MASSAWA_LEAD_EVENT_ID = eventId('ali-massawa-lead');
export const RELIGIOUS_LEAD_EVENT_ID = eventId('religious-lead');
export const STAFF_REQUEST_EVENT_ID = eventId('staff-request');
export const PIETRO_COMMISSIONED_EVENT_ID = eventId('pietro-commissioned');
export const WAITING_FOR_PIETRO_EVENT_ID = eventId('waiting-for-pietro');
export const MASSAWA_WAITING_EVENT_ID = WAITING_FOR_PIETRO_EVENT_ID;
export const WAITING_ADVICE_EVENT_ID = eventId('waiting-advice');
export const INVASION_AUTHORIZED_EVENT_ID = eventId('invasion-authorized');
export const FIRST_SORTIE_READY_EVENT_ID = eventId('first-sortie-ready');
export const OTTOMAN_ONE_START_EVENT_ID = eventId('ottoman-one-start');
export const OTTOMAN_ONE_RETRY_EVENT_ID = eventId('ottoman-one-retry');
export const SECOND_SORTIE_READY_EVENT_ID = eventId('second-sortie-ready');
export const OTTOMAN_TWO_START_EVENT_ID = eventId('ottoman-two-start');
export const OTTOMAN_TWO_RETRY_EVENT_ID = eventId('ottoman-two-retry');
export const DEFENSE_REPORTED_EVENT_ID = eventId('defense-reported');
export const STAFF_RECEIVED_EVENT_ID = eventId('staff-received');
export const STAFF_RETURNED_EVENT_ID = eventId('staff-returned');
export const MASSAWA_COMPLETE_EVENT_ID = eventId('chapter-complete');

export const MASSAWA_BATTLE_AREA = {
  minX: 1152,
  maxX: 1156,
  minY: 527,
  maxY: 533,
} as const;

const completed = (id: StoryEventId): StoryCondition => ({
  type: 'eventCompleted',
  eventId: id,
});

const notCompleted = (id: StoryEventId): StoryCondition => ({
  type: 'not',
  condition: completed(id),
});

const scene = (
  portId: string,
  buildingId: string,
  ...conditions: StoryCondition[]
): StoryCondition => ({
  type: 'all',
  conditions: [
    { type: 'stage', stage: 'building' },
    { type: 'atPort', portId },
    { type: 'atBuilding', buildingId },
    ...conditions,
  ],
});

const complete = (id: StoryEventId) => ({
  type: 'effect' as const,
  effects: [{ type: 'completeEvent' as const, eventId: id }],
});

const firstSortieEligible: StoryCondition = {
  type: 'calendarMonthsAfterEvent',
  eventId: WAITING_FOR_PIETRO_EVENT_ID,
  minMonths: 1,
  minDay: 11,
};

const fiveDayVoyage: StoryEvent = {
  id: FIVE_DAY_VOYAGE_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.1,
  trigger: {
    type: 'all',
    conditions: [
      { type: 'stage', stage: 'world' },
      completed(CONFLICT_AND_GROWTH_COMPLETE_EVENT_ID),
      { type: 'daysAtSea', min: 5 },
    ],
  },
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.fiveDayVoyage.lead,
      position: 1,
      speaker: characterId('rocco'),
    },
    complete(FIVE_DAY_VOYAGE_EVENT_ID),
  ],
};

const aliMassawaLead: StoryEvent = {
  id: ALI_MASSAWA_LEAD_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.101,
  trigger: {
    type: 'all',
    conditions: [
      { type: 'stage', stage: 'building' },
      completed(FIVE_DAY_VOYAGE_EVENT_ID),
    ],
  },
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.aliMassawaLead.lead,
      position: 1,
      speaker: characterId('ali'),
    },
    complete(ALI_MASSAWA_LEAD_EVENT_ID),
  ],
};

const religiousLead: StoryEvent = {
  id: RELIGIOUS_LEAD_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.102,
  trigger: scene('75', '11', completed(ALI_MASSAWA_LEAD_EVENT_ID)),
  repeat: 'once',
  steps: [
    { type: 'dialogue', body: dialogue.religiousLead.lead, position: 0 },
    complete(RELIGIOUS_LEAD_EVENT_ID),
  ],
};

const staffRequest: StoryEvent = {
  id: STAFF_REQUEST_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.103,
  trigger: scene('75', '8', completed(RELIGIOUS_LEAD_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.staffRequest.request,
      position: 1,
      speaker: characterId('taphiel'),
    },
    complete(STAFF_REQUEST_EVENT_ID),
  ],
};

const pietroCommissioned: StoryEvent = {
  id: PIETRO_COMMISSIONED_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.104,
  trigger: scene('1', '8', completed(STAFF_REQUEST_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.pietroCommissioned.promise,
      position: 1,
      speaker: characterId('pietro'),
    },
    complete(PIETRO_COMMISSIONED_EVENT_ID),
  ],
};

const waitingForPietro: StoryEvent = {
  id: WAITING_FOR_PIETRO_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.105,
  trigger: scene('75', '8', completed(PIETRO_COMMISSIONED_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.waitingForPietro.wait,
      position: 1,
      speaker: characterId('taphiel'),
    },
    complete(WAITING_FOR_PIETRO_EVENT_ID),
  ],
};

const waitingAdvice: StoryEvent = {
  id: WAITING_ADVICE_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.3,
  trigger: scene(
    '75',
    '8',
    completed(WAITING_FOR_PIETRO_EVENT_ID),
    notCompleted(INVASION_AUTHORIZED_EVENT_ID),
    { type: 'not', condition: firstSortieEligible },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.waitingAdvice.rule,
      position: 1,
      speaker: characterId('taphiel'),
    },
  ],
};

const invasionAuthorized: StoryEvent = {
  id: INVASION_AUTHORIZED_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.106,
  trigger: scene('75', '8', firstSortieEligible),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.invasionAuthorized.alarm,
      position: 1,
      speaker: characterId('taphiel'),
    },
    complete(INVASION_AUTHORIZED_EVENT_ID),
  ],
};

const firstSortieReady: StoryEvent = {
  id: FIRST_SORTIE_READY_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.107,
  trigger: scene(
    '75',
    '4',
    completed(INVASION_AUTHORIZED_EVENT_ID),
    notCompleted(FIRST_SORTIE_READY_EVENT_ID),
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.firstSortieReady.arrival,
      position: 1,
      speaker: characterId('katarina'),
    },
    {
      type: 'choice',
      prompt: dialogue.firstSortieReady.prompt,
      position: 1,
      speaker: characterId('katarina'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.firstSortieReady.accept,
              position: 1,
              speaker: characterId('katarina'),
            },
            complete(FIRST_SORTIE_READY_EVENT_ID),
          ],
        },
        {
          id: 'no',
          label: 'No',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.firstSortieReady.defer,
              position: 1,
              speaker: characterId('katarina'),
            },
          ],
        },
      ],
    },
  ],
};

const ottomanOneStart: StoryEvent = {
  id: OTTOMAN_ONE_START_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.108,
  trigger: {
    type: 'all',
    conditions: [
      { type: 'stage', stage: 'world' },
      completed(FIRST_SORTIE_READY_EVENT_ID),
      { type: 'withinWorldArea', ...MASSAWA_BATTLE_AREA },
    ],
  },
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.ottomanOneStart.contact,
      position: 1,
      speaker: characterId('katarina'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: OTTOMAN_ONE_START_EVENT_ID },
        { type: 'startCombat', encounterId: 'joao.m3.ottoman-one' },
      ],
    },
  ],
};

const ottomanOneRetry: StoryEvent = {
  id: OTTOMAN_ONE_RETRY_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.301,
  trigger: scene(
    '75',
    '4',
    completed(OTTOMAN_ONE_START_EVENT_ID),
    notCompleted(SECOND_SORTIE_READY_EVENT_ID),
    notCompleted(DEFENSE_REPORTED_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'joao.m3.ottoman-one',
      outcomes: ['defeat'],
    },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.ottomanOneRetry.recovery,
      position: 1,
      speaker: characterId('katarina'),
    },
    {
      type: 'choice',
      prompt: dialogue.ottomanOneRetry.prompt,
      position: 1,
      speaker: characterId('katarina'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.ottomanOneRetry.accept,
              position: 1,
              speaker: characterId('katarina'),
            },
            {
              type: 'effect',
              effects: [
                { type: 'startCombat', encounterId: 'joao.m3.ottoman-one' },
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
              body: dialogue.ottomanOneRetry.defer,
              position: 1,
              speaker: characterId('katarina'),
            },
          ],
        },
      ],
    },
  ],
};

const secondSortieReady: StoryEvent = {
  id: SECOND_SORTIE_READY_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.109,
  trigger: scene(
    '75',
    '4',
    completed(OTTOMAN_ONE_START_EVENT_ID),
    notCompleted(SECOND_SORTIE_READY_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'joao.m3.ottoman-one',
      outcomes: ['victory', 'retreat'],
    },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.secondSortieReady.report,
      position: 1,
      speaker: characterId('katarina'),
    },
    {
      type: 'choice',
      prompt: dialogue.secondSortieReady.prompt,
      position: 1,
      speaker: characterId('katarina'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.secondSortieReady.accept,
              position: 1,
              speaker: characterId('katarina'),
            },
            complete(SECOND_SORTIE_READY_EVENT_ID),
          ],
        },
        {
          id: 'no',
          label: 'No',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.secondSortieReady.defer,
              position: 1,
              speaker: characterId('katarina'),
            },
          ],
        },
      ],
    },
  ],
};

const ottomanTwoStart: StoryEvent = {
  id: OTTOMAN_TWO_START_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.11,
  trigger: {
    type: 'all',
    conditions: [
      { type: 'stage', stage: 'world' },
      completed(SECOND_SORTIE_READY_EVENT_ID),
      { type: 'withinWorldArea', ...MASSAWA_BATTLE_AREA },
    ],
  },
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.ottomanTwoStart.contact,
      position: 1,
      speaker: characterId('katarina'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: OTTOMAN_TWO_START_EVENT_ID },
        { type: 'startCombat', encounterId: 'joao.m3.ottoman-two' },
      ],
    },
  ],
};

const ottomanTwoRetry: StoryEvent = {
  id: OTTOMAN_TWO_RETRY_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.302,
  trigger: scene(
    '75',
    '4',
    completed(OTTOMAN_TWO_START_EVENT_ID),
    notCompleted(DEFENSE_REPORTED_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'joao.m3.ottoman-two',
      outcomes: ['defeat'],
    },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.ottomanTwoRetry.recovery,
      position: 1,
      speaker: characterId('katarina'),
    },
    {
      type: 'choice',
      prompt: dialogue.ottomanTwoRetry.prompt,
      position: 1,
      speaker: characterId('katarina'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.ottomanTwoRetry.accept,
              position: 1,
              speaker: characterId('katarina'),
            },
            {
              type: 'effect',
              effects: [
                { type: 'startCombat', encounterId: 'joao.m3.ottoman-two' },
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
              body: dialogue.ottomanTwoRetry.defer,
              position: 1,
              speaker: characterId('katarina'),
            },
          ],
        },
      ],
    },
  ],
};

const defenseReported: StoryEvent = {
  id: DEFENSE_REPORTED_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.111,
  trigger: scene(
    '75',
    '8',
    completed(OTTOMAN_TWO_START_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'joao.m3.ottoman-one',
      outcomes: ['victory', 'retreat'],
    },
    {
      type: 'combatResolved',
      encounterId: 'joao.m3.ottoman-two',
      outcomes: ['victory', 'retreat'],
    },
  ),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.defenseReported.thanks,
      position: 1,
      speaker: characterId('taphiel'),
    },
    complete(DEFENSE_REPORTED_EVENT_ID),
  ],
};

const staffReceived: StoryEvent = {
  id: STAFF_RECEIVED_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.112,
  trigger: scene('75', '2', completed(DEFENSE_REPORTED_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.staffReceived.delivery,
      position: 1,
      speaker: characterId('pietro'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveItem', itemId: 'm3-staff-of-the-saint' },
        { type: 'completeEvent', eventId: STAFF_RECEIVED_EVENT_ID },
      ],
    },
  ],
};

const staffReturned: StoryEvent = {
  id: STAFF_RETURNED_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.113,
  trigger: scene('75', '8', completed(STAFF_RECEIVED_EVENT_ID), {
    type: 'hasItem',
    itemId: 'm3-staff-of-the-saint',
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.staffReturned.reward,
      position: 1,
      speaker: characterId('taphiel'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'consumeItem', itemId: 'm3-staff-of-the-saint' },
        { type: 'receiveItem', itemId: '45' },
        { type: 'receiveFame', fame: 'adventure', amount: 5000 },
        { type: 'completeEvent', eventId: STAFF_RETURNED_EVENT_ID },
      ],
    },
  ],
};

const chapterComplete: StoryEvent = {
  id: MASSAWA_COMPLETE_EVENT_ID,
  arcId: MASSAWA_ARC_ID,
  priority: 0.114,
  trigger: scene('75', '4', completed(STAFF_RETURNED_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.chapterComplete.pietro,
      position: 1,
      speaker: characterId('pietro'),
    },
    {
      type: 'dialogue',
      body: dialogue.chapterComplete.enrico,
      position: 2,
      speaker: characterId('enrico'),
    },
    {
      type: 'dialogue',
      body: dialogue.chapterComplete.katarina,
      position: 1,
      speaker: characterId('katarina'),
    },
    complete(MASSAWA_COMPLETE_EVENT_ID),
  ],
};

export const massawaEvents: StoryEvent[] = [
  fiveDayVoyage,
  aliMassawaLead,
  religiousLead,
  staffRequest,
  pietroCommissioned,
  waitingForPietro,
  waitingAdvice,
  invasionAuthorized,
  firstSortieReady,
  ottomanOneStart,
  ottomanOneRetry,
  secondSortieReady,
  ottomanTwoStart,
  ottomanTwoRetry,
  defenseReported,
  staffReceived,
  staffReturned,
  chapterComplete,
];

export default massawaEvents;
