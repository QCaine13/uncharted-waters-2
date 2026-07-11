import { buildings } from '../../data/buildingData';
import { itemData } from '../../data/itemData';
import { regularPorts } from '../../data/portData';
import { sailorData } from '../../data/sailorData';
import { shipData } from '../../data/shipData';
import type { StoryValidationCatalogs } from '../core/validator';
import { legacyToSemanticEvent } from '../legacy/lisbonCompletionKeys';

export const storyValidationCatalogs: StoryValidationCatalogs = {
  itemIds: new Set(Object.keys(itemData)),
  portIds: new Set(regularPorts.map((_, index) => String(index + 1))),
  buildingIds: new Set(Object.keys(buildings)),
  shipIds: new Set(Object.keys(shipData)),
  sailorIds: new Set(Object.keys(sailorData)),
  mateRoles: new Set(['firstMate', 'bookKeeper', 'chiefNavigator']),
  parityManifest: new Map(Object.entries(legacyToSemanticEvent)),
};

export default storyValidationCatalogs;
