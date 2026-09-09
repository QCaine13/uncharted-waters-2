const STORY_EPOCH_UTC = Date.UTC(1522, 4, 17);
const MINUTES_PER_DAY = 1440;

export interface CalendarParts {
  year: number;
  month: number;
  day: number;
  dayIndex: number;
  monthIndex: number;
}

export const getCalendarParts = (timePassed: number): CalendarParts => {
  const date = new Date(STORY_EPOCH_UTC + timePassed * 60_000);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;

  return {
    year,
    month,
    day: date.getUTCDate(),
    dayIndex: Math.floor(timePassed / MINUTES_PER_DAY),
    monthIndex: year * 12 + month - 1,
  };
};
