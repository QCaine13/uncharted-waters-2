import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

import CharacterPortrait from './CharacterPortrait';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('../../assets', () => ({
  __esModule: true,
  default: {
    characters: (id: string) => `portrait:${id}`,
  },
}));

// image imports resolve to identity-obj-proxy in jest; the component uses
// them as img src strings, so stub the generated manifest module instead
jest.mock('../../game/images/hd/hdManifest', () => ({
  hdPortraits: { '1': 'hd:farrell-son' },
}));

const render = ({
  portraitId,
  name,
}: {
  portraitId?: string;
  name: string;
}) => {
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() =>
    root.render(<CharacterPortrait portraitId={portraitId} name={name} />),
  );
  return container;
};

describe('CharacterPortrait', () => {
  it('renders the HD portrait when one exists for the id', () => {
    const container = render({ portraitId: '1', name: 'Joao' });
    const img = container.querySelector(
      '[data-test=character-portrait-hd]',
    ) as HTMLImageElement;

    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('hd:farrell-son');
  });

  it('falls back to the legacy slice for ids without HD art', () => {
    const container = render({ portraitId: '19', name: 'Mate' });
    const img = container.querySelector('img') as HTMLImageElement;

    expect(img).not.toBeNull();
    expect(img.getAttribute('data-test')).toBeNull();
    expect(img.getAttribute('src')).toBe('portrait:19');
  });

  it('renders the initials placeholder without a portraitId', () => {
    const container = render({ name: 'Enrico Malini' });
    const placeholder = container.querySelector(
      '[data-test=character-portrait-placeholder]',
    );

    expect(placeholder?.textContent).toBe('EM');
  });
});
