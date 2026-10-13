import {
  characterId,
  storyArcId,
  storyEventId,
  type StoryCondition,
  type StoryEvent,
  type StoryEventId,
} from '../../../../core/types';
import { katarinaVengeanceDialogue as dialogue } from './dialogue';

export const KATARINA_VENGEANCE_ARC_ID = storyArcId('katarina.vengeance');

const eventId = (suffix: string) =>
  storyEventId(`katarina.vengeance.${suffix}`);

export const KATARINA_SEVILLE_MUTINY_EVENT_ID = eventId('seville-mutiny');
export const KATARINA_SPANISH_PURSUIT_EVENT_ID = eventId('spanish-pursuit');
export const KATARINA_SPANISH_PURSUIT_RETRY_EVENT_ID = eventId(
  'spanish-pursuit-retry',
);
export const KATARINA_CEUTA_CLASH_EVENT_ID = eventId('ceuta-clash');
export const KATARINA_CEUTA_CLASH_RETRY_EVENT_ID = eventId('ceuta-clash-retry');
export const KATARINA_MASSAWA_TRUTH_EVENT_ID = eventId('massawa-truth');
export const KATARINA_CAYENNE_RESCUE_EVENT_ID = eventId('cayenne-rescue');
export const KATARINA_CAYENNE_RESCUE_RETRY_EVENT_ID = eventId(
  'cayenne-rescue-retry',
);
export const KATARINA_AMAZON_RECKONING_EVENT_ID = eventId('amazon-reckoning');
export const KATARINA_AMAZON_RECKONING_RETRY_EVENT_ID = eventId(
  'amazon-reckoning-retry',
);
export const KATARINA_ENDING_EVENT_ID = eventId('seville-homecoming');

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

const sevilleMutiny: StoryEvent = {
  id: KATARINA_SEVILLE_MUTINY_EVENT_ID,
  arcId: KATARINA_VENGEANCE_ARC_ID,
  priority: 0.501,
  trigger: exactScene('2', '4'),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.sevilleMutiny.emilioNews,
      position: 1,
      speaker: characterId('emilio'),
    },
    {
      type: 'dialogue',
      body: dialogue.sevilleMutiny.katarinaVow,
      position: 2,
      speaker: characterId('katarina'),
    },
    {
      type: 'dialogue',
      body: dialogue.sevilleMutiny.emilioPledge,
      position: 1,
      speaker: characterId('emilio'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveShip', shipId: '9', name: 'Rebellion' },
        { type: 'addCompanion', characterId: characterId('emilio') },
        { type: 'assignMate', characterId: characterId('katarina'), role: 0 },
        {
          type: 'assignMate',
          characterId: characterId('emilio'),
          role: 'firstMate',
        },
        { type: 'receiveGold', amount: 2000 },
        { type: 'receiveItem', itemId: '4' },
        { type: 'completeEvent', eventId: KATARINA_SEVILLE_MUTINY_EVENT_ID },
      ],
    },
  ],
};

const spanishPursuit: StoryEvent = {
  id: KATARINA_SPANISH_PURSUIT_EVENT_ID,
  arcId: KATARINA_VENGEANCE_ARC_ID,
  priority: 0.502,
  trigger: {
    type: 'all',
    conditions: [
      { type: 'stage', stage: 'world' },
      completed(KATARINA_SEVILLE_MUTINY_EVENT_ID),
      { type: 'daysAtSea', min: 1 },
    ],
  },
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.spanishPursuit.challenge,
      position: 1,
      speaker: characterId('ezequiel'),
    },
    {
      type: 'dialogue',
      body: dialogue.spanishPursuit.katarinaReply,
      position: 2,
      speaker: characterId('katarina'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: KATARINA_SPANISH_PURSUIT_EVENT_ID },
        { type: 'startCombat', encounterId: 'katarina.seville-patrol' },
      ],
    },
  ],
};

const spanishPursuitRetry: StoryEvent = {
  id: KATARINA_SPANISH_PURSUIT_RETRY_EVENT_ID,
  arcId: KATARINA_VENGEANCE_ARC_ID,
  priority: 0.503,
  trigger: exactScene(
    '2',
    '4',
    completed(KATARINA_SPANISH_PURSUIT_EVENT_ID),
    notCompleted(KATARINA_CEUTA_CLASH_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'katarina.seville-patrol',
      outcomes: ['defeat', 'retreat'],
    },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.spanishPursuitRetry.recovery,
      position: 1,
      speaker: characterId('emilio'),
    },
    {
      type: 'choice',
      prompt: dialogue.spanishPursuitRetry.prompt,
      position: 1,
      speaker: characterId('emilio'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.spanishPursuitRetry.accept,
              position: 2,
              speaker: characterId('katarina'),
            },
            {
              type: 'effect',
              effects: [
                { type: 'startCombat', encounterId: 'katarina.seville-patrol' },
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
              body: dialogue.spanishPursuitRetry.defer,
              position: 1,
              speaker: characterId('emilio'),
            },
          ],
        },
      ],
    },
  ],
};

const ceutaClash: StoryEvent = {
  id: KATARINA_CEUTA_CLASH_EVENT_ID,
  arcId: KATARINA_VENGEANCE_ARC_ID,
  priority: 0.504,
  trigger: exactScene('27', '2', completed(KATARINA_SPANISH_PURSUIT_EVENT_ID), {
    type: 'combatResolved',
    encounterId: 'katarina.seville-patrol',
    outcomes: ['victory'],
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.ceutaClash.emilioScout,
      position: 1,
      speaker: characterId('emilio'),
    },
    {
      type: 'dialogue',
      body: dialogue.ceutaClash.katarinaOrder,
      position: 2,
      speaker: characterId('katarina'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: KATARINA_CEUTA_CLASH_EVENT_ID },
        { type: 'startCombat', encounterId: 'katarina.joao-fleet' },
      ],
    },
  ],
};

const ceutaClashRetry: StoryEvent = {
  id: KATARINA_CEUTA_CLASH_RETRY_EVENT_ID,
  arcId: KATARINA_VENGEANCE_ARC_ID,
  priority: 0.505,
  trigger: exactScene(
    '27',
    '4',
    completed(KATARINA_CEUTA_CLASH_EVENT_ID),
    notCompleted(KATARINA_MASSAWA_TRUTH_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'katarina.joao-fleet',
      outcomes: ['defeat', 'retreat'],
    },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.ceutaClashRetry.recovery,
      position: 1,
      speaker: characterId('emilio'),
    },
    {
      type: 'choice',
      prompt: dialogue.ceutaClashRetry.prompt,
      position: 1,
      speaker: characterId('emilio'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.ceutaClashRetry.accept,
              position: 2,
              speaker: characterId('katarina'),
            },
            {
              type: 'effect',
              effects: [
                { type: 'startCombat', encounterId: 'katarina.joao-fleet' },
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
              body: dialogue.ceutaClashRetry.defer,
              position: 1,
              speaker: characterId('emilio'),
            },
          ],
        },
      ],
    },
  ],
};

const massawaTruth: StoryEvent = {
  id: KATARINA_MASSAWA_TRUTH_EVENT_ID,
  arcId: KATARINA_VENGEANCE_ARC_ID,
  priority: 0.506,
  trigger: exactScene('75', '2', completed(KATARINA_CEUTA_CLASH_EVENT_ID), {
    type: 'combatResolved',
    encounterId: 'katarina.joao-fleet',
    outcomes: ['victory'],
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.massawaTruth.joaoPlea,
      position: 1,
      speaker: characterId('joao'),
    },
    {
      type: 'dialogue',
      body: dialogue.massawaTruth.roccoProof,
      position: 1,
      speaker: characterId('rocco'),
    },
    {
      type: 'dialogue',
      body: dialogue.massawaTruth.katarinaRealization,
      position: 2,
      speaker: characterId('katarina'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveFame', fame: 'pirate', amount: 200 },
        { type: 'receiveGold', amount: 3000 },
        { type: 'completeEvent', eventId: KATARINA_MASSAWA_TRUTH_EVENT_ID },
      ],
    },
  ],
};

const cayenneRescue: StoryEvent = {
  id: KATARINA_CAYENNE_RESCUE_EVENT_ID,
  arcId: KATARINA_VENGEANCE_ARC_ID,
  priority: 0.507,
  trigger: exactScene('57', '5', completed(KATARINA_MASSAWA_TRUTH_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.cayenneRescue.emilioCaptured,
      position: 1,
      speaker: characterId('emilio'),
    },
    {
      type: 'dialogue',
      body: dialogue.cayenneRescue.katarinaChallenge,
      position: 2,
      speaker: characterId('katarina'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: KATARINA_CAYENNE_RESCUE_EVENT_ID },
        { type: 'startCombat', encounterId: 'katarina.cayenne-duel' },
      ],
    },
  ],
};

const cayenneRescueRetry: StoryEvent = {
  id: KATARINA_CAYENNE_RESCUE_RETRY_EVENT_ID,
  arcId: KATARINA_VENGEANCE_ARC_ID,
  priority: 0.508,
  trigger: exactScene(
    '57',
    '5',
    completed(KATARINA_CAYENNE_RESCUE_EVENT_ID),
    notCompleted(KATARINA_AMAZON_RECKONING_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'katarina.cayenne-duel',
      outcomes: ['defeat', 'draw'],
    },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.cayenneRescueRetry.recovery,
      position: 1,
      speaker: characterId('emilio'),
    },
    {
      type: 'choice',
      prompt: dialogue.cayenneRescueRetry.prompt,
      position: 1,
      speaker: characterId('emilio'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.cayenneRescueRetry.accept,
              position: 2,
              speaker: characterId('katarina'),
            },
            {
              type: 'effect',
              effects: [
                { type: 'startCombat', encounterId: 'katarina.cayenne-duel' },
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
              body: dialogue.cayenneRescueRetry.defer,
              position: 1,
              speaker: characterId('emilio'),
            },
          ],
        },
      ],
    },
  ],
};

const amazonReckoning: StoryEvent = {
  id: KATARINA_AMAZON_RECKONING_EVENT_ID,
  arcId: KATARINA_VENGEANCE_ARC_ID,
  priority: 0.509,
  trigger: exactScene(
    '57',
    '4',
    completed(KATARINA_CAYENNE_RESCUE_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'katarina.cayenne-duel',
      outcomes: ['victory'],
    },
    { type: 'hasDiscovery', discoveryId: 'mouth-of-the-amazon' },
  ),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.amazonReckoning.martinezTaunt,
      position: 1,
      speaker: characterId('martinez'),
    },
    {
      type: 'dialogue',
      body: dialogue.amazonReckoning.katarinaCharge,
      position: 2,
      speaker: characterId('katarina'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: KATARINA_AMAZON_RECKONING_EVENT_ID },
        { type: 'startCombat', encounterId: 'katarina.amazon-martinez' },
      ],
    },
  ],
};

const amazonReckoningRetry: StoryEvent = {
  id: KATARINA_AMAZON_RECKONING_RETRY_EVENT_ID,
  arcId: KATARINA_VENGEANCE_ARC_ID,
  priority: 0.51,
  trigger: exactScene(
    '57',
    '4',
    completed(KATARINA_AMAZON_RECKONING_EVENT_ID),
    notCompleted(KATARINA_ENDING_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'katarina.amazon-martinez',
      outcomes: ['defeat', 'retreat', 'draw'],
    },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.amazonReckoningRetry.recovery,
      position: 1,
      speaker: characterId('emilio'),
    },
    {
      type: 'choice',
      prompt: dialogue.amazonReckoningRetry.prompt,
      position: 1,
      speaker: characterId('emilio'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.amazonReckoningRetry.accept,
              position: 2,
              speaker: characterId('katarina'),
            },
            {
              type: 'effect',
              effects: [
                {
                  type: 'startCombat',
                  encounterId: 'katarina.amazon-martinez',
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
              body: dialogue.amazonReckoningRetry.defer,
              position: 1,
              speaker: characterId('emilio'),
            },
          ],
        },
      ],
    },
  ],
};

const sevilleHomecoming: StoryEvent = {
  id: KATARINA_ENDING_EVENT_ID,
  arcId: KATARINA_VENGEANCE_ARC_ID,
  priority: 0.511,
  trigger: exactScene('2', '6', completed(KATARINA_AMAZON_RECKONING_EVENT_ID), {
    type: 'combatResolved',
    encounterId: 'katarina.amazon-martinez',
    outcomes: ['victory'],
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.sevilleHomecoming.ezequielPardon,
      position: 1,
      speaker: characterId('ezequiel'),
    },
    {
      type: 'dialogue',
      body: dialogue.sevilleHomecoming.emilioSalute,
      position: 2,
      speaker: characterId('emilio'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveGold', amount: 10000 },
        { type: 'receiveFame', fame: 'pirate', amount: 500 },
        { type: 'receiveFame', fame: 'adventure', amount: 300 },
        { type: 'completeEvent', eventId: KATARINA_ENDING_EVENT_ID },
      ],
    },
  ],
};

export const katarinaVengeanceEvents: StoryEvent[] = [
  sevilleMutiny,
  spanishPursuit,
  spanishPursuitRetry,
  ceutaClash,
  ceutaClashRetry,
  massawaTruth,
  cayenneRescue,
  cayenneRescueRetry,
  amazonReckoning,
  amazonReckoningRetry,
  sevilleHomecoming,
];

export default katarinaVengeanceEvents;
