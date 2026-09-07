import { getLocale } from '../localization';
import { getCalendarParts } from '../time/calendar';

export const classNames = (...classes: string[]): string =>
  classes.filter(Boolean).join(' ');

/*
  The 800px matches the game view between the two HUD columns (see Interface)
  and the frame in homepage/index.html. Stating it here rather than letting the
  columns size to their content is what stops a column from growing past the
  frame and spilling onto the page below — the readouts inside scroll instead.
 */
export const hudClass = 'w-[180px] h-[800px] text-[#aaaaaa] text-lg';

export const getDate = (timePassed: number) => {
  const { year, month, day } = getCalendarParts(timePassed);

  if (getLocale() === 'zh-CN') {
    return `${year}年${month}月${day}日`;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  return `${date.toLocaleString('en-us', {
    month: 'short',
    timeZone: 'UTC',
  })} ${day} ${year}`;
};

export const getHoursMinutes = (timePassed: number) => {
  let hours = Math.floor((timePassed % 1440) / 60);
  let period = 'AM';

  if (hours >= 12) {
    period = 'PM';
  }

  hours %= 12;

  if (hours === 0) {
    hours = 12;
  }

  const minutes = timePassed % 60;

  if (getLocale() === 'zh-CN') {
    return `${period === 'AM' ? '上午' : '下午'} ${hours}:${String(
      minutes,
    ).padStart(2, '0')}`;
  }

  if (minutes < 10) {
    return `${hours}:0${minutes} ${period}`;
  }

  return `${hours}:${minutes} ${period}`;
};

export const getIngots = (gold: number) => Math.floor(gold / 10000);

export const getCoins = (gold: number) => gold % 10000;

export const minutesUntilNextMorning = (timePassed: number) => {
  const nextMorning = Math.floor(timePassed / 1440) * 1440 + 1440 + 480;

  return nextMorning - timePassed;
};
