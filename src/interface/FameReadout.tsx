import React, { useState } from 'react';

import state from '../state/state';
import updateInterface from '../state/updateInterface';
import type { Fame } from '../state/state';

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

  /*
    Deliberately tighter than the Ingots/Coins pattern above it: three tracks
    at that pattern's label-over-value height added 180px to a HUD column
    that only has 800px of frame to live in, which pushed the bottom of the
    panel out past the game and onto the page below it. One line per track
    keeps all three visible — which is the point of the readout — inside the
    space one Coins-style entry would have taken.
   */
  return (
    <div className="mb-4">
      {fameTracks.map(({ key, label }) => (
        <div key={key} className="flex items-baseline">
          <div className="flex-1 text-sm">{label}</div>
          <div className="text-lg" data-test={`fame-${key}`}>
            {fame[key]}
          </div>
        </div>
      ))}
    </div>
  );
}
