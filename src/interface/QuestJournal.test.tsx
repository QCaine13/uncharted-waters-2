import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import state from '../state/state';
import { setLocale } from '../localization';
import QuestJournal from './QuestJournal';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('../assets', () => ({
  __esModule: true,
  default: {
    images: () => ({ toDataURL: () => 'data:image/png;base64,' }),
  },
}));

test('renders completed progress and the current concrete next step', () => {
  localStorage.setItem('uw2.locale', 'en');
  state.storyEvents = ['joao.lisbon-opening.house-introduction'];
  state.discoveries = [];
  state.reportedDiscoveries = [];
  state.mates = [{ sailorId: '1', role: 0 }];
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() => root.render(<QuestJournal />));

  expect(container.querySelector('[data-test=questJournal]')).not.toBeNull();
  expect(
    container.querySelector('[data-test=journal-entry-opening-house]')
      ?.textContent,
  ).toContain('Complete');
  expect(
    container.querySelector('[data-test=journal-entry-opening-pub]')
      ?.textContent,
  ).toContain('Current objective');
  expect(container.textContent).toContain('Visit Carlotta at the Lisbon pub.');

  act(() => root.unmount());
});

test('puts the current M2 step and preparation before completed M1 history', () => {
  localStorage.setItem('uw2.locale', 'en');
  state.storyEvents = ['joao.first-voyage.chapter-complete'];
  state.discoveries = ['strait-of-gibraltar'];
  state.reportedDiscoveries = ['strait-of-gibraltar'];
  state.items = ['4'];
  state.equipment = { weaponId: null, armorId: null };
  state.combatResults = {};
  state.activeCombat = null;
  state.mates = [
    { sailorId: '1', role: 0 },
    { sailorId: '34', role: null },
  ];
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() => root.render(<QuestJournal />));

  const currentEntry = container.querySelector(
    '[data-test=journal-entry-m2-domingo-missing]',
  );
  const preparation = container.querySelector(
    '[data-test=journal-entry-m2-preparation]',
  );
  const history = container.querySelector(
    '[data-test=journal-entry-opening-house]',
  );
  expect(currentEntry?.textContent).toContain('Current objective');
  expect(preparation?.textContent).toContain('Preparation');
  expect(history?.textContent).toContain('Complete');
  const orderedIds = Array.from(
    container.querySelectorAll('[data-test^=journal-entry]'),
  ).map((entry) => entry.getAttribute('data-test'));
  expect(orderedIds.indexOf('journal-entry-m2-domingo-missing')).toBeLessThan(
    orderedIds.indexOf('journal-entry-m2-preparation'),
  );
  expect(orderedIds.indexOf('journal-entry-m2-preparation')).toBeLessThan(
    orderedIds.indexOf('journal-entry-opening-house'),
  );

  act(() => root.unmount());
});

test('puts the current M3 objective before completed M2 and M1 history after both companions depart', () => {
  setLocale('en');
  state.storyEvents = [
    'joao.first-voyage.chapter-complete',
    'joao.conflict-and-growth.chapter-complete',
  ];
  state.storyEventTimes = {};
  state.timePassed = 0;
  state.discoveries = ['strait-of-gibraltar'];
  state.reportedDiscoveries = ['strait-of-gibraltar'];
  state.items = [];
  state.equipment = { weaponId: null, armorId: null };
  state.combatResults = {};
  state.activeCombat = null;
  state.mates = [{ sailorId: '1', role: 0 }];
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() => root.render(<QuestJournal />));

  const ids = Array.from(
    container.querySelectorAll('[data-test^=journal-entry]'),
  ).map((entry) => entry.getAttribute('data-test'));
  expect(ids[0]).toBe('journal-entry-m3-five-day-voyage');
  expect(ids.indexOf('journal-entry-m3-five-day-voyage')).toBeLessThan(
    ids.indexOf('journal-entry-m2-complete'),
  );
  expect(ids.indexOf('journal-entry-m2-complete')).toBeLessThan(
    ids.indexOf('journal-entry-opening-house'),
  );
  expect(
    container.querySelector('[data-test=journal-entry-opening-house]')
      ?.textContent,
  ).toContain('Complete');
  expect(container.textContent).not.toContain('Future chapter');

  act(() => root.unmount());
});

test('interpolates the Massawa wait date through registered English and Chinese templates', () => {
  state.storyEvents = [
    'joao.first-voyage.chapter-complete',
    'joao.conflict-and-growth.chapter-complete',
    'joao.massawa.five-day-voyage',
    'joao.massawa.ali-massawa-lead',
    'joao.massawa.religious-lead',
    'joao.massawa.staff-request',
    'joao.massawa.pietro-commissioned',
    'joao.massawa.waiting-for-pietro',
  ];
  const epoch = Date.UTC(1522, 4, 17);
  state.storyEventTimes = {
    'joao.massawa.waiting-for-pietro':
      (Date.UTC(1522, 6, 20, 10) - epoch) / 60_000,
  };
  state.timePassed = (Date.UTC(1522, 7, 10, 8) - epoch) / 60_000;
  state.discoveries = [];
  state.reportedDiscoveries = [];
  state.items = [];
  state.equipment = { weaponId: null, armorId: null };
  state.combatResults = {};
  state.activeCombat = null;
  state.mates = [{ sailorId: '1', role: 0 }];
  const container = document.createElement('div');
  const root = createRoot(container);

  setLocale('en');
  act(() => root.render(<QuestJournal />));
  const wait = container.querySelector(
    '[data-test=journal-entry-m3-wait-for-pietro]',
  );
  expect(wait?.textContent).toContain('Current date: 8/10/1522');
  expect(wait?.textContent).toContain('8/11/1522');

  setLocale('zh-CN');
  act(() => root.render(<QuestJournal />));
  expect(wait?.textContent).toContain('当前日期：1522年8月10日');
  expect(wait?.textContent).toContain('1522年8月11日');
  expect(wait?.textContent).not.toContain('{currentYear}');

  act(() => root.unmount());
});

test('keeps the completed bilingual ending inside the bounded scrolling journal', () => {
  setLocale('zh-CN');
  state.storyEvents = [
    'joao.first-voyage.chapter-complete',
    'joao.conflict-and-growth.chapter-complete',
    'joao.finale.homecoming',
  ];
  state.discoveries = [];
  state.reportedDiscoveries = [];
  state.mates = [{ sailorId: '1', role: 0 }];
  const container = document.createElement('div');
  const root = createRoot(container);

  act(() => root.render(<QuestJournal />));

  const journal = container.querySelector('[data-test=questJournal]');
  expect(journal?.className).toContain('w-[720px]');
  expect(journal?.className).toContain('max-h-[560px]');
  expect(journal?.className).toContain('overflow-y-auto');
  expect(
    journal?.querySelector('[data-test=joaoEnding]')?.textContent,
  ).toContain('约翰主线已完成，仍可继续自由探索。');
  expect(
    journal?.querySelector('[data-test^=journal-entry]')?.className,
  ).not.toContain('whitespace-nowrap');

  act(() => root.unmount());
});
