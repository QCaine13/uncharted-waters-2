import { regularPorts } from '../../../../../data/portData';
import {
  characterId,
  storyArcId,
  storyEventId,
  type StoryCondition,
  type StoryEvent,
  type StoryEventId,
} from '../../../../core/types';
import { MASSAWA_COMPLETE_EVENT_ID } from '../massawa';
import { finaleDialogue as dialogue } from './dialogue';

export const JOAO_FINALE_ARC_ID = storyArcId('joao.finale');

const eventId = (suffix: string) => storyEventId(`joao.finale.${suffix}`);

export const JAPAN_REQUEST_EVENT_ID = eventId('japan-request');
export const ENRICO_FAREWELL_EVENT_ID = eventId('enrico-farewell');
export const LETTER_NOTICE_EVENT_ID = eventId('letter-notice');
export const ENRICO_LETTER_EVENT_ID = eventId('enrico-letter');
export const SAKAI_LEAD_EVENT_ID = eventId('sakai-lead');
export const SOUTH_AMERICA_ARRIVAL_EVENT_ID = eventId('south-america-arrival');
export const RUDOLPH_START_EVENT_ID = eventId('rudolph-start');
export const LUCIA_RESCUED_EVENT_ID = eventId('lucia-rescued');
export const MARTINEZ_EXPOSED_EVENT_ID = eventId('martinez-exposed');
export const RENDEZVOUS_WAIT_EVENT_ID = eventId('rendezvous-wait');
export const SPANISH_ALLIANCE_EVENT_ID = eventId('spanish-alliance');
export const AMAZON_START_EVENT_ID = eventId('amazon-start');
export const AMAZON_RETRY_EVENT_ID = eventId('amazon-retry');
export const AMAZON_VICTORY_EVENT_ID = eventId('amazon-victory');
export const JOAO_ENDING_EVENT_ID = eventId('homecoming');

export const SOUTH_AMERICAN_PORT_IDS = [
  '43',
  '44',
  '46',
  '53',
  '54',
  '55',
  '57',
] as const;

export const AMAZON_BATTLE_AREA = {
  minX: 594,
  maxX: 602,
  minY: 641,
  maxY: 649,
} as const;

const completed = (id: StoryEventId): StoryCondition => ({
  type: 'eventCompleted',
  eventId: id,
});

const notCompleted = (id: StoryEventId): StoryCondition => ({
  type: 'not',
  condition: completed(id),
});

const atAnyPort = (portIds: readonly string[]): StoryCondition => ({
  type: 'any',
  conditions: portIds.map((portId) => ({ type: 'atPort', portId })),
});

const outsideFarEastPort: StoryCondition = atAnyPort(
  regularPorts.flatMap((port, index) =>
    port.regionId === '8' ? [] : [String(index + 1)],
  ),
);

const southAmericanPort = atAnyPort(SOUTH_AMERICAN_PORT_IDS);

const buildingScene = (
  port: StoryCondition,
  buildingId: string | null,
  ...conditions: StoryCondition[]
): StoryCondition => ({
  type: 'all',
  conditions: [
    { type: 'stage', stage: 'building' },
    port,
    ...(buildingId === null
      ? []
      : [{ type: 'atBuilding' as const, buildingId }]),
    ...conditions,
  ],
});

const exactScene = (
  portId: string,
  buildingId: string | null,
  ...conditions: StoryCondition[]
): StoryCondition =>
  buildingScene({ type: 'atPort', portId }, buildingId, ...conditions);

const complete = (id: StoryEventId) => ({
  type: 'effect' as const,
  effects: [{ type: 'completeEvent' as const, eventId: id }],
});

const appointmentWindow: StoryCondition = {
  type: 'all',
  conditions: [
    {
      type: 'calendarDaysAfterEvent',
      eventId: MARTINEZ_EXPOSED_EVENT_ID,
      minDays: 1,
    },
    { type: 'timeWindow', min: 540, max: 900 },
  ],
};

const japanRequest: StoryEvent = {
  id: JAPAN_REQUEST_EVENT_ID,
  arcId: JOAO_FINALE_ARC_ID,
  priority: 0.2,
  trigger: buildingScene(
    outsideFarEastPort,
    '2',
    completed(MASSAWA_COMPLETE_EVENT_ID),
    { type: 'hasCompanion', characterId: characterId('enrico') },
    notCompleted(JAPAN_REQUEST_EVENT_ID),
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.japanRequest.request,
      position: 1,
      speaker: characterId('enrico'),
    },
    {
      type: 'choice',
      prompt: dialogue.japanRequest.prompt,
      position: 1,
      speaker: characterId('enrico'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.japanRequest.accept,
              position: 1,
              speaker: characterId('enrico'),
            },
            complete(JAPAN_REQUEST_EVENT_ID),
          ],
        },
        {
          id: 'no',
          label: 'No',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.japanRequest.defer,
              position: 1,
              speaker: characterId('enrico'),
            },
          ],
        },
      ],
    },
  ],
};

const enricoFarewell: StoryEvent = {
  id: ENRICO_FAREWELL_EVENT_ID,
  arcId: JOAO_FINALE_ARC_ID,
  priority: 0.201,
  trigger: exactScene('100', '4', completed(JAPAN_REQUEST_EVENT_ID), {
    type: 'hasCompanion',
    characterId: characterId('enrico'),
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.enricoFarewell.farewell,
      position: 1,
      speaker: characterId('enrico'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'removeCompanion', characterId: characterId('enrico') },
        { type: 'receiveFame', fame: 'adventure', amount: 1000 },
        { type: 'completeEvent', eventId: ENRICO_FAREWELL_EVENT_ID },
      ],
    },
  ],
};

const letterNotice: StoryEvent = {
  id: LETTER_NOTICE_EVENT_ID,
  arcId: JOAO_FINALE_ARC_ID,
  priority: 0.202,
  trigger: exactScene('1', null, completed(ENRICO_FAREWELL_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.letterNotice.notice,
      position: 1,
      speaker: characterId('rocco'),
    },
    complete(LETTER_NOTICE_EVENT_ID),
  ],
};

const enricoLetter: StoryEvent = {
  id: ENRICO_LETTER_EVENT_ID,
  arcId: JOAO_FINALE_ARC_ID,
  priority: 0.203,
  trigger: exactScene('1', '7', completed(LETTER_NOTICE_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.enricoLetter.letter,
      position: 2,
      speaker: characterId('enrico'),
    },
    complete(ENRICO_LETTER_EVENT_ID),
  ],
};

const sakaiLead: StoryEvent = {
  id: SAKAI_LEAD_EVENT_ID,
  arcId: JOAO_FINALE_ARC_ID,
  priority: 0.204,
  trigger: exactScene('99', '7', completed(ENRICO_LETTER_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.sakaiLead.lead,
      position: 1,
      speaker: characterId('enrico'),
    },
    complete(SAKAI_LEAD_EVENT_ID),
  ],
};

const southAmericaArrival: StoryEvent = {
  id: SOUTH_AMERICA_ARRIVAL_EVENT_ID,
  arcId: JOAO_FINALE_ARC_ID,
  priority: 0.205,
  trigger: buildingScene(
    southAmericanPort,
    null,
    { type: 'not', condition: { type: 'atBuilding', buildingId: '2' } },
    completed(SAKAI_LEAD_EVENT_ID),
  ),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.southAmericaArrival.lead,
      position: 1,
      speaker: characterId('rocco'),
    },
    complete(SOUTH_AMERICA_ARRIVAL_EVENT_ID),
  ],
};

const rudolphStart: StoryEvent = {
  id: RUDOLPH_START_EVENT_ID,
  arcId: JOAO_FINALE_ARC_ID,
  priority: 0.206,
  trigger: buildingScene(
    southAmericanPort,
    '2',
    completed(SOUTH_AMERICA_ARRIVAL_EVENT_ID),
  ),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.rudolphStart.threat,
      position: 1,
      speaker: characterId('rudolph'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: RUDOLPH_START_EVENT_ID },
        { type: 'startCombat', encounterId: 'joao.m3.rudolph' },
      ],
    },
  ],
};

const luciaRescued: StoryEvent = {
  id: LUCIA_RESCUED_EVENT_ID,
  arcId: JOAO_FINALE_ARC_ID,
  priority: 0.207,
  trigger: buildingScene(
    southAmericanPort,
    '2',
    completed(RUDOLPH_START_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'joao.m3.rudolph',
      outcomes: ['victory', 'defeat', 'draw'],
    },
  ),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.luciaRescued.katarina,
      position: 1,
      speaker: characterId('katarina'),
    },
    {
      type: 'dialogue',
      body: dialogue.luciaRescued.lucia,
      position: 2,
      speaker: characterId('lucia'),
    },
    complete(LUCIA_RESCUED_EVENT_ID),
  ],
};

const martinezExposed: StoryEvent = {
  id: MARTINEZ_EXPOSED_EVENT_ID,
  arcId: JOAO_FINALE_ARC_ID,
  priority: 0.208,
  trigger: buildingScene(
    southAmericanPort,
    '4',
    completed(LUCIA_RESCUED_EVENT_ID),
  ),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.martinezExposed.katarina,
      position: 1,
      speaker: characterId('katarina'),
    },
    {
      type: 'dialogue',
      body: dialogue.martinezExposed.report,
      position: 2,
      speaker: characterId('martinez'),
    },
    {
      type: 'dialogue',
      body: dialogue.martinezExposed.agreement,
      position: 1,
      speaker: characterId('joao'),
    },
    complete(MARTINEZ_EXPOSED_EVENT_ID),
  ],
};

const rendezvousWait: StoryEvent = {
  id: RENDEZVOUS_WAIT_EVENT_ID,
  arcId: JOAO_FINALE_ARC_ID,
  priority: 0.4,
  trigger: buildingScene(
    southAmericanPort,
    '4',
    completed(MARTINEZ_EXPOSED_EVENT_ID),
    notCompleted(SPANISH_ALLIANCE_EVENT_ID),
    { type: 'not', condition: appointmentWindow },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.rendezvousWait.guidance,
      position: 1,
      speaker: characterId('rocco'),
    },
  ],
};

const spanishAlliance: StoryEvent = {
  id: SPANISH_ALLIANCE_EVENT_ID,
  arcId: JOAO_FINALE_ARC_ID,
  priority: 0.209,
  trigger: buildingScene(
    southAmericanPort,
    '4',
    completed(MARTINEZ_EXPOSED_EVENT_ID),
    appointmentWindow,
  ),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.spanishAlliance.pledge,
      position: 1,
      speaker: characterId('ezequiel'),
    },
    complete(SPANISH_ALLIANCE_EVENT_ID),
  ],
};

const amazonStart: StoryEvent = {
  id: AMAZON_START_EVENT_ID,
  arcId: JOAO_FINALE_ARC_ID,
  priority: 0.21,
  trigger: {
    type: 'all',
    conditions: [
      { type: 'stage', stage: 'world' },
      completed(SPANISH_ALLIANCE_EVENT_ID),
      { type: 'withinWorldArea', ...AMAZON_BATTLE_AREA },
    ],
  },
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.amazonStart.katarina,
      position: 1,
      speaker: characterId('katarina'),
    },
    {
      type: 'dialogue',
      body: dialogue.amazonStart.rocco,
      position: 2,
      speaker: characterId('rocco'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: AMAZON_START_EVENT_ID },
        { type: 'startCombat', encounterId: 'joao.m3.amazon' },
      ],
    },
  ],
};

const amazonRetry: StoryEvent = {
  id: AMAZON_RETRY_EVENT_ID,
  arcId: JOAO_FINALE_ARC_ID,
  priority: 0.401,
  trigger: exactScene(
    '57',
    '4',
    completed(AMAZON_START_EVENT_ID),
    notCompleted(AMAZON_VICTORY_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'joao.m3.amazon',
      outcomes: ['defeat', 'retreat', 'draw'],
    },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.amazonRetry.recovery,
      position: 1,
      speaker: characterId('katarina'),
    },
    {
      type: 'choice',
      prompt: dialogue.amazonRetry.prompt,
      position: 1,
      speaker: characterId('katarina'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.amazonRetry.accept,
              position: 1,
              speaker: characterId('katarina'),
            },
            {
              type: 'effect',
              effects: [{ type: 'startCombat', encounterId: 'joao.m3.amazon' }],
            },
          ],
        },
        {
          id: 'no',
          label: 'No',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.amazonRetry.defer,
              position: 1,
              speaker: characterId('katarina'),
            },
          ],
        },
      ],
    },
  ],
};

const amazonVictory: StoryEvent = {
  id: AMAZON_VICTORY_EVENT_ID,
  arcId: JOAO_FINALE_ARC_ID,
  priority: 0.211,
  trigger: {
    type: 'all',
    conditions: [
      completed(AMAZON_START_EVENT_ID),
      {
        type: 'combatResolved',
        encounterId: 'joao.m3.amazon',
        outcomes: ['victory'],
      },
    ],
  },
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.amazonVictory.katarina,
      position: 1,
      speaker: characterId('katarina'),
    },
    {
      type: 'dialogue',
      body: dialogue.amazonVictory.rocco,
      position: 2,
      speaker: characterId('rocco'),
    },
    complete(AMAZON_VICTORY_EVENT_ID),
  ],
};

const homecoming: StoryEvent = {
  id: JOAO_ENDING_EVENT_ID,
  arcId: JOAO_FINALE_ARC_ID,
  priority: 0.212,
  trigger: exactScene('1', '8', completed(AMAZON_VICTORY_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.homecoming.mother,
      position: 1,
      speaker: characterId('duchess-christiana'),
    },
    {
      type: 'dialogue',
      body: dialogue.homecoming.father,
      position: 2,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: dialogue.homecoming.rocco,
      position: 1,
      speaker: characterId('rocco'),
    },
    complete(JOAO_ENDING_EVENT_ID),
  ],
};

export const finaleEvents: StoryEvent[] = [
  japanRequest,
  enricoFarewell,
  letterNotice,
  enricoLetter,
  sakaiLead,
  southAmericaArrival,
  rudolphStart,
  luciaRescued,
  martinezExposed,
  rendezvousWait,
  spanishAlliance,
  amazonStart,
  amazonRetry,
  amazonVictory,
  homecoming,
];

export default finaleEvents;
