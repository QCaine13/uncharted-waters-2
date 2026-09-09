import { getPortData } from '../game/port/portUtils';
import { STAFF_RETURNED_EVENT_ID } from './content/arcs/joao/massawa';

export const getStoryPortName = (
  portId: string,
  completedEvents: readonly string[],
): string => {
  if (portId === '75' && completedEvents.includes(STAFF_RETURNED_EVENT_ID)) {
    return 'Axum';
  }

  return getPortData(portId).name;
};

export default getStoryPortName;
