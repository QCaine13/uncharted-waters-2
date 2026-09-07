import {
  characterId,
  storyArcId,
  storyEventId,
  type StoryCondition,
  type StoryEvent,
} from '../../../../core/types';
import { CHAPTER_COMPLETE_EVENT_ID as FIRST_VOYAGE_COMPLETE_EVENT_ID } from '../first-voyage';
import { conflictAndGrowthDialogue as dialogue } from './dialogue';

export const CONFLICT_AND_GROWTH_ARC_ID = storyArcId(
  'joao.conflict-and-growth',
);

const eventId = (suffix: string) =>
  storyEventId(`joao.conflict-and-growth.${suffix}`);

export const DOMINGO_MISSING_EVENT_ID = eventId('domingo-missing');
export const LODGE_SEARCH_EVENT_ID = eventId('lodge-search');
export const KAHN_SHIPYARD_START_EVENT_ID = eventId('kahn-shipyard-start');
export const IDENTITY_REVEALED_EVENT_ID = eventId('identity-revealed');
export const KAHN_HOUSE_START_EVENT_ID = eventId('kahn-house-start');
export const KAHN_HOUSE_REMATCH_EVENT_ID = eventId('kahn-house-rematch');
export const FATHER_CLEARED_EVENT_ID = eventId('father-cleared');
export const DOMINGO_FAREWELL_EVENT_ID = eventId('domingo-farewell');
export const DOMINGO_FAREWELL_OWNED_EVENT_ID = eventId(
  'domingo-farewell-flamberge-owned',
);
export const KATARINA_WARNING_EVENT_ID = eventId('katarina-warning');
export const PURSUIT_FIRST_SEA_EVENT_ID = eventId('pursuit-first-sea');
export const PURSUIT_FIRST_PORT_EVENT_ID = eventId('pursuit-first-port');
export const KATARINA_BATTLE_START_EVENT_ID = eventId('katarina-battle-start');
export const KATARINA_RETRY_EVENT_ID = eventId('katarina-retry');
export const ALI_REQUEST_EVENT_ID = eventId('ali-request');
export const LISBON_INQUIRY_EVENT_ID = eventId('lisbon-inquiry');
export const SASHA_FOUND_EVENT_ID = eventId('sasha-found');
export const CONFLICT_AND_GROWTH_COMPLETE_EVENT_ID =
  eventId('chapter-complete');

const completed = (id: ReturnType<typeof storyEventId>): StoryCondition => ({
  type: 'eventCompleted',
  eventId: id,
});
const notCompleted = (id: ReturnType<typeof storyEventId>): StoryCondition => ({
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
const anyHarbor = (...conditions: StoryCondition[]): StoryCondition => ({
  type: 'all',
  conditions: [
    { type: 'stage', stage: 'building' },
    { type: 'atBuilding', buildingId: '4' },
    ...conditions,
  ],
});

const domingoMissing: StoryEvent = {
  id: DOMINGO_MISSING_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 1,
  trigger: scene(
    '27',
    '2',
    completed(FIRST_VOYAGE_COMPLETE_EVENT_ID),
    { type: 'hasCompanion', characterId: characterId('domingo') },
    { type: 'timeWindow', min: 480, max: 960 },
  ),
  repeat: 'once',
  steps: [
    { type: 'dialogue', body: dialogue.domingoMissing.lead, position: 0 },
    {
      type: 'effect',
      effects: [{ type: 'completeEvent', eventId: DOMINGO_MISSING_EVENT_ID }],
    },
  ],
};

const lodgeSearch: StoryEvent = {
  id: LODGE_SEARCH_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 1,
  trigger: scene('27', '5', completed(DOMINGO_MISSING_EVENT_ID)),
  repeat: 'once',
  steps: [
    { type: 'dialogue', body: dialogue.lodgeSearch.lead, position: 0 },
    {
      type: 'effect',
      effects: [{ type: 'completeEvent', eventId: LODGE_SEARCH_EVENT_ID }],
    },
  ],
};

const kahnShipyardStart: StoryEvent = {
  id: KAHN_SHIPYARD_START_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 1,
  trigger: scene('27', '3', completed(LODGE_SEARCH_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.kahnShipyard.threat,
      position: 1,
      speaker: characterId('kahn'),
    },
    {
      type: 'dialogue',
      body: dialogue.kahnShipyard.defense,
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: KAHN_SHIPYARD_START_EVENT_ID },
        { type: 'startCombat', encounterId: 'joao.m2.kahn-shipyard' },
      ],
    },
  ],
};

const identityRevealed: StoryEvent = {
  id: IDENTITY_REVEALED_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 1,
  trigger: scene('27', '4', completed(KAHN_SHIPYARD_START_EVENT_ID), {
    type: 'combatResolved',
    encounterId: 'joao.m2.kahn-shipyard',
    outcomes: ['victory', 'defeat', 'draw'],
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.identity.reveal,
      position: 1,
      speaker: characterId('domingo'),
    },
    {
      type: 'dialogue',
      body: dialogue.identity.returnHome,
      position: 1,
      speaker: characterId('domingo'),
    },
    {
      type: 'effect',
      effects: [{ type: 'completeEvent', eventId: IDENTITY_REVEALED_EVENT_ID }],
    },
  ],
};

const kahnHouseStart: StoryEvent = {
  id: KAHN_HOUSE_START_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 1,
  trigger: scene('1', '8', completed(IDENTITY_REVEALED_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.kahnHouse.challenge,
      position: 1,
      speaker: characterId('kahn'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: KAHN_HOUSE_START_EVENT_ID },
        { type: 'startCombat', encounterId: 'joao.m2.kahn-house' },
      ],
    },
  ],
};

const kahnHouseRematch: StoryEvent = {
  id: KAHN_HOUSE_REMATCH_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 2,
  trigger: scene(
    '1',
    '8',
    completed(KAHN_HOUSE_START_EVENT_ID),
    notCompleted(FATHER_CLEARED_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'joao.m2.kahn-house',
      outcomes: ['draw'],
    },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.kahnHouse.rematch,
      position: 1,
      speaker: characterId('kahn'),
    },
    {
      type: 'effect',
      effects: [{ type: 'startCombat', encounterId: 'joao.m2.kahn-house' }],
    },
  ],
};

const fatherCleared: StoryEvent = {
  id: FATHER_CLEARED_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 1,
  trigger: scene('1', '6', completed(KAHN_HOUSE_START_EVENT_ID), {
    type: 'combatResolved',
    encounterId: 'joao.m2.kahn-house',
    outcomes: ['victory', 'defeat'],
  }),
  repeat: 'once',
  steps: [
    { type: 'dialogue', body: dialogue.fatherCleared.report, position: 0 },
    {
      type: 'effect',
      effects: [
        { type: 'receiveFame', fame: 'adventure', amount: 1000 },
        { type: 'receiveFame', fame: 'pirate', amount: 1000 },
        { type: 'completeEvent', eventId: FATHER_CLEARED_EVENT_ID },
      ],
    },
  ],
};

const domingoFarewell: StoryEvent = {
  id: DOMINGO_FAREWELL_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 3,
  trigger: scene('1', '8', completed(FATHER_CLEARED_EVENT_ID), {
    type: 'not',
    condition: { type: 'hasItem', itemId: '13' },
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.domingoFarewell.gift,
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: dialogue.domingoFarewell.departure,
      position: 2,
      speaker: characterId('domingo'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveItem', itemId: '13' },
        { type: 'removeCompanion', characterId: characterId('domingo') },
        { type: 'completeEvent', eventId: DOMINGO_FAREWELL_EVENT_ID },
      ],
    },
  ],
};

const domingoFarewellOwned: StoryEvent = {
  id: DOMINGO_FAREWELL_OWNED_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 4,
  trigger: scene(
    '1',
    '8',
    completed(FATHER_CLEARED_EVENT_ID),
    notCompleted(DOMINGO_FAREWELL_EVENT_ID),
    { type: 'hasItem', itemId: '13' },
  ),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.domingoFarewell.giftOwned,
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: dialogue.domingoFarewell.departure,
      position: 2,
      speaker: characterId('domingo'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'removeCompanion', characterId: characterId('domingo') },
        { type: 'completeEvent', eventId: DOMINGO_FAREWELL_OWNED_EVENT_ID },
        { type: 'completeEvent', eventId: DOMINGO_FAREWELL_EVENT_ID },
      ],
    },
  ],
};

const katarinaWarning: StoryEvent = {
  id: KATARINA_WARNING_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 2,
  trigger: scene(
    '2',
    '2',
    completed(DOMINGO_FAREWELL_EVENT_ID),
    notCompleted(KATARINA_WARNING_EVENT_ID),
  ),
  repeat: 'repeatable',
  steps: [
    { type: 'dialogue', body: dialogue.katarinaWarning.warning, position: 0 },
    {
      type: 'choice',
      prompt: dialogue.katarinaWarning.prompt,
      position: 1,
      speaker: characterId('rocco'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.katarinaWarning.accept,
              position: 1,
              speaker: characterId('rocco'),
            },
            {
              type: 'effect',
              effects: [
                { type: 'completeEvent', eventId: KATARINA_WARNING_EVENT_ID },
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
              body: dialogue.katarinaWarning.defer,
              position: 1,
              speaker: characterId('rocco'),
            },
          ],
        },
      ],
    },
  ],
};

const pursuitFirstSea: StoryEvent = {
  id: PURSUIT_FIRST_SEA_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 3,
  trigger: {
    type: 'all',
    conditions: [
      { type: 'stage', stage: 'world' },
      completed(KATARINA_WARNING_EVENT_ID),
      { type: 'daysAtSea', min: 1 },
    ],
  },
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.pursuitFirstSea.spotted,
      position: 1,
      speaker: characterId('rocco'),
    },
    {
      type: 'effect',
      effects: [{ type: 'completeEvent', eventId: PURSUIT_FIRST_SEA_EVENT_ID }],
    },
  ],
};

const pursuitFirstPort: StoryEvent = {
  id: PURSUIT_FIRST_PORT_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 2,
  trigger: anyHarbor(completed(PURSUIT_FIRST_SEA_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.pursuitFirstPort.watched,
      position: 1,
      speaker: characterId('rocco'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: PURSUIT_FIRST_PORT_EVENT_ID },
      ],
    },
  ],
};

const katarinaBattleStart: StoryEvent = {
  id: KATARINA_BATTLE_START_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 4,
  trigger: {
    type: 'all',
    conditions: [
      { type: 'stage', stage: 'world' },
      completed(PURSUIT_FIRST_PORT_EVENT_ID),
      { type: 'daysAtSea', min: 1 },
    ],
  },
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.katarinaBattle.accusation,
      position: 1,
      speaker: characterId('katarina'),
    },
    {
      type: 'dialogue',
      body: dialogue.katarinaBattle.response,
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: KATARINA_BATTLE_START_EVENT_ID },
        { type: 'startCombat', encounterId: 'joao.m2.katarina' },
      ],
    },
  ],
};

const katarinaRetry: StoryEvent = {
  id: KATARINA_RETRY_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 3,
  trigger: scene('1', '4', completed(KATARINA_BATTLE_START_EVENT_ID), {
    type: 'combatResolved',
    encounterId: 'joao.m2.katarina',
    outcomes: ['defeat'],
  }),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.katarinaRetry.recovery,
      position: 1,
      speaker: characterId('rocco'),
    },
    {
      type: 'choice',
      prompt: dialogue.katarinaRetry.prompt,
      position: 1,
      speaker: characterId('rocco'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.katarinaRetry.accept,
              position: 1,
              speaker: characterId('rocco'),
            },
            {
              type: 'effect',
              effects: [
                { type: 'startCombat', encounterId: 'joao.m2.katarina' },
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
              body: dialogue.katarinaRetry.defer,
              position: 1,
              speaker: characterId('rocco'),
            },
          ],
        },
      ],
    },
  ],
};

const aliRequest: StoryEvent = {
  id: ALI_REQUEST_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 3,
  trigger: {
    type: 'all',
    conditions: [
      { type: 'stage', stage: 'building' },
      { type: 'atBuilding', buildingId: '2' },
      { type: 'not', condition: { type: 'atPort', portId: '1' } },
      completed(KATARINA_BATTLE_START_EVENT_ID),
      {
        type: 'combatResolved',
        encounterId: 'joao.m2.katarina',
        outcomes: ['victory', 'retreat'],
      },
    ],
  },
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.aliRequest.request,
      position: 1,
      speaker: characterId('ali'),
    },
    {
      type: 'effect',
      effects: [{ type: 'completeEvent', eventId: ALI_REQUEST_EVENT_ID }],
    },
  ],
};

const lisbonInquiry: StoryEvent = {
  id: LISBON_INQUIRY_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 4,
  trigger: scene('1', '2', completed(ALI_REQUEST_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.lisbonInquiry.lead,
      position: 1,
      speaker: characterId('carlotta'),
    },
    {
      type: 'effect',
      effects: [{ type: 'completeEvent', eventId: LISBON_INQUIRY_EVENT_ID }],
    },
  ],
};

const sashaFound: StoryEvent = {
  id: SASHA_FOUND_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 5,
  trigger: scene('77', '2', completed(LISBON_INQUIRY_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.sashaFound.answer,
      position: 1,
      speaker: characterId('sasha'),
    },
    {
      type: 'dialogue',
      body: dialogue.sashaFound.promise,
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'effect',
      effects: [{ type: 'completeEvent', eventId: SASHA_FOUND_EVENT_ID }],
    },
  ],
};

const chapterComplete: StoryEvent = {
  id: CONFLICT_AND_GROWTH_COMPLETE_EVENT_ID,
  arcId: CONFLICT_AND_GROWTH_ARC_ID,
  priority: 1,
  trigger: scene('3', '5', completed(SASHA_FOUND_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.chapterComplete.report,
      position: 1,
      speaker: characterId('ali'),
    },
    {
      type: 'dialogue',
      body: dialogue.chapterComplete.close,
      position: 2,
      speaker: characterId('joao'),
    },
    {
      type: 'effect',
      effects: [
        {
          type: 'completeEvent',
          eventId: CONFLICT_AND_GROWTH_COMPLETE_EVENT_ID,
        },
        { type: 'save' },
      ],
    },
  ],
};

export const conflictAndGrowthEvents: StoryEvent[] = [
  domingoMissing,
  lodgeSearch,
  kahnShipyardStart,
  identityRevealed,
  kahnHouseStart,
  kahnHouseRematch,
  fatherCleared,
  domingoFarewell,
  domingoFarewellOwned,
  katarinaWarning,
  pursuitFirstSea,
  pursuitFirstPort,
  katarinaBattleStart,
  katarinaRetry,
  aliRequest,
  lisbonInquiry,
  sashaFound,
  chapterComplete,
];

export default conflictAndGrowthEvents;
