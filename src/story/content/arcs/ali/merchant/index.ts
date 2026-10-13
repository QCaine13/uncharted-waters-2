import { characterId, type StoryArc } from '../../../../core/types';
import { ALI_MERCHANT_ARC_ID, aliMerchantEvents } from './events';

export { aliMerchantDialogue } from './dialogue';
export * from './events';

export const aliMerchantArc: StoryArc = {
  id: ALI_MERCHANT_ARC_ID,
  protagonist: characterId('ali'),
  title: 'Ali: Merchant Prince of the Seven Seas',
  eventIds: aliMerchantEvents.map(({ id }) => id),
};

export const aliMerchant = {
  arc: aliMerchantArc,
  events: aliMerchantEvents,
};

export default aliMerchant;
