import React, { useState, useEffect } from 'react';
import { save, load, reset, hasSave } from '../state/saveLoad';
import { updateGeneral } from '../state/actionsPort';
import { setLocale, t, type Locale } from '../localization';
import useLocale from '../localization/useLocale';
import { useCrtFilter, toggleCrtFilter } from './crtFilter';
import { sfcAudio } from '../sound/sfcAudio';

export default function System() {
  const locale = useLocale();
  const crtFilter = useCrtFilter();
  const [audioOn, setAudioOn] = useState(() => sfcAudio.isAudioEnabled());
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(
    () =>
      sfcAudio.subscribe(() => {
        setAudioOn(sfcAudio.isAudioEnabled());
      }),
    [],
  );

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  };

  const handleSave = () => {
    save();
    showMessage('Game saved.');
  };

  const handleLoad = () => {
    if (hasSave()) {
      const success = load();
      if (success) {
        updateGeneral();
      }
      showMessage(success ? 'Game loaded.' : 'Failed to load save.');
    } else {
      showMessage('No save data found.');
    }
  };

  const handleReset = () => {
    if (confirmingReset) {
      reset();
    } else {
      setConfirmingReset(true);
      showMessage('Click Reset again to confirm.');
      setTimeout(() => setConfirmingReset(false), 3000);
    }
  };

  const handleToggleCrt = () => {
    const next = toggleCrtFilter();
    showMessage(next ? 'CRT Filter: ON' : 'CRT Filter: OFF');
  };

  const handleToggleAudio = () => {
    const next = sfcAudio.toggleAudioEnabled();
    showMessage(next ? 'Retro Audio: ON' : 'Retro Audio: OFF');
  };

  return (
    <div className="p-3">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="rounded bg-yellow-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-600"
          onClick={handleSave}
        >
          {t('Save')}
        </button>
        <button
          type="button"
          className="rounded bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
          onClick={handleLoad}
        >
          {t('Load')}
        </button>
        <button
          type="button"
          className={`rounded px-3 py-1.5 text-sm font-medium text-white ${
            confirmingReset
              ? 'bg-red-500 hover:bg-red-400'
              : 'bg-red-700 hover:bg-red-600'
          }`}
          onClick={handleReset}
        >
          {t(confirmingReset ? 'Confirm Reset?' : 'Reset')}
        </button>
        <button
          type="button"
          className={`rounded px-3 py-1.5 text-sm font-medium text-white ${
            crtFilter
              ? 'bg-emerald-700 hover:bg-emerald-600'
              : 'bg-stone-700 hover:bg-stone-600'
          }`}
          onClick={handleToggleCrt}
          data-test="crtFilterToggle"
        >
          {t(crtFilter ? 'CRT Filter: ON' : 'CRT Filter: OFF')}
        </button>
        <button
          type="button"
          className={`rounded px-3 py-1.5 text-sm font-medium text-white ${
            audioOn
              ? 'bg-emerald-700 hover:bg-emerald-600'
              : 'bg-stone-700 hover:bg-stone-600'
          }`}
          onClick={handleToggleAudio}
          data-test="sfcAudioToggle"
        >
          {t(audioOn ? 'Retro Audio: ON' : 'Retro Audio: OFF')}
        </button>
        <label className="mt-2 text-sm" htmlFor="locale-select">
          {t('Language')}
        </label>
        <select
          id="locale-select"
          className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white"
          value={locale}
          onChange={(event) => setLocale(event.target.value as Locale)}
        >
          <option value="zh-CN">简体中文</option>
          <option value="en">English</option>
        </select>
      </div>
      {message && (
        <div className="mt-2 text-xs text-gray-300">{t(message)}</div>
      )}
    </div>
  );
}
