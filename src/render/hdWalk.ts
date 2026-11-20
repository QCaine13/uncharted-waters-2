import type { Position } from '../types';

/*
  16-frame walk strips: 4 frames per direction ordered N E S W, each
  direction [stride A, passing, stride B, passing]. The legacy frame
  number is base + dirOffset(0,2,4,6) + alternate(0|1); this maps it and
  the current step progress onto the richer strip.
  step <= 0 or >= 1 means "settled on a tile" -> standing pose.
*/
export const walk16Frame = (frame: number, step: number): number => {
  const local = frame % 8;
  const dir = Math.floor(local / 2);
  const alt = local % 2;

  if (step <= 0 || step >= 1) {
    return dir * 4 + 1;
  }

  return dir * 4 + alt * 2 + (step >= 0.5 ? 1 : 0);
};

interface WalkingCharacter {
  position: (percentNextMove?: number) => Position;
  destination: () => Position | undefined;
}

/*
  Progress 0..1 of the character's current one-tile step. destination()
  holds the target tile while position() interpolates towards it, so the
  distance between them shrinks 1 -> 0 over the step; both agree once the
  step lands, which yields 0 (standing).
*/
export const stepProgress = (
  character: WalkingCharacter,
  percentNextMove: number,
): number => {
  const destination = character.destination();

  if (!destination) {
    return 0;
  }

  const position = character.position(percentNextMove);
  const remaining =
    Math.abs(destination.x - position.x) + Math.abs(destination.y - position.y);

  return Math.min(1, Math.max(0, 1 - remaining));
};
