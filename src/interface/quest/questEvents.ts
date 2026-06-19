import { sample } from '../../utils';
import type { FameType, Fame } from '../../state/state';
import type { QuestId } from './questData';

/*
 Data-driven replacement for the old hand-written if-else in getAvailableQuest.

 Each rule is a declarative trigger + a result. Rules are evaluated top-to-bottom
 and the first match wins, which mirrors the ordering (and implicit "else") of the
 original nested conditionals. `blockedBy` means "none of these quests are finished"
 (the original `!finishedQuest(...)` checks); `requires` means "all finished".

 This is slice 1 of the story-engine migration: a pure, behaviour-identical port of
 the existing Joao Lisbon arc. The condition vocabulary here (buildingId / blockedBy /
 requires / timeWindow) is intentionally minimal — only what the current arc uses.
 It is meant to converge later with the richer Trigger/Reward model in
 src/data/storyHooks.ts (see docs/4-engineering/quest-event-system.md, decision D5).
*/

export interface QuestContext {
  portId: string | null;
  buildingId: string | null;
  timePassed: number;
  quests: QuestId[];
  fame?: Fame;
}

// Minutes within a day [0, 1440). A window may wrap past midnight (min > max),
// in which case both ends are inclusive — this reproduces the original
// `timePassedToday >= 1320 || timePassedToday === 0` (22:00–24:00) check exactly.
interface TimeWindow {
  min: number;
  max: number;
}

// The gating conditions a rule (or, later, any StoryEvent) can carry. Slice 1 only
// used blockedBy/requires/timeWindow; slice 2 adds fame and daysElapsed (still unused
// by the existing Joao arc — capability for the first fame-gated beat, e.g. Domingo).
export interface TriggerConditions {
  blockedBy?: QuestId[]; // applies only while NONE of these are finished
  requires?: QuestId[]; // applies only while ALL of these are finished
  timeWindow?: TimeWindow;
  fame?: Partial<Record<FameType, number>>; // minimum fame per track
  daysElapsed?: { min?: number; max?: number }; // whole game-days, floor(timePassed / 1440)
}

interface QuestRule extends TriggerConditions {
  buildingId: string;
  result: QuestId | { oneOf: QuestId[] };
}

const inTimeWindow = ({ min, max }: TimeWindow, timePassed: number): boolean => {
  const t = timePassed % 1440;

  return min > max ? t >= min || t <= max : t >= min && t < max;
};

// 22:00 (1320) through midnight (0), inclusive — the church/house late-night window.
const between22and24: TimeWindow = { min: 1320, max: 0 };

const lodgeBankGuild = (buildingId: string): QuestRule[] => [
  {
    buildingId,
    blockedBy: ['houseBeforeQuest'],
    result: {
      oneOf: [
        'lodgeBankGuildBeforeQuestRandom1',
        'lodgeBankGuildBeforeQuestRandom2',
        'lodgeBankGuildBeforeQuestRandom3',
      ],
    },
  },
  {
    buildingId,
    result: {
      oneOf: [
        'lodgeBankGuildAfterQuestRandom1',
        'lodgeBankGuildAfterQuestRandom2',
        'lodgeBankGuildAfterQuestRandom3',
      ],
    },
  },
];

// Order matters: first match wins, mirroring the original nested if-else.
const questRules: QuestRule[] = [
  // House (8)
  { buildingId: '8', blockedBy: ['houseBeforeQuest'], result: 'houseBeforeQuest' },
  {
    buildingId: '8',
    blockedBy: ['houseAfterQuestAndPub'],
    requires: ['pubAfterQuest'],
    timeWindow: between22and24,
    result: 'houseAfterQuestAndPub',
  },
  { buildingId: '8', blockedBy: ['houseAfterQuestAndPub'], result: 'houseAfterQuest' },
  { buildingId: '8', result: 'houseAfterQuestAndPub2' },

  // Pub (2)
  {
    buildingId: '2',
    blockedBy: ['houseBeforeQuest', 'pubBeforeQuest'],
    result: 'pubBeforeQuest',
  },
  { buildingId: '2', blockedBy: ['houseBeforeQuest'], result: 'pubBeforeQuest2' },
  { buildingId: '2', blockedBy: ['pubAfterQuest'], result: 'pubAfterQuest' },
  { buildingId: '2', blockedBy: ['houseAfterQuestAndPub'], result: 'pubAfterQuest2' },
  { buildingId: '2', result: 'pubCarlottaGreeting' },

  // Lodge (5), Bank (7), Guild (9) — random greetings
  ...lodgeBankGuild('5'),
  ...lodgeBankGuild('7'),
  ...lodgeBankGuild('9'),

  // Palace (6)
  { buildingId: '6', blockedBy: ['houseBeforeQuest'], result: 'palaceBeforeQuest' },
  { buildingId: '6', result: 'palaceAfterQuest' },

  // Item shop (10)
  { buildingId: '10', blockedBy: ['houseBeforeQuest'], result: 'itemShopBeforeQuest' },
  { buildingId: '10', blockedBy: ['itemShopAfterQuest'], result: 'itemShopAfterQuest' },
  { buildingId: '10', result: 'itemShopAfterQuest2' },

  // Shipyard (3) — falls through to null when both are finished
  { buildingId: '3', blockedBy: ['houseBeforeQuest'], result: 'shipyardBeforeQuest' },
  { buildingId: '3', blockedBy: ['shipyardAfterQuest'], result: 'shipyardAfterQuest' },

  // Church (11)
  {
    buildingId: '11',
    blockedBy: ['houseBeforeQuest', 'churchBeforeQuest'],
    result: 'churchBeforeQuest',
  },
  { buildingId: '11', blockedBy: ['houseBeforeQuest'], result: 'churchBeforeQuest2' },
  {
    buildingId: '11',
    blockedBy: ['churchAfterEnrico', 'churchAfterQuest'],
    result: 'churchAfterQuest',
  },
  { buildingId: '11', blockedBy: ['churchAfterEnrico'], result: 'churchAfterEnrico' },
  { buildingId: '11', result: 'churchAfterEnricoAfterGift' },

  // Market (1) — falls through to null
  { buildingId: '1', blockedBy: ['houseBeforeQuest'], result: 'marketBeforeQuest' },
  {
    buildingId: '1',
    blockedBy: ['shipyardAfterQuest'],
    result: 'marketAfterQuestBeforeShip',
  },

  // Harbor (4) — falls through to null
  { buildingId: '4', blockedBy: ['houseBeforeQuest'], result: 'harborBeforeQuest' },
  { buildingId: '4', blockedBy: ['shipyardAfterQuest'], result: 'harborBeforeShip' },
  { buildingId: '4', blockedBy: ['churchAfterQuest'], result: 'harborBeforeEnrico' },
  {
    buildingId: '4',
    blockedBy: ['pubAfterQuest', 'churchAfterEnrico'],
    result: 'harborAfterEnrico',
  },
  { buildingId: '4', blockedBy: ['pubAfterQuest'], result: 'harborAfterEnrico2' },
  {
    buildingId: '4',
    blockedBy: ['houseAfterQuestAndPub'],
    result: 'harborAfterEnricoBeforeMother',
  },
  { buildingId: '4', blockedBy: ['harborFinal'], result: 'harborFinal' },
];

// Evaluates every gating condition except the building (which `matchesRule` checks).
// Exported so the condition logic — including the slice-2 fame/daysElapsed gates — is
// unit-testable without relying on a live rule in the table.
export const triggerSatisfied = (
  trigger: TriggerConditions,
  ctx: QuestContext,
): boolean => {
  if (trigger.blockedBy?.some((id) => ctx.quests.includes(id))) {
    return false;
  }

  if (trigger.requires?.some((id) => !ctx.quests.includes(id))) {
    return false;
  }

  if (trigger.timeWindow && !inTimeWindow(trigger.timeWindow, ctx.timePassed)) {
    return false;
  }

  if (trigger.fame) {
    const meetsFame = (Object.entries(trigger.fame) as [FameType, number][]).every(
      ([type, min]) => (ctx.fame?.[type] ?? 0) >= min,
    );
    if (!meetsFame) {
      return false;
    }
  }

  if (trigger.daysElapsed) {
    const days = Math.floor(ctx.timePassed / 1440);
    const { min, max } = trigger.daysElapsed;
    if (min !== undefined && days < min) {
      return false;
    }
    if (max !== undefined && days > max) {
      return false;
    }
  }

  return true;
};

const matchesRule = (rule: QuestRule, ctx: QuestContext): boolean =>
  rule.buildingId === ctx.buildingId && triggerSatisfied(rule, ctx);

export const resolveQuestId = (ctx: QuestContext): QuestId | null => {
  if (ctx.portId !== '1' || !ctx.buildingId) {
    return null;
  }

  const rule = questRules.find((r) => matchesRule(r, ctx));

  if (!rule) {
    return null;
  }

  return typeof rule.result === 'string' ? rule.result : sample(rule.result.oneOf);
};
