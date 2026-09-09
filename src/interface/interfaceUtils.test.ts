import { setLocale } from '../localization';
import { getDate, minutesUntilNextMorning } from './interfaceUtils';

afterEach(() => setLocale('zh-CN'));

describe('getDate', () => {
  test('formats the shared UTC story calendar in Chinese', () => {
    setLocale('zh-CN');
    expect(getDate(0)).toBe('1522年5月17日');
    expect(getDate(228 * 1440)).toBe('1522年12月31日');
    expect(getDate(229 * 1440)).toBe('1523年1月1日');
  });

  test('preserves the English date format', () => {
    setLocale('en');
    expect(getDate(0)).toBe('May 17 1522');
    expect(getDate(229 * 1440)).toBe('Jan 1 1523');
  });
});

test('minutesUntilNextMorning', () => {
  expect(minutesUntilNextMorning(0)).toEqual(1440 + 480);
  expect(minutesUntilNextMorning(480)).toEqual(1440);
  expect(minutesUntilNextMorning(500)).toEqual(1440 - 20);
  expect(minutesUntilNextMorning(1439)).toEqual(1 + 480);
  expect(minutesUntilNextMorning(1440)).toEqual(1440 + 480);
  expect(minutesUntilNextMorning(1640)).toEqual(1440 - 200 + 480);
  expect(minutesUntilNextMorning(2880)).toEqual(1440 + 480);
});
