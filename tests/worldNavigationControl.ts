import type { PlannedDirection } from './worldRoutePlanner';

type Position = { x: number; y: number };

const signedWrappedXDelta = (target: number, current: number) => {
  const direct = target - current;
  if (direct > 1080) return direct - 2160;
  if (direct < -1080) return direct + 2160;
  return direct;
};

export const classifyDockingCorrectionMovement = ({
  before,
  after,
  axis,
  key,
}: {
  before: Position;
  after: Position;
  axis: 'x' | 'y';
  key: PlannedDirection;
}) => {
  const xMovement = signedWrappedXDelta(after.x, before.x);
  const yMovement = after.y - before.y;
  const requestedAxisMovement = axis === 'x' ? xMovement : yMovement;
  const requestedAxisProgress =
    key === 'd' || key === 's' ? requestedAxisMovement : -requestedAxisMovement;
  const totalMovement = Math.abs(xMovement) + Math.abs(yMovement);
  const outcome =
    totalMovement < 0.01
      ? ('stalled' as const)
      : requestedAxisProgress >= 0.01
      ? ('targetward-movement' as const)
      : ('unexpected-movement' as const);
  return {
    outcome,
    requestedAxisMovement,
    requestedAxisProgress,
    totalMovement,
  };
};
