import {
  getLocale,
  setLocale,
  subscribeLocale,
  t,
  mergeCatalogs,
  localizeDocument,
} from './index';
import { chineseCatalog } from './catalogs';
import { isInteractiveTextTarget } from './dom';
import { lisbonOpeningDialogue } from '../story/content/arcs/joao/lisbon-opening/dialogue';
import { regularPorts, supplyPorts } from '../data/portData';
import { goodData } from '../data/goodsData';
import { itemData } from '../data/itemData';
import { shipData } from '../data/shipData';
import { landmarks } from '../data/discoveryData';
import { sailorData } from '../data/sailorData';
import { firstVoyageDialogue } from '../story/content/arcs/joao/first-voyage/dialogue';
import { conflictAndGrowthEvents } from '../story/content/arcs/joao/conflict-and-growth';
import { getFirstVoyageJournal } from '../story/firstVoyageJournal';
import { getConflictAndGrowthJournal } from '../story/conflictAndGrowthJournal';
import type { StoryStep } from '../story/core/types';
import type { CombatOutcome } from '../combat/types';
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

const collectVisibleStorySources = (steps: readonly StoryStep[]): string[] =>
  steps.flatMap((step): string[] => {
    if (step.type === 'dialogue') return [step.body];
    if (step.type === 'choice') {
      return [
        step.prompt,
        ...step.options.flatMap(({ label, steps: optionSteps }) => [
          label,
          ...collectVisibleStorySources(optionSteps),
        ]),
      ];
    }
    return [];
  });

const m2Event = (suffix: string): string =>
  `joao.conflict-and-growth.${suffix}`;

type JournalScenario = {
  events: string[];
  combatResults?: Record<string, CombatOutcome>;
  activeCombat?: boolean;
};

const m2JournalScenarios: JournalScenario[] = [
  { events: [] },
  { events: ['domingo-missing'] },
  { events: ['domingo-missing', 'lodge-search'] },
  {
    events: ['domingo-missing', 'lodge-search', 'kahn-shipyard-start'],
  },
  ...(['victory', 'defeat', 'draw'] as CombatOutcome[]).map(
    (shipyardResult): JournalScenario => ({
      events: ['domingo-missing', 'lodge-search', 'kahn-shipyard-start'],
      combatResults: { 'joao.m2.kahn-shipyard': shipyardResult },
    }),
  ),
  {
    events: [
      'domingo-missing',
      'lodge-search',
      'kahn-shipyard-start',
      'identity-revealed',
    ],
    combatResults: { 'joao.m2.kahn-shipyard': 'defeat' },
  },
  {
    events: [
      'domingo-missing',
      'lodge-search',
      'kahn-shipyard-start',
      'identity-revealed',
      'kahn-house-start',
    ],
    combatResults: { 'joao.m2.kahn-shipyard': 'defeat' },
  },
  {
    events: [
      'domingo-missing',
      'lodge-search',
      'kahn-shipyard-start',
      'identity-revealed',
      'kahn-house-start',
    ],
    combatResults: { 'joao.m2.kahn-shipyard': 'defeat' },
    activeCombat: true,
  },
  ...(['draw', 'victory', 'defeat'] as CombatOutcome[]).map(
    (houseResult): JournalScenario => ({
      events: [
        'domingo-missing',
        'lodge-search',
        'kahn-shipyard-start',
        'identity-revealed',
        'kahn-house-start',
      ],
      combatResults: {
        'joao.m2.kahn-shipyard': 'defeat',
        'joao.m2.kahn-house': houseResult,
      },
    }),
  ),
  ...[
    'father-cleared',
    'domingo-farewell',
    'katarina-warning',
    'pursuit-first-sea',
    'pursuit-first-port',
    'katarina-battle-start',
  ].map(
    (_lastEvent, index, progression): JournalScenario => ({
      events: [
        'domingo-missing',
        'lodge-search',
        'kahn-shipyard-start',
        'identity-revealed',
        'kahn-house-start',
        ...progression.slice(0, index + 1),
      ],
      combatResults: {
        'joao.m2.kahn-shipyard': 'defeat',
        'joao.m2.kahn-house': 'victory',
      },
    }),
  ),
  {
    events: [
      'domingo-missing',
      'lodge-search',
      'kahn-shipyard-start',
      'identity-revealed',
      'kahn-house-start',
      'father-cleared',
      'domingo-farewell',
      'katarina-warning',
      'pursuit-first-sea',
      'pursuit-first-port',
      'katarina-battle-start',
    ],
    combatResults: {
      'joao.m2.kahn-shipyard': 'defeat',
      'joao.m2.kahn-house': 'victory',
    },
    activeCombat: true,
  },
  ...(['defeat', 'victory', 'retreat'] as CombatOutcome[]).map(
    (navalResult): JournalScenario => ({
      events: [
        'domingo-missing',
        'lodge-search',
        'kahn-shipyard-start',
        'identity-revealed',
        'kahn-house-start',
        'father-cleared',
        'domingo-farewell',
        'katarina-warning',
        'pursuit-first-sea',
        'pursuit-first-port',
        'katarina-battle-start',
      ],
      combatResults: {
        'joao.m2.kahn-shipyard': 'defeat',
        'joao.m2.kahn-house': 'victory',
        'joao.m2.katarina': navalResult,
      },
    }),
  ),
  ...['ali-request', 'lisbon-inquiry', 'sasha-found', 'chapter-complete'].map(
    (_lastEvent, index, progression): JournalScenario => ({
      events: [
        'domingo-missing',
        'lodge-search',
        'kahn-shipyard-start',
        'identity-revealed',
        'kahn-house-start',
        'father-cleared',
        'domingo-farewell',
        'katarina-warning',
        'pursuit-first-sea',
        'pursuit-first-port',
        'katarina-battle-start',
        ...progression.slice(0, index + 1),
      ],
      combatResults: {
        'joao.m2.kahn-shipyard': 'defeat',
        'joao.m2.kahn-house': 'victory',
        'joao.m2.katarina': 'retreat',
      },
    }),
  ),
];

const collectM2JournalSources = (): string[] =>
  m2JournalScenarios.flatMap(({ events, combatResults, activeCombat }) => {
    state.storyEvents = [
      'joao.first-voyage.chapter-complete',
      ...events.map(m2Event),
    ];
    state.combatResults = combatResults ?? {};
    state.activeCombat = activeCombat
      ? ({} as NonNullable<typeof state.activeCombat>)
      : null;
    return getConflictAndGrowthJournal(state).flatMap(({ title, body }) => [
      title,
      body,
    ]);
  });

const expectTranslatedSources = (sources: readonly string[]): void => {
  sources.forEach((source) => {
    const translated = t(source);
    const placeholders = source.match(/\{[^}]+\}/g) ?? [];
    expect(translated).toBeTruthy();
    expect(translated).not.toBe(source);
    expect(translated.match(/\{[^}]+\}/g) ?? []).toEqual(placeholders);

    const values = Object.fromEntries(
      placeholders.map((placeholder, index) => [
        placeholder.slice(1, -1),
        `translated-value-${index}`,
      ]),
    );
    expect(t(source, values).match(/\{[^}]+\}/g) ?? []).toEqual([]);
  });
};

test('every visible conflict-and-growth branch and journal state has a translation', () => {
  setLocale('zh-CN');
  const eventSources = conflictAndGrowthEvents.flatMap(({ steps }) =>
    collectVisibleStorySources(steps),
  );
  const journalSources = collectM2JournalSources();
  const uniqueEventSources = new Set(eventSources);
  const uniqueJournalSources = new Set(journalSources);
  const uniqueSources = new Set([...eventSources, ...journalSources]);

  expect(m2JournalScenarios).toHaveLength(27);
  expect(eventSources).toHaveLength(35);
  expect(uniqueEventSources.size).toBe(32);
  expect(uniqueJournalSources.size).toBe(63);
  expect(uniqueSources.size).toBe(95);
  expectTranslatedSources([...uniqueSources]);
});

test('the conflict-and-growth localization guard rejects an absent translation', () => {
  setLocale('zh-CN');
  const source = conflictAndGrowthEvents[0].steps[0];
  if (source.type !== 'dialogue') throw new Error('Expected opening dialogue');

  const savedTranslation = chineseCatalog[source.body];
  delete chineseCatalog[source.body];
  try {
    expect(() => expectTranslatedSources([source.body])).toThrow();
  } finally {
    chineseCatalog[source.body] = savedTranslation;
  }
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
