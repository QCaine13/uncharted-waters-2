import type {
  CompiledStoryContent,
  LegacyQuestId,
  StoryEventId,
} from '../core/types';
import { legacyQuestId } from '../core/types';

export const legacyToSemanticEvent = {
  houseBeforeQuest: 'joao.lisbon-opening.house-introduction',
  houseAfterQuest: 'joao.lisbon-opening.house-guard-after-introduction',
  houseAfterQuestAndPub: 'joao.lisbon-opening.house-mother-farewell',
  houseAfterQuestAndPub2: 'joao.lisbon-opening.house-guard-after-farewell',
  pubBeforeQuest: 'joao.lisbon-opening.pub-before-introduction',
  pubBeforeQuest2: 'joao.lisbon-opening.pub-before-departure',
  pubAfterQuest: 'joao.lisbon-opening.pub-farewell',
  pubAfterQuest2: 'joao.lisbon-opening.pub-after-farewell',
  lodgeBankGuildBeforeQuestRandom1: 'joao.lisbon-opening.ambient-before-1',
  lodgeBankGuildBeforeQuestRandom2: 'joao.lisbon-opening.ambient-before-2',
  lodgeBankGuildBeforeQuestRandom3: 'joao.lisbon-opening.ambient-before-3',
  lodgeBankGuildAfterQuestRandom1: 'joao.lisbon-opening.ambient-after-1',
  lodgeBankGuildAfterQuestRandom2: 'joao.lisbon-opening.ambient-after-2',
  lodgeBankGuildAfterQuestRandom3: 'joao.lisbon-opening.ambient-after-3',
  palaceBeforeQuest: 'joao.lisbon-opening.palace-before-introduction',
  palaceAfterQuest: 'joao.lisbon-opening.palace-after-introduction',
  itemShopBeforeQuest: 'joao.lisbon-opening.item-shop-before-introduction',
  itemShopAfterQuest: 'joao.lisbon-opening.item-shop-rapier',
  itemShopAfterQuest2: 'joao.lisbon-opening.item-shop-after-rapier',
  shipyardBeforeQuest: 'joao.lisbon-opening.shipyard-before-introduction',
  shipyardAfterQuest: 'joao.lisbon-opening.shipyard-hermes-ii',
  churchBeforeQuest: 'joao.lisbon-opening.church-before-introduction',
  churchBeforeQuest2: 'joao.lisbon-opening.church-before-departure',
  churchAfterQuest: 'joao.lisbon-opening.church-recruit-enrico',
  churchAfterEnrico: 'joao.lisbon-opening.church-enrico-gift',
  churchAfterEnricoAfterGift: 'joao.lisbon-opening.church-after-gift',
  harborBeforeQuest: 'joao.lisbon-opening.harbor-before-introduction',
  harborBeforeShip: 'joao.lisbon-opening.harbor-before-ship',
  harborBeforeEnrico: 'joao.lisbon-opening.harbor-before-enrico',
  harborAfterEnrico: 'joao.lisbon-opening.harbor-enrico-arrival',
  harborAfterEnrico2: 'joao.lisbon-opening.harbor-after-enrico-arrival',
  harborAfterEnricoBeforeMother:
    'joao.lisbon-opening.harbor-before-mother-farewell',
  harborFinal: 'joao.lisbon-opening.harbor-final',
  marketBeforeQuest: 'joao.lisbon-opening.market-before-introduction',
  marketAfterQuestBeforeShip: 'joao.lisbon-opening.market-before-ship',
  pubCarlottaGreeting: 'joao.lisbon-opening.pub-carlotta-greeting',
} as const;

export type LegacyLisbonKey = keyof typeof legacyToSemanticEvent;
export type LegacyQuestCompletionKey = LegacyLisbonKey;

export const getCompletedStoryEvents = (
  legacyKeys: readonly string[],
  content: CompiledStoryContent,
): Set<StoryEventId> =>
  new Set(
    legacyKeys
      .map((key) => content.eventByLegacyCompletionKey.get(legacyQuestId(key)))
      .filter((eventId): eventId is StoryEventId => eventId !== undefined),
  );

export const getLegacyCompletionKey = (
  eventId: StoryEventId,
  content: CompiledStoryContent,
): LegacyQuestId | null =>
  content.legacyCompletionKeyByEvent.get(eventId) ?? null;
