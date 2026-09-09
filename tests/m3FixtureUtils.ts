import { SAVE_VERSION } from '../src/state/saveLoad';
import { SAVED_STATE_KEY, type State } from '../src/state/state';
import { completedM1Fixture } from './conflictAndGrowthUtils';
import { readVoyageSave } from './firstVoyageUtils';

export const minutesAt = (
  year: number,
  month: number,
  day: number,
  hour = 10,
  minute = 0,
) =>
  (Date.UTC(year, month - 1, day, hour, minute) - Date.UTC(1522, 4, 17)) /
  60_000;

export const portAnchors = {
  '1': { x: 838, y: 358 },
  '57': { x: 558, y: 642 },
  '75': { x: 1148, y: 528 },
  '99': { x: 1714, y: 390 },
  '100': { x: 1674, y: 402 },
} as const;

const base = completedM1Fixture();

export const completedM2Fixture = (
  overrides: Partial<State> = {},
): Partial<State> & { version: number } => ({
  ...base,
  version: SAVE_VERSION,
  portId: '75',
  buildingId: null,
  timePassed: minutesAt(1522, 6, 1),
  dayAtSea: 0,
  storyEvents: [
    ...(base.storyEvents ?? []),
    'joao.conflict-and-growth.chapter-complete',
  ],
  storyEventTimes: {},
  combatResults: {},
  activeCombat: null,
  equipment: { weaponId: null, armorId: null },
  mateProgress: {},
  ...overrides,
});

export const visitM3Fixture = (overrides: Partial<State> = {}) =>
  cy.visit('', {
    onBeforeLoad(window) {
      window.localStorage.setItem('uw2.locale', 'zh-CN');
      window.localStorage.setItem('uw2.e2e.locale', 'zh-CN');
      window.localStorage.setItem(
        SAVED_STATE_KEY,
        JSON.stringify(completedM2Fixture(overrides)),
      );
    },
  });

export const relocateM3Fixture = (
  portId: keyof typeof portAnchors,
  buildingId: string | null,
  overrides: Partial<State> = {},
) =>
  readVoyageSave().then((saved) =>
    cy.visit('', {
      onBeforeLoad(window) {
        window.localStorage.setItem(
          SAVED_STATE_KEY,
          JSON.stringify({
            ...saved,
            portId,
            buildingId,
            fleets: {
              ...saved.fleets,
              '1': {
                ...saved.fleets['1'],
                position: portAnchors[portId],
              },
            },
            ...overrides,
          }),
        );
      },
    }),
  );

export const massawaThrough = (suffix: string): string[] => {
  const order = [
    'five-day-voyage',
    'ali-massawa-lead',
    'religious-lead',
    'staff-request',
    'pietro-commissioned',
    'waiting-for-pietro',
    'invasion-authorized',
    'first-sortie-ready',
    'ottoman-one-start',
    'second-sortie-ready',
    'ottoman-two-start',
    'defense-reported',
    'staff-received',
    'staff-returned',
    'chapter-complete',
  ];
  const index = order.indexOf(suffix);
  if (index < 0) throw new Error(`Unknown Massawa milestone ${suffix}`);
  return [
    ...(base.storyEvents ?? []),
    'joao.conflict-and-growth.chapter-complete',
    ...order.slice(0, index + 1).map((part) => `joao.massawa.${part}`),
  ];
};

export const finaleThrough = (suffix: string): string[] => {
  const order = [
    'japan-request',
    'enrico-farewell',
    'letter-notice',
    'enrico-letter',
    'sakai-lead',
    'south-america-arrival',
    'rudolph-start',
    'lucia-rescued',
    'martinez-exposed',
    'spanish-alliance',
    'amazon-start',
    'amazon-victory',
    'homecoming',
  ];
  const index = order.indexOf(suffix);
  if (index < 0) throw new Error(`Unknown finale milestone ${suffix}`);
  return [
    ...massawaThrough('chapter-complete'),
    ...order.slice(0, index + 1).map((part) => `joao.finale.${part}`),
  ];
};
