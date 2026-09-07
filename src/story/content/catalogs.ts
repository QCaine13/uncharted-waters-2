import { buildings } from '../../data/buildingData';
import { landmarks } from '../../data/discoveryData';
import { itemData } from '../../data/itemData';
import { regularPorts, supplyPorts } from '../../data/portData';
import { sailorData } from '../../data/sailorData';
import { shipData } from '../../data/shipData';
import { encounterCatalog } from '../../combat/encounters';
import type { StoryValidationCatalogs } from '../core/validator';
import { legacyToSemanticEvent } from '../legacy/lisbonCompletionKeys';

export const storyValidationCatalogs: StoryValidationCatalogs = {
  itemIds: new Set(Object.keys(itemData)),
  portIds: new Set(
    Array.from(
      { length: regularPorts.length + supplyPorts.length },
      (_, index) => String(index + 1),
    ),
  ),
  buildingIds: new Set(Object.keys(buildings)),
  shipIds: new Set(Object.keys(shipData)),
  sailorIds: new Set(Object.keys(sailorData)),
  encounterIds: new Set(Object.keys(encounterCatalog)),
  mateRoles: new Set(['firstMate', 'bookKeeper', 'chiefNavigator']),
  discoveryIds: new Set(landmarks.map(({ id }) => id)),
  parityManifest: {
    legacyKeyToEvent: new Map(Object.entries(legacyToSemanticEvent)),
    migratedEventIds: new Set([
      'joao.lisbon-opening.ambient-after-1',
      'joao.lisbon-opening.ambient-after-1.bank',
      'joao.lisbon-opening.ambient-after-1.guild',
      'joao.lisbon-opening.ambient-after-2',
      'joao.lisbon-opening.ambient-after-2.bank',
      'joao.lisbon-opening.ambient-after-2.guild',
      'joao.lisbon-opening.ambient-after-3',
      'joao.lisbon-opening.ambient-after-3.bank',
      'joao.lisbon-opening.ambient-after-3.guild',
      'joao.lisbon-opening.ambient-before-1',
      'joao.lisbon-opening.ambient-before-1.bank',
      'joao.lisbon-opening.ambient-before-1.guild',
      'joao.lisbon-opening.ambient-before-2',
      'joao.lisbon-opening.ambient-before-2.bank',
      'joao.lisbon-opening.ambient-before-2.guild',
      'joao.lisbon-opening.ambient-before-3',
      'joao.lisbon-opening.ambient-before-3.bank',
      'joao.lisbon-opening.ambient-before-3.guild',
      'joao.lisbon-opening.church-after-gift',
      'joao.lisbon-opening.church-before-departure',
      'joao.lisbon-opening.church-before-introduction',
      'joao.lisbon-opening.church-enrico-gift',
      'joao.lisbon-opening.church-recruit-enrico',
      'joao.lisbon-opening.harbor-after-enrico-arrival',
      'joao.lisbon-opening.harbor-before-enrico',
      'joao.lisbon-opening.harbor-before-introduction',
      'joao.lisbon-opening.harbor-before-mother-farewell',
      'joao.lisbon-opening.harbor-before-ship',
      'joao.lisbon-opening.harbor-enrico-arrival',
      'joao.lisbon-opening.harbor-final',
      'joao.lisbon-opening.house-guard-after-farewell',
      'joao.lisbon-opening.house-guard-after-introduction',
      'joao.lisbon-opening.house-introduction',
      'joao.lisbon-opening.house-mother-farewell',
      'joao.lisbon-opening.item-shop-after-rapier',
      'joao.lisbon-opening.item-shop-before-introduction',
      'joao.lisbon-opening.item-shop-rapier',
      'joao.lisbon-opening.market-before-introduction',
      'joao.lisbon-opening.market-before-ship',
      'joao.lisbon-opening.palace-after-introduction',
      'joao.lisbon-opening.palace-before-introduction',
      'joao.lisbon-opening.pub-after-farewell',
      'joao.lisbon-opening.pub-before-departure',
      'joao.lisbon-opening.pub-before-introduction',
      'joao.lisbon-opening.pub-carlotta-greeting',
      'joao.lisbon-opening.pub-farewell',
      'joao.lisbon-opening.shipyard-before-introduction',
      'joao.lisbon-opening.shipyard-hermes-ii',
    ]),
  },
};

export default storyValidationCatalogs;
