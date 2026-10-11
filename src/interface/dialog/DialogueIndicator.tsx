import React from 'react';
import { classNames } from '../interfaceUtils';

interface Props {
  className?: string;
}

export default function DialogueIndicator({ className = '' }: Props) {
  return (
    <span
      className={classNames(
        'inline-block ml-1 text-[#d4a742] text-xl font-bold select-none animate-pulse',
        className,
      )}
      data-test="dialogue-next-indicator"
      aria-label="next"
    >
      ▼
    </span>
  );
}
