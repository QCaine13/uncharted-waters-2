import type { ProvisionSummary } from './provisions';
import type { State } from './state';

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
}

const updateInterface = {} as UpdateInterface;

export default updateInterface;
