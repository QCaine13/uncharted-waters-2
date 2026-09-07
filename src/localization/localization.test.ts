import {
  getLocale,
  setLocale,
  subscribeLocale,
  t,
  mergeCatalogs,
  localizeDocument,
} from './index';
import { isInteractiveTextTarget } from './dom';
import { lisbonOpeningDialogue } from '../story/content/arcs/joao/lisbon-opening/dialogue';
import { regularPorts, supplyPorts } from '../data/portData';
import { goodData } from '../data/goodsData';
import { itemData } from '../data/itemData';
import { shipData } from '../data/shipData';
import { landmarks } from '../data/discoveryData';
import { sailorData } from '../data/sailorData';
import { firstVoyageDialogue } from '../story/content/arcs/joao/first-voyage/dialogue';
import { conflictAndGrowthDialogue } from '../story/content/arcs/joao/conflict-and-growth/dialogue';
import { getFirstVoyageJournal } from '../story/firstVoyageJournal';
import { getConflictAndGrowthJournal } from '../story/conflictAndGrowthJournal';
import state from '../state/state';

describe('locale', () => {
  beforeEach(() => {
    localStorage.clear();
    setLocale('zh-CN');
  });

  test('defaults to Chinese when no preference is stored', () => {
    localStorage.removeItem('uw2.locale');
    expect(getLocale()).toBe('zh-CN');
    expect(t('System')).toBe('系统');
    expect(t('Day {day}', { day: 3 })).toBe('航海第 3 天');
  });

  test('uses a persisted English preference', () => {
    localStorage.setItem('uw2.locale', 'en');
    expect(getLocale()).toBe('en');
    expect(t('System')).toBe('System');
  });

  test('falls back to Chinese for an invalid preference', () => {
    localStorage.setItem('uw2.locale', 'pirate');
    expect(getLocale()).toBe('zh-CN');
  });

  test('keeps an in-memory switch when storage writes fail', () => {
    const spy = jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('storage unavailable');
      });
    setLocale('en');
    expect(getLocale()).toBe('en');
    expect(t('Save')).toBe('Save');
    spy.mockRestore();
  });

  test('notifies subscribers on language changes', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeLocale(listener);
    setLocale('en');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    setLocale('zh-CN');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('unknown player-entered text is preserved', () => {
    expect(t('Sea Dragon')).toBe('Sea Dragon');
    expect(t('constructor')).toBe('constructor');
    expect(t('toString')).toBe('toString');
    expect(t('__proto__')).toBe('__proto__');
  });
});

test('recognizes controls whose keyboard input must stay isolated', () => {
  expect(isInteractiveTextTarget(document.createElement('select'))).toBe(true);
  expect(isInteractiveTextTarget(document.createElement('input'))).toBe(true);
  expect(isInteractiveTextTarget(document.createElement('textarea'))).toBe(
    true,
  );
  expect(isInteractiveTextTarget(document.createElement('div'))).toBe(false);
});

test('localizes the static document and preserves linked locale-only copy', () => {
  document.body.innerHTML = `
    <div data-en="Controls" data-zh="操作">Controls</div>
    <p data-locale-only="zh-CN"><a href="#zh">中文链接</a></p>
    <p data-locale-only="en"><a href="#en">English link</a></p>
  `;
  setLocale('zh-CN');
  localizeDocument();
  expect(document.documentElement.lang).toBe('zh-CN');
  expect(document.querySelector('[data-en]')?.textContent).toBe('操作');
  expect(
    (document.querySelector('[data-locale-only="zh-CN"]') as HTMLElement)
      .hidden,
  ).toBe(false);
  expect(
    (document.querySelector('[data-locale-only="en"]') as HTMLElement).hidden,
  ).toBe(true);
  expect(document.querySelector('a[href="#zh"]')).not.toBeNull();

  setLocale('en');
  localizeDocument();
  expect(document.documentElement.lang).toBe('en');
  expect(document.querySelector('[data-en]')?.textContent).toBe('Controls');
  expect(
    (document.querySelector('[data-locale-only="en"]') as HTMLElement).hidden,
  ).toBe(false);
});

test('rejects conflicting exact-source translations across catalogs', () => {
  expect(() => mergeCatalogs({ Yes: '是' }, { Yes: '确认' })).toThrow(
    'Conflicting translation for "Yes"',
  );
});

test('every Lisbon dialogue line, prompt and choice has a placeholder-safe translation', () => {
  setLocale('zh-CN');
  const sources: string[] = [];
  const collect = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, child]) => {
        if (
          ['body', 'prompt', 'label'].includes(key) &&
          typeof child === 'string'
        )
          sources.push(child);
        else collect(child);
      });
    }
  };
  collect(lisbonOpeningDialogue);
  expect(new Set(sources).size).toBe(186);
  sources.forEach((source) => {
    const translated = t(source);
    expect(translated).toBeTruthy();
    expect(translated).not.toBe(source);
    expect(translated.match(/\$(?:firstName|lastName)/g) ?? []).toEqual(
      source.match(/\$(?:firstName|lastName)/g) ?? [],
    );
  });
});

test('every first-voyage branch and journal entry has a placeholder-safe translation', () => {
  setLocale('zh-CN');
  const sources: string[] = [];
  const collect = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, child]) => {
        if (
          ['body', 'prompt', 'label', 'title'].includes(key) &&
          typeof child === 'string'
        )
          sources.push(child);
        else collect(child);
      });
    }
  };
  collect(firstVoyageDialogue);
  collect(getFirstVoyageJournal(state));

  sources.forEach((source) => {
    const translated = t(source);
    expect(translated).toBeTruthy();
    expect(translated).not.toBe(source);
    expect(translated.match(/\{[^}]+\}/g) ?? []).toEqual(
      source.match(/\{[^}]+\}/g) ?? [],
    );
  });
  expect(
    Math.max(...sources.map((source) => t(source).length)),
  ).toBeLessThanOrEqual(48);
});

test('every conflict-and-growth branch and journal entry has a translation', () => {
  setLocale('zh-CN');
  state.storyEvents = ['joao.first-voyage.chapter-complete'];
  state.items = ['4'];
  state.equipment = { weaponId: null, armorId: null };
  state.combatResults = {};
  state.activeCombat = null;
  const sources: string[] = [];
  const collect = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, child]) => {
        if (
          ['body', 'prompt', 'label', 'title'].includes(key) &&
          typeof child === 'string'
        )
          sources.push(child);
        else collect(child);
      });
    }
  };
  collect(conflictAndGrowthDialogue);
  collect(getConflictAndGrowthJournal(state));

  expect(new Set(sources).size).toBe(sources.length);
  sources.forEach((source) => {
    expect(t(source)).toBeTruthy();
    expect(t(source)).not.toBe(source);
  });
});

test('every live game term and detail has an explicit Chinese translation', () => {
  setLocale('zh-CN');
  const names = [
    ...regularPorts.map(({ name }) => name),
    ...supplyPorts.map(({ name }) => name),
    ...Object.values(goodData).map(({ name }) => name),
    ...Object.values(itemData).map(({ name }) => name),
    ...Object.values(shipData).map(({ name }) => name),
    ...landmarks.map(({ name }) => name),
    ...Object.values(sailorData).map(({ name }) => name),
  ];
  expect(regularPorts.length + supplyPorts.length).toBe(130);
  names.forEach((source) => expect(t(source)).not.toBe(source));
  [...Object.values(itemData), ...Object.values(shipData)].forEach(
    ({ description }) => expect(t(description)).not.toBe(description),
  );
});

test('uses the approved canonical Chinese Lisbon names', () => {
  setLocale('zh-CN');
  expect(t('João Franco')).toBe('约翰·法雷尔');
  expect(t('Rocco Alemkel')).toBe('洛克·阿尔姆克');
  expect(t('Brother Enrico')).toBe('恩里克神父');
  expect(t('Lucia the Waitress')).toBe('女侍路琪亚');
  expect(t('Domingo')).toBe('多明戈');
  expect(t('Domingo Manana')).toBe('多明戈');
  expect(t('Otto Baynes')).toBe('奥托·斯宾诺拉');
  expect(t('Ernst von Bohr')).toBe('恩斯特·洛佩斯');
  expect(t('Pietro Conti')).toBe('皮耶德·康迪');
  expect(t('Ali Vezas')).toBe('阿兰·维斯特');
  expect(t('Antonio Kahn')).toBe('安东尼奥·卡恩');
  expect(t('Katarina Erantzo')).toBe('卡特琳娜·艾兰茨');
  expect(t('Sasha')).toBe('莎夏');
  expect(t('Oh, and I’d like you to be first mate, Rocco.')).toContain(
    '洛克，我想请你担任助手',
  );
});
