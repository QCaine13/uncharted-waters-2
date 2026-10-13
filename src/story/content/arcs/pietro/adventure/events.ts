import {
  characterId,
  storyArcId,
  storyEventId,
  type StoryCondition,
  type StoryEvent,
  type StoryEventId,
} from '../../../../core/types';
import { pietroAdventureDialogue as dialogue } from './dialogue';

export const PIETRO_ADVENTURE_ARC_ID = storyArcId('pietro.adventure');

const eventId = (suffix: string) => storyEventId(`pietro.adventure.${suffix}`);

export const PIETRO_GENOA_DEPARTURE_EVENT_ID = eventId('genoa-departure');
export const PIETRO_LISBON_PATRONAGE_EVENT_ID = eventId('lisbon-patronage');
export const PIETRO_ALEXANDRIA_RELIC_EVENT_ID = eventId('alexandria-relic');
export const PIETRO_BASRA_STAFF_EVENT_ID = eventId('basra-staff');
export const PIETRO_BASRA_STAFF_RETRY_EVENT_ID = eventId('basra-staff-retry');
export const PIETRO_MASSAWA_HANDOFF_EVENT_ID = eventId('massawa-handoff');
export const PIETRO_CAYENNE_FLEET_EVENT_ID = eventId('cayenne-fleet');
export const PIETRO_CAYENNE_FLEET_RETRY_EVENT_ID = eventId(
  'cayenne-fleet-retry',
);
export const PIETRO_ENDING_EVENT_ID = eventId('lisbon-triumph');

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

const genoaDeparture: StoryEvent = {
  id: PIETRO_GENOA_DEPARTURE_EVENT_ID,
  arcId: PIETRO_ADVENTURE_ARC_ID,
  priority: 0.601,
  trigger: exactScene('4', '4'),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.genoaDeparture.camilloNews,
      position: 1,
      speaker: characterId('camillo'),
    },
    {
      type: 'dialogue',
      body: dialogue.genoaDeparture.pietroResolve,
      position: 2,
      speaker: characterId('pietro'),
    },
    {
      type: 'dialogue',
      body: dialogue.genoaDeparture.camilloPledge,
      position: 1,
      speaker: characterId('camillo'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveShip', shipId: '6', name: 'Sanuto' },
        { type: 'addCompanion', characterId: characterId('camillo') },
        { type: 'assignMate', characterId: characterId('pietro'), role: 0 },
        {
          type: 'assignMate',
          characterId: characterId('camillo'),
          role: 'bookKeeper',
        },
        { type: 'receiveGold', amount: 1500 },
        { type: 'completeEvent', eventId: PIETRO_GENOA_DEPARTURE_EVENT_ID },
      ],
    },
  ],
};

const lisbonPatronage: StoryEvent = {
  id: PIETRO_LISBON_PATRONAGE_EVENT_ID,
  arcId: PIETRO_ADVENTURE_ARC_ID,
  priority: 0.602,
  trigger: exactScene('1', '8', completed(PIETRO_GENOA_DEPARTURE_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.lisbonPatronage.christianaOffer,
      position: 1,
      speaker: characterId('duchess-christiana'),
    },
    {
      type: 'dialogue',
      body: dialogue.lisbonPatronage.marcoInstruction,
      position: 1,
      speaker: characterId('butler-marco'),
    },
    {
      type: 'dialogue',
      body: dialogue.lisbonPatronage.pietroAccept,
      position: 2,
      speaker: characterId('pietro'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveGold', amount: 3000 },
        { type: 'receiveFame', fame: 'adventure', amount: 100 },
        { type: 'completeEvent', eventId: PIETRO_LISBON_PATRONAGE_EVENT_ID },
      ],
    },
  ],
};

const alexandriaRelic: StoryEvent = {
  id: PIETRO_ALEXANDRIA_RELIC_EVENT_ID,
  arcId: PIETRO_ADVENTURE_ARC_ID,
  priority: 0.603,
  trigger: exactScene('20', '2', completed(PIETRO_LISBON_PATRONAGE_EVENT_ID), {
    type: 'hasDiscovery',
    discoveryId: 'strait-of-gibraltar',
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.alexandriaRelic.camilloClue,
      position: 1,
      speaker: characterId('camillo'),
    },
    {
      type: 'dialogue',
      body: dialogue.alexandriaRelic.pietroPlan,
      position: 2,
      speaker: characterId('pietro'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveGold', amount: 2000 },
        { type: 'receiveFame', fame: 'adventure', amount: 150 },
        { type: 'completeEvent', eventId: PIETRO_ALEXANDRIA_RELIC_EVENT_ID },
      ],
    },
  ],
};

const basraStaff: StoryEvent = {
  id: PIETRO_BASRA_STAFF_EVENT_ID,
  arcId: PIETRO_ADVENTURE_ARC_ID,
  priority: 0.604,
  trigger: exactScene('78', '1', completed(PIETRO_ALEXANDRIA_RELIC_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.basraStaff.camilloWarning,
      position: 1,
      speaker: characterId('camillo'),
    },
    {
      type: 'dialogue',
      body: dialogue.basraStaff.pietroChallenge,
      position: 2,
      speaker: characterId('pietro'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: PIETRO_BASRA_STAFF_EVENT_ID },
        { type: 'startCombat', encounterId: 'pietro.basra-raider' },
      ],
    },
  ],
};

const basraStaffRetry: StoryEvent = {
  id: PIETRO_BASRA_STAFF_RETRY_EVENT_ID,
  arcId: PIETRO_ADVENTURE_ARC_ID,
  priority: 0.605,
  trigger: exactScene(
    '78',
    '1',
    completed(PIETRO_BASRA_STAFF_EVENT_ID),
    notCompleted(PIETRO_MASSAWA_HANDOFF_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'pietro.basra-raider',
      outcomes: ['defeat', 'draw'],
    },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.basraStaffRetry.recovery,
      position: 1,
      speaker: characterId('camillo'),
    },
    {
      type: 'choice',
      prompt: dialogue.basraStaffRetry.prompt,
      position: 1,
      speaker: characterId('camillo'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.basraStaffRetry.accept,
              position: 2,
              speaker: characterId('pietro'),
            },
            {
              type: 'effect',
              effects: [
                { type: 'startCombat', encounterId: 'pietro.basra-raider' },
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
              body: dialogue.basraStaffRetry.defer,
              position: 1,
              speaker: characterId('camillo'),
            },
          ],
        },
      ],
    },
  ],
};

const massawaHandoff: StoryEvent = {
  id: PIETRO_MASSAWA_HANDOFF_EVENT_ID,
  arcId: PIETRO_ADVENTURE_ARC_ID,
  priority: 0.606,
  trigger: exactScene('75', '4', completed(PIETRO_BASRA_STAFF_EVENT_ID), {
    type: 'combatResolved',
    encounterId: 'pietro.basra-raider',
    outcomes: ['victory'],
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.massawaHandoff.pietroGreeting,
      position: 2,
      speaker: characterId('pietro'),
    },
    {
      type: 'dialogue',
      body: dialogue.massawaHandoff.joaoGratitude,
      position: 1,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: dialogue.massawaHandoff.camilloExcitement,
      position: 1,
      speaker: characterId('camillo'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveItem', itemId: '54' },
        { type: 'consumeItem', itemId: '54' },
        { type: 'receiveGold', amount: 5000 },
        { type: 'receiveFame', fame: 'adventure', amount: 250 },
        { type: 'completeEvent', eventId: PIETRO_MASSAWA_HANDOFF_EVENT_ID },
      ],
    },
  ],
};

const cayenneFleet: StoryEvent = {
  id: PIETRO_CAYENNE_FLEET_EVENT_ID,
  arcId: PIETRO_ADVENTURE_ARC_ID,
  priority: 0.607,
  trigger: exactScene('57', '4', completed(PIETRO_MASSAWA_HANDOFF_EVENT_ID), {
    type: 'hasDiscovery',
    discoveryId: 'mouth-of-the-amazon',
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.cayenneFleet.camilloAlert,
      position: 1,
      speaker: characterId('camillo'),
    },
    {
      type: 'dialogue',
      body: dialogue.cayenneFleet.pietroOrder,
      position: 2,
      speaker: characterId('pietro'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: PIETRO_CAYENNE_FLEET_EVENT_ID },
        { type: 'startCombat', encounterId: 'pietro.eldorado-fleet' },
      ],
    },
  ],
};

const cayenneFleetRetry: StoryEvent = {
  id: PIETRO_CAYENNE_FLEET_RETRY_EVENT_ID,
  arcId: PIETRO_ADVENTURE_ARC_ID,
  priority: 0.608,
  trigger: exactScene(
    '57',
    '4',
    completed(PIETRO_CAYENNE_FLEET_EVENT_ID),
    notCompleted(PIETRO_ENDING_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'pietro.eldorado-fleet',
      outcomes: ['defeat', 'retreat', 'draw'],
    },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.cayenneFleetRetry.recovery,
      position: 1,
      speaker: characterId('camillo'),
    },
    {
      type: 'choice',
      prompt: dialogue.cayenneFleetRetry.prompt,
      position: 1,
      speaker: characterId('camillo'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.cayenneFleetRetry.accept,
              position: 2,
              speaker: characterId('pietro'),
            },
            {
              type: 'effect',
              effects: [
                { type: 'startCombat', encounterId: 'pietro.eldorado-fleet' },
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
              body: dialogue.cayenneFleetRetry.defer,
              position: 1,
              speaker: characterId('camillo'),
            },
          ],
        },
      ],
    },
  ],
};

const lisbonTriumph: StoryEvent = {
  id: PIETRO_ENDING_EVENT_ID,
  arcId: PIETRO_ADVENTURE_ARC_ID,
  priority: 0.609,
  trigger: exactScene('1', '8', completed(PIETRO_CAYENNE_FLEET_EVENT_ID), {
    type: 'combatResolved',
    encounterId: 'pietro.eldorado-fleet',
    outcomes: ['victory'],
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.lisbonTriumph.christianaPraise,
      position: 1,
      speaker: characterId('duchess-christiana'),
    },
    {
      type: 'dialogue',
      body: dialogue.lisbonTriumph.leonCommendation,
      position: 1,
      speaker: characterId('duke-franco'),
    },
    {
      type: 'dialogue',
      body: dialogue.lisbonTriumph.camilloToast,
      position: 2,
      speaker: characterId('camillo'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveGold', amount: 12000 },
        { type: 'receiveFame', fame: 'adventure', amount: 600 },
        { type: 'completeEvent', eventId: PIETRO_ENDING_EVENT_ID },
      ],
    },
  ],
};

export const pietroAdventureEvents: StoryEvent[] = [
  genoaDeparture,
  lisbonPatronage,
  alexandriaRelic,
  basraStaff,
  basraStaffRetry,
  massawaHandoff,
  cayenneFleet,
  cayenneFleetRetry,
  lisbonTriumph,
];

export default pietroAdventureEvents;
