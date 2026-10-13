import { characterId, type StoryArc } from '../../../../core/types';
import { OTTO_ARMADA_ARC_ID, ottoArmadaEvents } from './events';

export { ottoArmadaDialogue } from './dialogue';
export * from './events';

export const ottoArmadaArc: StoryArc = {
  id: OTTO_ARMADA_ARC_ID,
  protagonist: characterId('otto'),
  title: 'Otto: Privateer of the Royal Navy',
  eventIds: ottoArmadaEvents.map(({ id }) => id),
};

export const ottoArmada = {
  arc: ottoArmadaArc,
  events: ottoArmadaEvents,
};

export default ottoArmada;
