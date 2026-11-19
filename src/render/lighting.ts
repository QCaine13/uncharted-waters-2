/**
 * Smooth day/night ambient lighting for HD ports.
 * Keyframes interpolate continuously, wrapping at midnight.
 */
export interface Ambient {
  tint: [number, number, number];
  darkness: number;
}

interface Keyframe {
  minutes: number;
  tint: [number, number, number];
  darkness: number;
}

const KEYFRAMES: Keyframe[] = [
  { minutes: 0, tint: [110, 120, 165], darkness: 0.75 },
  { minutes: 300, tint: [135, 140, 180], darkness: 0.55 },
  { minutes: 390, tint: [205, 208, 230], darkness: 0.2 },
  { minutes: 480, tint: [255, 255, 255], darkness: 0 },
  { minutes: 1020, tint: [255, 255, 255], darkness: 0 },
  { minutes: 1110, tint: [255, 185, 130], darkness: 0.22 },
  { minutes: 1200, tint: [150, 150, 190], darkness: 0.5 },
  { minutes: 1320, tint: [115, 125, 170], darkness: 0.7 },
  { minutes: 1440, tint: [110, 120, 165], darkness: 0.75 },
];

const smoothstep = (t: number) => t * t * (3 - 2 * t);

export const ambientAt = (minutesOfDay: number): Ambient => {
  const minutes = ((minutesOfDay % 1440) + 1440) % 1440;

  let next = KEYFRAMES.findIndex((key) => key.minutes > minutes);
  if (next === -1) {
    next = KEYFRAMES.length - 1;
  }
  const prev = Math.max(0, next - 1);
  const from = KEYFRAMES[prev];
  const to = KEYFRAMES[next];
  const span = to.minutes - from.minutes;
  const t = span > 0 ? smoothstep((minutes - from.minutes) / span) : 0;

  return {
    tint: [0, 1, 2].map(
      (channel) =>
        from.tint[channel] + (to.tint[channel] - from.tint[channel]) * t,
    ) as [number, number, number],
    darkness: from.darkness + (to.darkness - from.darkness) * t,
  };
};
