import type { ProvisionSummary } from './provisions';
import type { Fame, State } from './state';
import type { Landmark } from '../data/discoveryData';

interface UpdateInterface {
  general: (
    general: Pick<State, 'portId' | 'buildingId' | 'timePassed' | 'gold'>,
  ) => void;
  dayAtSea: (dayAtSea: number) => void;
  provisions: (summary: ProvisionSummary) => void;
  indicators: (indicators: Pick<State, 'wind' | 'current'>) => void;
  playerFleetDirection: (direction: number) => void;
  playerFleetSpeed: (speed: number) => void;
  fade: (onComplete: () => void) => void;
  // Landmarks newly discovered this tick (design spec section 3) — an empty
  // array clears the banner, which dock() uses so it can never linger into
  // the next voyage.
  discovery: (discovered: Landmark[]) => void;
  fame: (fame: Fame) => void;
}

const updateInterface = {} as UpdateInterface;

export default updateInterface;
