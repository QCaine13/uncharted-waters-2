import {
  characterId,
  storyArcId,
  storyEventId,
  type StoryCondition,
  type StoryEvent,
  type StoryEventId,
} from '../../../../core/types';
import { aliMerchantDialogue as dialogue } from './dialogue';

export const ALI_MERCHANT_ARC_ID = storyArcId('ali.merchant');

const eventId = (suffix: string) => storyEventId(`ali.merchant.${suffix}`);

export const ALI_ISTANBUL_WINDFALL_EVENT_ID = eventId('istanbul-windfall');
export const ALI_ALEXANDRIA_SPICE_EVENT_ID = eventId('alexandria-spice');
export const ALI_LISBON_SEARCH_EVENT_ID = eventId('lisbon-search');
export const ALI_ADEN_CORSAIRS_EVENT_ID = eventId('aden-corsairs');
export const ALI_ADEN_CORSAIRS_RETRY_EVENT_ID = eventId('aden-corsairs-retry');
export const ALI_BASRA_REUNION_EVENT_ID = eventId('basra-reunion');
export const ALI_ENDING_EVENT_ID = eventId('istanbul-grand-vizier');

const completed = (id: StoryEventId): StoryCondition => ({
  type: 'eventCompleted',
  eventId: id,
});

const notCompleted = (id: StoryEventId): StoryCondition => ({
  type: 'not',
  condition: completed(id),
});

const exactScene = (
  portId: string,
  buildingId: string | null,
  ...conditions: StoryCondition[]
): StoryCondition => ({
  type: 'all',
  conditions: [
    { type: 'stage', stage: 'building' },
    { type: 'atPort', portId },
    ...(buildingId === null
      ? []
      : [{ type: 'atBuilding' as const, buildingId }]),
    ...conditions,
  ],
});

const istanbulWindfall: StoryEvent = {
  id: ALI_ISTANBUL_WINDFALL_EVENT_ID,
  arcId: ALI_MERCHANT_ARC_ID,
  priority: 0.901,
  trigger: exactScene('3', '4'),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.istanbulWindfall.salimGift,
      position: 1,
      speaker: characterId('salim'),
    },
    {
      type: 'dialogue',
      body: dialogue.istanbulWindfall.aliGratitude,
      position: 2,
      speaker: characterId('ali'),
    },
    {
      type: 'dialogue',
      body: dialogue.istanbulWindfall.salimHint,
      position: 1,
      speaker: characterId('salim'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveShip', shipId: '3', name: 'Hugli' },
        { type: 'addCompanion', characterId: characterId('salim') },
        { type: 'assignMate', characterId: characterId('ali'), role: 0 },
        {
          type: 'assignMate',
          characterId: characterId('salim'),
          role: 'bookKeeper',
        },
        { type: 'receiveGold', amount: 2000 },
        { type: 'completeEvent', eventId: ALI_ISTANBUL_WINDFALL_EVENT_ID },
      ],
    },
  ],
};

const alexandriaSpice: StoryEvent = {
  id: ALI_ALEXANDRIA_SPICE_EVENT_ID,
  arcId: ALI_MERCHANT_ARC_ID,
  priority: 0.902,
  trigger: exactScene('19', '1', completed(ALI_ISTANBUL_WINDFALL_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.alexandriaSpice.salimProfit,
      position: 1,
      speaker: characterId('salim'),
    },
    {
      type: 'dialogue',
      body: dialogue.alexandriaSpice.pietroClue,
      position: 1,
      speaker: characterId('pietro'),
    },
    {
      type: 'dialogue',
      body: dialogue.alexandriaSpice.aliCourse,
      position: 2,
      speaker: characterId('ali'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveGold', amount: 3500 },
        { type: 'receiveFame', fame: 'trade', amount: 150 },
        { type: 'completeEvent', eventId: ALI_ALEXANDRIA_SPICE_EVENT_ID },
      ],
    },
  ],
};

const lisbonSearch: StoryEvent = {
  id: ALI_LISBON_SEARCH_EVENT_ID,
  arcId: ALI_MERCHANT_ARC_ID,
  priority: 0.903,
  trigger: exactScene('1', '2', completed(ALI_ALEXANDRIA_SPICE_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.lisbonSearch.luciaMemory,
      position: 1,
      speaker: characterId('lucia'),
    },
    {
      type: 'dialogue',
      body: dialogue.lisbonSearch.joaoCharter,
      position: 1,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: dialogue.lisbonSearch.aliResolve,
      position: 2,
      speaker: characterId('ali'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveGold', amount: 3000 },
        { type: 'receiveFame', fame: 'trade', amount: 200 },
        { type: 'completeEvent', eventId: ALI_LISBON_SEARCH_EVENT_ID },
      ],
    },
  ],
};

const adenCorsairs: StoryEvent = {
  id: ALI_ADEN_CORSAIRS_EVENT_ID,
  arcId: ALI_MERCHANT_ARC_ID,
  priority: 0.904,
  trigger: exactScene('73', '4', completed(ALI_LISBON_SEARCH_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.adenCorsairs.salimAlarm,
      position: 1,
      speaker: characterId('salim'),
    },
    {
      type: 'dialogue',
      body: dialogue.adenCorsairs.aliDefiance,
      position: 2,
      speaker: characterId('ali'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: ALI_ADEN_CORSAIRS_EVENT_ID },
        { type: 'startCombat', encounterId: 'ali.red-sea-raiders' },
      ],
    },
  ],
};

const adenCorsairsRetry: StoryEvent = {
  id: ALI_ADEN_CORSAIRS_RETRY_EVENT_ID,
  arcId: ALI_MERCHANT_ARC_ID,
  priority: 0.905,
  trigger: exactScene(
    '73',
    '4',
    completed(ALI_ADEN_CORSAIRS_EVENT_ID),
    notCompleted(ALI_BASRA_REUNION_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'ali.red-sea-raiders',
      outcomes: ['defeat', 'retreat', 'draw'],
    },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.adenCorsairsRetry.recovery,
      position: 1,
      speaker: characterId('salim'),
    },
    {
      type: 'choice',
      prompt: dialogue.adenCorsairsRetry.prompt,
      position: 1,
      speaker: characterId('salim'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.adenCorsairsRetry.accept,
              position: 2,
              speaker: characterId('ali'),
            },
            {
              type: 'effect',
              effects: [
                { type: 'startCombat', encounterId: 'ali.red-sea-raiders' },
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
              body: dialogue.adenCorsairsRetry.defer,
              position: 1,
              speaker: characterId('salim'),
            },
          ],
        },
      ],
    },
  ],
};

const basraReunion: StoryEvent = {
  id: ALI_BASRA_REUNION_EVENT_ID,
  arcId: ALI_MERCHANT_ARC_ID,
  priority: 0.906,
  trigger: exactScene('77', '2', completed(ALI_ADEN_CORSAIRS_EVENT_ID), {
    type: 'combatResolved',
    encounterId: 'ali.red-sea-raiders',
    outcomes: ['victory'],
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.basraReunion.sashaCry,
      position: 1,
      speaker: characterId('sasha'),
    },
    {
      type: 'dialogue',
      body: dialogue.basraReunion.aliEmbrace,
      position: 2,
      speaker: characterId('ali'),
    },
    {
      type: 'dialogue',
      body: dialogue.basraReunion.salimSummons,
      position: 1,
      speaker: characterId('salim'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveGold', amount: 5000 },
        { type: 'receiveFame', fame: 'trade', amount: 300 },
        { type: 'completeEvent', eventId: ALI_BASRA_REUNION_EVENT_ID },
      ],
    },
  ],
};

const istanbulGrandVizier: StoryEvent = {
  id: ALI_ENDING_EVENT_ID,
  arcId: ALI_MERCHANT_ARC_ID,
  priority: 0.907,
  trigger: exactScene('3', '6', completed(ALI_BASRA_REUNION_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.istanbulGrandVizier.sashaPride,
      position: 1,
      speaker: characterId('sasha'),
    },
    {
      type: 'dialogue',
      body: dialogue.istanbulGrandVizier.salimToast,
      position: 1,
      speaker: characterId('salim'),
    },
    {
      type: 'dialogue',
      body: dialogue.istanbulGrandVizier.aliFinale,
      position: 2,
      speaker: characterId('ali'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveGold', amount: 20000 },
        { type: 'receiveFame', fame: 'trade', amount: 600 },
        { type: 'completeEvent', eventId: ALI_ENDING_EVENT_ID },
      ],
    },
  ],
};

export const aliMerchantEvents: StoryEvent[] = [
  istanbulWindfall,
  alexandriaSpice,
  lisbonSearch,
  adenCorsairs,
  adenCorsairsRetry,
  basraReunion,
  istanbulGrandVizier,
];

export default aliMerchantEvents;
