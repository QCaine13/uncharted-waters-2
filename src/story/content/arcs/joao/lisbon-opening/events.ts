import {
  legacyQuestId,
  storyArcId,
  storyEventId,
  type StoryCondition,
  type StoryEvent,
  type StoryStep,
} from '../../../../core/types';
import {
  legacyToSemanticEvent,
  lisbonOpeningDialogue,
  type LegacyLisbonKey,
} from './dialogue';

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const lisbonOpeningArcId = storyArcId('joao.lisbon-opening');

type Gates = {
  blockedBy?: LegacyLisbonKey[];
  requires?: LegacyLisbonKey[];
  timeWindow?: { min: number; max: number };
};

const onceKeys = new Set<LegacyLisbonKey>([
  'houseBeforeQuest',
  'houseAfterQuestAndPub',
  'pubBeforeQuest',
  'pubAfterQuest',
  'itemShopAfterQuest',
  'shipyardAfterQuest',
  'churchBeforeQuest',
  'churchAfterQuest',
  'churchAfterEnrico',
  'harborFinal',
]);

const completed = (key: LegacyLisbonKey): StoryCondition => ({
  type: 'eventCompleted',
  eventId: storyEventId(legacyToSemanticEvent[key]),
});

const eventTrigger = (
  buildingId: string,
  { blockedBy = [], requires = [], timeWindow }: Gates = {},
): StoryCondition => ({
  type: 'all',
  conditions: [
    { type: 'atPort', portId: '1' },
    { type: 'stage', stage: 'building' },
    { type: 'atBuilding', buildingId },
    ...blockedBy.map(
      (key): StoryCondition => ({ type: 'not', condition: completed(key) }),
    ),
    ...requires.map(completed),
    ...(timeWindow === undefined
      ? []
      : [{ type: 'timeWindow', ...timeWindow } as StoryCondition]),
  ],
});

const storyEvent = (
  key: LegacyLisbonKey,
  buildingId: string,
  priority: number,
  gates: Gates = {},
): StoryEvent => {
  const repeat = onceKeys.has(key) ? 'once' : 'repeatable';
  return {
    id: storyEventId(legacyToSemanticEvent[key]),
    arcId: lisbonOpeningArcId,
    priority,
    trigger: eventTrigger(buildingId, gates),
    repeat,
    steps: lisbonOpeningDialogue[key],
    ...(repeat === 'once' ? { legacyCompletionKey: legacyQuestId(key) } : {}),
  };
};

type AmbientBuilding = '5' | '7' | '9';
type AmbientPhase = 'before' | 'after';

const ambientEvent = (
  key: LegacyLisbonKey,
  buildingId: AmbientBuilding,
  priority: number,
  phase: AmbientPhase,
): StoryEvent => {
  const buildingName = { '5': 'lodge', '7': 'bank', '9': 'guild' }[buildingId];
  const baseId = legacyToSemanticEvent[key];
  const steps: StoryStep[] =
    phase === 'before' && buildingId !== '5'
      ? [
          ...lisbonOpeningDialogue[key],
          { type: 'effect', effects: [{ type: 'exitBuilding' }] },
        ]
      : lisbonOpeningDialogue[key];

  return {
    id: storyEventId(buildingId === '5' ? baseId : `${baseId}.${buildingName}`),
    arcId: lisbonOpeningArcId,
    priority,
    trigger: eventTrigger(
      buildingId,
      phase === 'before' ? { blockedBy: ['houseBeforeQuest'] } : {},
    ),
    repeat: 'random-ambient',
    randomGroup: `joao.lisbon-opening.ambient-${phase}.${buildingName}`,
    steps,
  };
};

const ambientEvents = (buildingId: AmbientBuilding): StoryEvent[] => [
  ambientEvent('lodgeBankGuildBeforeQuestRandom1', buildingId, 10, 'before'),
  ambientEvent('lodgeBankGuildBeforeQuestRandom2', buildingId, 10, 'before'),
  ambientEvent('lodgeBankGuildBeforeQuestRandom3', buildingId, 10, 'before'),
  ambientEvent('lodgeBankGuildAfterQuestRandom1', buildingId, 20, 'after'),
  ambientEvent('lodgeBankGuildAfterQuestRandom2', buildingId, 20, 'after'),
  ambientEvent('lodgeBankGuildAfterQuestRandom3', buildingId, 20, 'after'),
];

export const lisbonOpeningEvents: StoryEvent[] = deepFreeze([
  storyEvent('houseBeforeQuest', '8', 10, {
    blockedBy: ['houseBeforeQuest'],
  }),
  storyEvent('houseAfterQuestAndPub', '8', 20, {
    blockedBy: ['houseAfterQuestAndPub'],
    requires: ['pubAfterQuest'],
    timeWindow: { min: 1320, max: 0 },
  }),
  storyEvent('houseAfterQuest', '8', 30, {
    blockedBy: ['houseAfterQuestAndPub'],
  }),
  storyEvent('houseAfterQuestAndPub2', '8', 40),

  storyEvent('pubBeforeQuest', '2', 10, {
    blockedBy: ['houseBeforeQuest', 'pubBeforeQuest'],
  }),
  storyEvent('pubBeforeQuest2', '2', 20, {
    blockedBy: ['houseBeforeQuest'],
  }),
  storyEvent('pubAfterQuest', '2', 30, {
    blockedBy: ['pubAfterQuest'],
  }),
  storyEvent('pubAfterQuest2', '2', 40, {
    blockedBy: ['houseAfterQuestAndPub'],
  }),
  storyEvent('pubCarlottaGreeting', '2', 50),

  ...ambientEvents('5'),
  ...ambientEvents('7'),
  ...ambientEvents('9'),

  storyEvent('palaceBeforeQuest', '6', 10, {
    blockedBy: ['houseBeforeQuest'],
  }),
  storyEvent('palaceAfterQuest', '6', 20),

  storyEvent('itemShopBeforeQuest', '10', 10, {
    blockedBy: ['houseBeforeQuest'],
  }),
  storyEvent('itemShopAfterQuest', '10', 20, {
    blockedBy: ['itemShopAfterQuest'],
  }),
  storyEvent('itemShopAfterQuest2', '10', 30),

  storyEvent('shipyardBeforeQuest', '3', 10, {
    blockedBy: ['houseBeforeQuest'],
  }),
  storyEvent('shipyardAfterQuest', '3', 20, {
    blockedBy: ['shipyardAfterQuest'],
  }),

  storyEvent('churchBeforeQuest', '11', 10, {
    blockedBy: ['houseBeforeQuest', 'churchBeforeQuest'],
  }),
  storyEvent('churchBeforeQuest2', '11', 20, {
    blockedBy: ['houseBeforeQuest'],
  }),
  storyEvent('churchAfterQuest', '11', 30, {
    blockedBy: ['churchAfterEnrico', 'churchAfterQuest'],
  }),
  storyEvent('churchAfterEnrico', '11', 40, {
    blockedBy: ['churchAfterEnrico'],
  }),
  storyEvent('churchAfterEnricoAfterGift', '11', 50),

  storyEvent('marketBeforeQuest', '1', 10, {
    blockedBy: ['houseBeforeQuest'],
  }),
  storyEvent('marketAfterQuestBeforeShip', '1', 20, {
    blockedBy: ['shipyardAfterQuest'],
  }),

  storyEvent('harborBeforeQuest', '4', 10, {
    blockedBy: ['houseBeforeQuest'],
  }),
  storyEvent('harborBeforeShip', '4', 20, {
    blockedBy: ['shipyardAfterQuest'],
  }),
  storyEvent('harborBeforeEnrico', '4', 30, {
    blockedBy: ['churchAfterQuest'],
  }),
  storyEvent('harborAfterEnrico', '4', 40, {
    blockedBy: ['pubAfterQuest', 'churchAfterEnrico'],
  }),
  storyEvent('harborAfterEnrico2', '4', 50, {
    blockedBy: ['pubAfterQuest'],
  }),
  storyEvent('harborAfterEnricoBeforeMother', '4', 60, {
    blockedBy: ['houseAfterQuestAndPub'],
  }),
  storyEvent('harborFinal', '4', 70, {
    blockedBy: ['harborFinal'],
  }),
]);

export default lisbonOpeningEvents;
