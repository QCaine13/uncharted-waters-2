import React, { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  testId?: string;
}

/*
  One line per readout: label left, value right. The HUD column has 800px to
  live in — the height of the game frame beside it — and a stacked
  label-over-value costs 48px where this costs 28px. Every readout in the
  left column uses this so the budget stays predictable as more are added.
 */
export default function HudReadout({ label, value, testId }: Props) {
  return (
    <div className="flex items-baseline">
      <div className="flex-1 text-sm">{label}</div>
      <div className="text-xl" data-test={testId}>
        {value}
      </div>
    </div>
  );
}
