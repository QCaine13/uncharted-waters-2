import {
  characterId,
  storyArcId,
  storyEventId,
  type StoryCondition,
  type StoryEvent,
  type StoryEventId,
} from '../../../../core/types';
import { ottoArmadaDialogue as dialogue } from './dialogue';

export const OTTO_ARMADA_ARC_ID = storyArcId('otto.armada');

const eventId = (suffix: string) => storyEventId(`otto.armada.${suffix}`);

export const OTTO_LONDON_COMMISSION_EVENT_ID = eventId('london-commission');
export const OTTO_SEVILLE_INFILTRATION_EVENT_ID = eventId(
  'seville-infiltration',
);
export const OTTO_CEUTA_SKIRMISH_EVENT_ID = eventId('ceuta-skirmish');
export const OTTO_CEUTA_SKIRMISH_RETRY_EVENT_ID = eventId(
  'ceuta-skirmish-retry',
);
export const OTTO_SANTO_DOMINGO_RAID_EVENT_ID = eventId('santo-domingo-raid');
export const OTTO_SANTO_DOMINGO_RAID_RETRY_EVENT_ID = eventId(
  'santo-domingo-raid-retry',
);
export const OTTO_NANTES_SHOWDOWN_EVENT_ID = eventId('nantes-showdown');
export const OTTO_NANTES_SHOWDOWN_RETRY_EVENT_ID = eventId(
  'nantes-showdown-retry',
);
export const OTTO_ENDING_EVENT_ID = eventId('london-triumph');

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

const londonCommission: StoryEvent = {
  id: OTTO_LONDON_COMMISSION_EVENT_ID,
  arcId: OTTO_ARMADA_ARC_ID,
  priority: 0.701,
  trigger: exactScene('30', '6'),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.londonCommission.matthewSummons,
      position: 1,
      speaker: characterId('matthew'),
    },
    {
      type: 'dialogue',
      body: dialogue.londonCommission.ottoPledge,
      position: 2,
      speaker: characterId('otto'),
    },
    {
      type: 'dialogue',
      body: dialogue.londonCommission.matthewReady,
      position: 1,
      speaker: characterId('matthew'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveItem', itemId: '28' },
        { type: 'receiveShip', shipId: '7', name: 'HMS Eagle' },
        { type: 'addCompanion', characterId: characterId('matthew') },
        { type: 'assignMate', characterId: characterId('otto'), role: 0 },
        {
          type: 'assignMate',
          characterId: characterId('matthew'),
          role: 'firstMate',
        },
        { type: 'receiveGold', amount: 2000 },
        { type: 'completeEvent', eventId: OTTO_LONDON_COMMISSION_EVENT_ID },
      ],
    },
  ],
};

const sevilleInfiltration: StoryEvent = {
  id: OTTO_SEVILLE_INFILTRATION_EVENT_ID,
  arcId: OTTO_ARMADA_ARC_ID,
  priority: 0.702,
  trigger: exactScene('2', '3', completed(OTTO_LONDON_COMMISSION_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.sevilleInfiltration.matthewWhisper,
      position: 1,
      speaker: characterId('matthew'),
    },
    {
      type: 'dialogue',
      body: dialogue.sevilleInfiltration.ottoCommand,
      position: 2,
      speaker: characterId('otto'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveShip', shipId: '11', name: 'Spanish Galleon' },
        { type: 'receiveFame', fame: 'pirate', amount: 150 },
        { type: 'completeEvent', eventId: OTTO_SEVILLE_INFILTRATION_EVENT_ID },
      ],
    },
  ],
};

const ceutaSkirmish: StoryEvent = {
  id: OTTO_CEUTA_SKIRMISH_EVENT_ID,
  arcId: OTTO_ARMADA_ARC_ID,
  priority: 0.703,
  trigger: exactScene('27', '4', completed(OTTO_SEVILLE_INFILTRATION_EVENT_ID)),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.ceutaSkirmish.ezequielWarning,
      position: 1,
      speaker: characterId('ezequiel'),
    },
    {
      type: 'dialogue',
      body: dialogue.ceutaSkirmish.ottoReply,
      position: 2,
      speaker: characterId('otto'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: OTTO_CEUTA_SKIRMISH_EVENT_ID },
        { type: 'startCombat', encounterId: 'otto.spanish-vanguard' },
      ],
    },
  ],
};

const ceutaSkirmishRetry: StoryEvent = {
  id: OTTO_CEUTA_SKIRMISH_RETRY_EVENT_ID,
  arcId: OTTO_ARMADA_ARC_ID,
  priority: 0.704,
  trigger: exactScene(
    '27',
    '4',
    completed(OTTO_CEUTA_SKIRMISH_EVENT_ID),
    notCompleted(OTTO_SANTO_DOMINGO_RAID_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'otto.spanish-vanguard',
      outcomes: ['defeat', 'retreat'],
    },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.ceutaSkirmishRetry.recovery,
      position: 1,
      speaker: characterId('matthew'),
    },
    {
      type: 'choice',
      prompt: dialogue.ceutaSkirmishRetry.prompt,
      position: 1,
      speaker: characterId('matthew'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.ceutaSkirmishRetry.accept,
              position: 2,
              speaker: characterId('otto'),
            },
            {
              type: 'effect',
              effects: [
                { type: 'startCombat', encounterId: 'otto.spanish-vanguard' },
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
              body: dialogue.ceutaSkirmishRetry.defer,
              position: 1,
              speaker: characterId('matthew'),
            },
          ],
        },
      ],
    },
  ],
};

const santoDomingoRaid: StoryEvent = {
  id: OTTO_SANTO_DOMINGO_RAID_EVENT_ID,
  arcId: OTTO_ARMADA_ARC_ID,
  priority: 0.705,
  trigger: exactScene('49', '4', completed(OTTO_CEUTA_SKIRMISH_EVENT_ID), {
    type: 'combatResolved',
    encounterId: 'otto.spanish-vanguard',
    outcomes: ['victory'],
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.santoDomingoRaid.matthewScout,
      position: 1,
      speaker: characterId('matthew'),
    },
    {
      type: 'dialogue',
      body: dialogue.santoDomingoRaid.ottoOrder,
      position: 2,
      speaker: characterId('otto'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: OTTO_SANTO_DOMINGO_RAID_EVENT_ID },
        { type: 'startCombat', encounterId: 'otto.caribbean-convoy' },
      ],
    },
  ],
};

const santoDomingoRaidRetry: StoryEvent = {
  id: OTTO_SANTO_DOMINGO_RAID_RETRY_EVENT_ID,
  arcId: OTTO_ARMADA_ARC_ID,
  priority: 0.706,
  trigger: exactScene(
    '49',
    '4',
    completed(OTTO_SANTO_DOMINGO_RAID_EVENT_ID),
    notCompleted(OTTO_NANTES_SHOWDOWN_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'otto.caribbean-convoy',
      outcomes: ['defeat', 'retreat'],
    },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.santoDomingoRaidRetry.recovery,
      position: 1,
      speaker: characterId('matthew'),
    },
    {
      type: 'choice',
      prompt: dialogue.santoDomingoRaidRetry.prompt,
      position: 1,
      speaker: characterId('matthew'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.santoDomingoRaidRetry.accept,
              position: 2,
              speaker: characterId('otto'),
            },
            {
              type: 'effect',
              effects: [
                { type: 'startCombat', encounterId: 'otto.caribbean-convoy' },
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
              body: dialogue.santoDomingoRaidRetry.defer,
              position: 1,
              speaker: characterId('matthew'),
            },
          ],
        },
      ],
    },
  ],
};

const nantesShowdown: StoryEvent = {
  id: OTTO_NANTES_SHOWDOWN_EVENT_ID,
  arcId: OTTO_ARMADA_ARC_ID,
  priority: 0.707,
  trigger: exactScene('29', '4', completed(OTTO_SANTO_DOMINGO_RAID_EVENT_ID), {
    type: 'combatResolved',
    encounterId: 'otto.caribbean-convoy',
    outcomes: ['victory'],
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.nantesShowdown.ezequielChallenge,
      position: 1,
      speaker: characterId('ezequiel'),
    },
    {
      type: 'dialogue',
      body: dialogue.nantesShowdown.ottoSpeech,
      position: 2,
      speaker: characterId('otto'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'completeEvent', eventId: OTTO_NANTES_SHOWDOWN_EVENT_ID },
        { type: 'startCombat', encounterId: 'otto.invincible-armada' },
      ],
    },
  ],
};

const nantesShowdownRetry: StoryEvent = {
  id: OTTO_NANTES_SHOWDOWN_RETRY_EVENT_ID,
  arcId: OTTO_ARMADA_ARC_ID,
  priority: 0.708,
  trigger: exactScene(
    '29',
    '4',
    completed(OTTO_NANTES_SHOWDOWN_EVENT_ID),
    notCompleted(OTTO_ENDING_EVENT_ID),
    {
      type: 'combatResolved',
      encounterId: 'otto.invincible-armada',
      outcomes: ['defeat', 'retreat', 'draw'],
    },
  ),
  repeat: 'repeatable',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.nantesShowdownRetry.recovery,
      position: 1,
      speaker: characterId('matthew'),
    },
    {
      type: 'choice',
      prompt: dialogue.nantesShowdownRetry.prompt,
      position: 1,
      speaker: characterId('matthew'),
      options: [
        {
          id: 'yes',
          label: 'Yes',
          steps: [
            {
              type: 'dialogue',
              body: dialogue.nantesShowdownRetry.accept,
              position: 2,
              speaker: characterId('otto'),
            },
            {
              type: 'effect',
              effects: [
                { type: 'startCombat', encounterId: 'otto.invincible-armada' },
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
              body: dialogue.nantesShowdownRetry.defer,
              position: 1,
              speaker: characterId('matthew'),
            },
          ],
        },
      ],
    },
  ],
};

const londonTriumph: StoryEvent = {
  id: OTTO_ENDING_EVENT_ID,
  arcId: OTTO_ARMADA_ARC_ID,
  priority: 0.709,
  trigger: exactScene('30', '6', completed(OTTO_NANTES_SHOWDOWN_EVENT_ID), {
    type: 'combatResolved',
    encounterId: 'otto.invincible-armada',
    outcomes: ['victory'],
  }),
  repeat: 'once',
  steps: [
    {
      type: 'dialogue',
      body: dialogue.londonTriumph.ezequielSalute,
      position: 1,
      speaker: characterId('ezequiel'),
    },
    {
      type: 'dialogue',
      body: dialogue.londonTriumph.matthewCheer,
      position: 2,
      speaker: characterId('matthew'),
    },
    {
      type: 'effect',
      effects: [
        { type: 'receiveGold', amount: 15000 },
        { type: 'receiveFame', fame: 'pirate', amount: 600 },
        { type: 'completeEvent', eventId: OTTO_ENDING_EVENT_ID },
      ],
    },
  ],
};

export const ottoArmadaEvents: StoryEvent[] = [
  londonCommission,
  sevilleInfiltration,
  ceutaSkirmish,
  ceutaSkirmishRetry,
  santoDomingoRaid,
  santoDomingoRaidRetry,
  nantesShowdown,
  nantesShowdownRetry,
  londonTriumph,
];

export default ottoArmadaEvents;
