import React, { useState } from 'react';

import state from '../state/state';
import updateInterface from '../state/updateInterface';
import type { Fame } from '../state/state';
import HudReadout from './HudReadout';

const fameTracks: { key: keyof Fame; label: string }[] = [
  { key: 'adventure', label: 'Adventure' },
  { key: 'pirate', label: 'Pirate' },
  { key: 'trade', label: 'Trade' },
];

// All three tracks are shown even though only adventure currently has a
// source (design spec section 4) — one appearing only once it first changes
// would read as a bug, since all three are already real persisted state.
export default function FameReadout() {
  const [fame, setFame] = useState<Fame>(() => ({ ...state.fame }));

  updateInterface.fame = (nextFame) => {
    setFame(nextFame);
  };

  return (
    <div className="mb-4">
      {fameTracks.map(({ key, label }) => (
        <HudReadout
          key={key}
          label={label}
          value={fame[key]}
          testId={`fame-${key}`}
        />
      ))}
    </div>
  );
}
