import {
  characterId,
  storyArcId,
  storyEventId,
  type StoryCondition,
  type StoryEvent,
  type StoryEventId,
} from '../../../../core/types';
import { ernstWorldmapDialogue as dialogue } from './dialogue';

export const ERNST_WORLDMAP_ARC_ID = storyArcId('ernst.worldmap');

const eventId = (suffix: string) => storyEventId(`ernst.worldmap.${suffix}`);

export const ERNST_AMSTERDAM_COMMISSION_EVENT_ID = eventId(
  'amsterdam-commission',
);
export const ERNST_LISBON_INTERPRETER_EVENT_ID = eventId('lisbon-interpreter');
export const ERNST_CAPE_SURVEY_EVENT_ID = eventId('cape-survey');
export const ERNST_MALACCA_STRAITS_EVENT_ID = eventId('malacca-straits');
export const ERNST_MALACCA_STRAITS_RETRY_EVENT_ID = eventId(
  'malacca-straits-retry',
);
export const ERNST_NAGASAKI_HOMELAND_EVENT_ID = eventId('nagasaki-homeland');
export const ERNST_ENDING_EVENT_ID = eventId('amsterdam-atlas');

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

const amsterdamCommission: StoryEvent = {
  id: ERNST_AMSTERDAM_COMMISSION_EVENT_ID,
  arcId: ERNST_WORLDMAP_ARC_ID,
  priority: 0.801,
  trigger: exactScene('34', '8'),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.amsterdamCommission.mercatorCommission,
      position: 1,
      speaker: characterId('mercator'),
    },
    {
      type: 'dialogue',
      body: dialogue.amsterdamCommission.hansExcitement,
      position: 1,
      speaker: characterId('hans'),
    },
    {
      type: 'dialogue',
      body: dialogue.amsterdamCommission.ernstVow,
      position: 2,
      speaker: characterId('ernst'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveShip', shipId: '13', name: 'Golden Hind' },
        { type: 'addCompanion', characterId: characterId('hans') },
        { type: 'assignMate', characterId: characterId('ernst'), role: 0 },
        {
          type: 'assignMate',
          characterId: characterId('hans'),
          role: 'chiefNavigator',
        },
        { type: 'receiveGold', amount: 2500 },
        { type: 'receiveItem', itemId: '21' },
        {
          type: 'completeEvent',
          eventId: ERNST_AMSTERDAM_COMMISSION_EVENT_ID,
        },
      ],
    },
  ],
};

const lisbonInterpreter: StoryEvent = {
  id: ERNST_LISBON_INTERPRETER_EVENT_ID,
  arcId: ERNST_WORLDMAP_ARC_ID,
  priority: 0.802,
  trigger: exactScene('1', '4', completed(ERNST_AMSTERDAM_COMMISSION_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.lisbonInterpreter.lauraGreeting,
      position: 1,
      speaker: characterId('laura'),
    },
    {
      type: 'dialogue',
      body: dialogue.lisbonInterpreter.hansApproval,
      position: 1,
      speaker: characterId('hans'),
    },
    {
      type: 'dialogue',
      body: dialogue.lisbonInterpreter.ernstWelcome,
      position: 2,
      speaker: characterId('ernst'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'addCompanion', characterId: characterId('laura') },
        {
          type: 'assignMate',
          characterId: characterId('laura'),
          role: 'bookKeeper',
        },
        { type: 'receiveFame', fame: 'adventure', amount: 100 },
        {
          type: 'completeEvent',
          eventId: ERNST_LISBON_INTERPRETER_EVENT_ID,
        },
      ],
    },
  ],
};

const capeSurvey: StoryEvent = {
  id: ERNST_CAPE_SURVEY_EVENT_ID,
  arcId: ERNST_WORLDMAP_ARC_ID,
  priority: 0.803,
  trigger: exactScene('75', '7', completed(ERNST_LISBON_INTERPRETER_EVENT_ID), {
    type: 'hasDiscovery',
    discoveryId: 'cape-of-good-hope',
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.capeSurvey.hansReport,
      position: 1,
      speaker: characterId('hans'),
    },
    {
      type: 'dialogue',
      body: dialogue.capeSurvey.ernstNextCourse,
      position: 2,
      speaker: characterId('ernst'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveGold', amount: 3000 },
        { type: 'receiveFame', fame: 'adventure', amount: 200 },
        { type: 'completeEvent', eventId: ERNST_CAPE_SURVEY_EVENT_ID },
      ],
    },
  ],
};

const malaccaStraits: StoryEvent = {
  id: ERNST_MALACCA_STRAITS_EVENT_ID,
  arcId: ERNST_WORLDMAP_ARC_ID,
  priority: 0.804,
  trigger: exactScene('87', '4', completed(ERNST_CAPE_SURVEY_EVENT_ID), {
    type: 'hasDiscovery',
    discoveryId: 'strait-of-malacca',
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.malaccaStraits.hansAlert,
      position: 1,
      speaker: characterId('hans'),
    },
    {
      type: 'dialogue',
      body: dialogue.malaccaStraits.ernstResolve,
      position: 2,
      speaker: characterId('ernst'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: ERNST_MALACCA_STRAITS_EVENT_ID },
        { type: 'startCombat', encounterId: 'ernst.eastern-corsairs' },
      ],
    },
  ],
};

const malaccaStraitsRetry: StoryEvent = {
  id: ERNST_MALACCA_STRAITS_RETRY_EVENT_ID,
  arcId: ERNST_WORLDMAP_ARC_ID,
  priority: 0.805,
  trigger: exactScene(
    '87',
    '4',
    completed(ERNST_MALACCA_STRAITS_EVENT_ID),
    notCompleted(ERNST_NAGASAKI_HOMELAND_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'ernst.eastern-corsairs',
      outcomes: ['defeat', 'retreat', 'draw'],
    },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.malaccaStraitsRetry.recovery,
      position: 1,
      speaker: characterId('hans'),
    },
    {
      type: 'choice',
      prompt: dialogue.malaccaStraitsRetry.prompt,
      position: 1,
      speaker: characterId('hans'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.malaccaStraitsRetry.accept,
              position: 2,
              speaker: characterId('ernst'),
            },
            {
              type: 'effect',
              effects: [
                { type: 'startCombat', encounterId: 'ernst.eastern-corsairs' },
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
              body: dialogue.malaccaStraitsRetry.defer,
              position: 1,
              speaker: characterId('hans'),
            },
          ],
        },
      ],
    },
  ],
};

const nagasakiHomeland: StoryEvent = {
  id: ERNST_NAGASAKI_HOMELAND_EVENT_ID,
  arcId: ERNST_WORLDMAP_ARC_ID,
  priority: 0.806,
  trigger: exactScene('100', '8', completed(ERNST_MALACCA_STRAITS_EVENT_ID), {
    type: 'combatResolved',
    encounterId: 'ernst.eastern-corsairs',
    outcomes: ['victory'],
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.nagasakiHomeland.lauraRecognition,
      position: 1,
      speaker: characterId('laura'),
    },
    {
      type: 'dialogue',
      body: dialogue.nagasakiHomeland.ernstKindness,
      position: 2,
      speaker: characterId('ernst'),
    },
    {
      type: 'dialogue',
      body: dialogue.nagasakiHomeland.lauraPromise,
      position: 1,
      speaker: characterId('laura'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveGold', amount: 5000 },
        { type: 'receiveFame', fame: 'adventure', amount: 300 },
        { type: 'completeEvent', eventId: ERNST_NAGASAKI_HOMELAND_EVENT_ID },
      ],
    },
  ],
};

const amsterdamAtlas: StoryEvent = {
  id: ERNST_ENDING_EVENT_ID,
  arcId: ERNST_WORLDMAP_ARC_ID,
  priority: 0.807,
  trigger: exactScene('34', '8', completed(ERNST_NAGASAKI_HOMELAND_EVENT_ID), {
    type: 'hasDiscovery',
    discoveryId: 'mouth-of-the-amazon',
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.amsterdamAtlas.mercatorPraise,
      position: 1,
      speaker: characterId('mercator'),
    },
    {
      type: 'dialogue',
      body: dialogue.amsterdamAtlas.lauraReflection,
      position: 1,
      speaker: characterId('laura'),
    },
    {
      type: 'dialogue',
      body: dialogue.amsterdamAtlas.ernstHorizon,
      position: 2,
      speaker: characterId('ernst'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveGold', amount: 12000 },
        { type: 'receiveFame', fame: 'adventure', amount: 600 },
        { type: 'completeEvent', eventId: ERNST_ENDING_EVENT_ID },
      ],
    },
  ],
};

export const ernstWorldmapEvents: StoryEvent[] = [
  amsterdamCommission,
  lisbonInterpreter,
  capeSurvey,
  malaccaStraits,
  malaccaStraitsRetry,
  nagasakiHomeland,
  amsterdamAtlas,
];

export default ernstWorldmapEvents;
