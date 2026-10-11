import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

import System from './System';
import { CRT_FILTER_STORAGE_KEY, isCrtFilterEnabled } from './crtFilter';
import { sfcAudio, SFC_AUDIO_STORAGE_KEY } from '../sound/sfcAudio';

import { setLocale } from '../localization';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe('System - SFC CRT filter and retro audio settings', () => {
  beforeEach(() => {
    localStorage.clear();
    setLocale('en');
  });

  test('toggles CRT filter and persists to localStorage', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(<System />));

    const crtButton = container.querySelector(
      '[data-test="crtFilterToggle"]',
    ) as HTMLButtonElement;
    expect(crtButton).not.toBeNull();
    expect(crtButton.textContent).toContain('CRT Filter: OFF');
    expect(isCrtFilterEnabled()).toBe(false);

    act(() => {
      crtButton.click();
    });

    expect(crtButton.textContent).toContain('CRT Filter: ON');
    expect(isCrtFilterEnabled()).toBe(true);
    expect(localStorage.getItem(CRT_FILTER_STORAGE_KEY)).toBe('true');

    act(() => {
      crtButton.click();
    });

    expect(crtButton.textContent).toContain('CRT Filter: OFF');
    expect(isCrtFilterEnabled()).toBe(false);
    expect(localStorage.getItem(CRT_FILTER_STORAGE_KEY)).toBe('false');

    act(() => root.unmount());
  });

  test('toggles retro audio and persists to localStorage', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(<System />));

    const audioButton = container.querySelector(
      '[data-test="sfcAudioToggle"]',
    ) as HTMLButtonElement;
    expect(audioButton).not.toBeNull();
    expect(audioButton.textContent).toContain('Retro Audio: ON');
    expect(sfcAudio.isAudioEnabled()).toBe(true);

    act(() => {
      audioButton.click();
    });

    expect(audioButton.textContent).toContain('Retro Audio: OFF');
    expect(sfcAudio.isAudioEnabled()).toBe(false);
    expect(localStorage.getItem(SFC_AUDIO_STORAGE_KEY)).toBe('false');

    act(() => {
      audioButton.click();
    });

    expect(audioButton.textContent).toContain('Retro Audio: ON');
    expect(sfcAudio.isAudioEnabled()).toBe(true);
    expect(localStorage.getItem(SFC_AUDIO_STORAGE_KEY)).toBe('true');

    act(() => root.unmount());
  });

  test('displays localized button labels in Chinese', () => {
    setLocale('zh-CN');
    const container = document.createElement('div');
    const root = createRoot(container);

    act(() => root.render(<System />));

    const crtButton = container.querySelector(
      '[data-test="crtFilterToggle"]',
    ) as HTMLButtonElement;
    const audioButton = container.querySelector(
      '[data-test="sfcAudioToggle"]',
    ) as HTMLButtonElement;

    expect(crtButton.textContent).toContain('CRT滤镜: 关闭');
    expect(audioButton.textContent).toContain('复古音效: 开启');

    act(() => root.unmount());
  });
});
