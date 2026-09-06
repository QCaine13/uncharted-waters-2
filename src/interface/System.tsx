import React, { useState } from 'react';
import { save, load, reset, hasSave } from '../state/saveLoad';
import { updateGeneral } from '../state/actionsPort';
import { setLocale, t, type Locale } from '../localization';
import useLocale from '../localization/useLocale';

export default function System() {
  const locale = useLocale();
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

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
