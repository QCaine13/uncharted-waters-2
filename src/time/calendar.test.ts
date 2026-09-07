import { getCalendarParts } from './calendar';

const minutesAt = (
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
): number =>
  (Date.UTC(year, month - 1, day, hours, minutes) - Date.UTC(1522, 4, 17)) /
  60_000;

describe('story calendar', () => {
  test('uses 1522-05-17 UTC as day zero', () => {
    expect(getCalendarParts(0)).toMatchObject({
      year: 1522,
      month: 5,
      day: 17,
      dayIndex: 0,
    });
  });

  test('derives a monotonic month index across year boundaries', () => {
    expect(getCalendarParts(minutesAt(1522, 12, 31))).toMatchObject({
      year: 1522,
      month: 12,
      monthIndex: 1522 * 12 + 11,
    });
    expect(getCalendarParts(minutesAt(1523, 1, 1))).toMatchObject({
      year: 1523,
      month: 1,
      monthIndex: 1523 * 12,
    });
  });

  test('advances dayIndex at the UTC date boundary', () => {
    expect(getCalendarParts(minutesAt(1522, 5, 17, 23, 59)).dayIndex).toBe(0);
    expect(getCalendarParts(minutesAt(1522, 5, 18)).dayIndex).toBe(1);
  });
});
