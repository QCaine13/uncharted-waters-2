import React from 'react';

import Assets from '../../assets';
import { classNames } from '../interfaceUtils';

interface Props {
  portraitId?: string;
  name: string;
  className?: string;
}

const initialsFor = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map((word) => Array.from(word)[0])
      .join('')
      .toUpperCase();
  }
  return Array.from(words[0] ?? '').slice(0, 2).join('').toUpperCase();
};

export default function CharacterPortrait({
  portraitId,
  name,
  className,
}: Props) {
  if (portraitId !== undefined) {
    return (
      <img src={Assets.characters(portraitId)} className={className} alt="" />
    );
  }

  return (
    <div
      className={classNames(
        'flex items-center justify-center bg-stone-200 text-stone-600 font-bold',
        className ?? '',
      )}
      role="img"
      aria-label={name}
      data-test="character-portrait-placeholder"
    >
      {initialsFor(name)}
    </div>
  );
}
