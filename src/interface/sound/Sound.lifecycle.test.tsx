import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';

import Sound from './Sound';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

jest.mock('./assets/mast-in-the-mist.ogg', () => '/bgm.ogg');

describe('Sound playback ownership', () => {
  let root: Root;
  let container: HTMLDivElement;
  let created: HTMLAudioElement[];
  let playing: Set<HTMLAudioElement>;

  beforeEach(() => {
    created = [];
    playing = new Set();

    // jsdom cannot play media. Keep real audio elements and emulate only the
    // media boundary; Sound must still own playback and release its source.
    jest.spyOn(window, 'Audio').mockImplementation(() => {
      const audio = document.createElement('audio');
      jest.spyOn(audio, 'play').mockImplementation(async () => {
        playing.add(audio);
      });
      jest.spyOn(audio, 'pause').mockImplementation(() => {
        playing.delete(audio);
      });
      jest.spyOn(audio, 'load').mockImplementation(() => {
        playing.delete(audio);
      });
      created.push(audio);
      return audio;
    });

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    jest.restoreAllMocks();
  });

  it('keeps only the current BGM after repeated load-style remounts', () => {
    const currentRoot = root;
    for (let generation = 0; generation < 4; generation += 1) {
      act(() => {
        currentRoot.render(
          <Sound key={generation} portId="1" buildingId={null} />,
        );
      });
      act(() => {
        window.dispatchEvent(new MouseEvent('click'));
      });

      expect(playing.size).toBe(1);
      expect([...playing][0].getAttribute('src')).toBe('/bgm.ogg');
    }
  });

  it('stops playback and releases its source on unmount', () => {
    act(() => root.render(<Sound portId="1" buildingId={null} />));
    act(() => {
      window.dispatchEvent(new MouseEvent('click'));
    });
    const active = [...playing][0];
    expect(playing.size).toBe(1);

    act(() => root.render(null));
    act(() => {
      window.dispatchEvent(new MouseEvent('click'));
    });

    expect(playing.size).toBe(0);
    expect(active.getAttribute('src')).toBeNull();
  });

  it('reuses one audio element across rerenders and track changes', () => {
    act(() => root.render(<Sound portId="1" buildingId={null} />));
    const original = created[0];
    act(() => {
      window.dispatchEvent(new MouseEvent('click'));
    });
    act(() => root.render(<Sound portId="1" buildingId="2" />));
    act(() => root.render(<Sound portId={null} buildingId={null} />));

    expect(created).toHaveLength(1);
    expect([...playing]).toEqual([original]);
  });

  it('cleans up playback after the StrictMode effect restart', () => {
    act(() =>
      root.render(
        <React.StrictMode>
          <Sound portId="1" buildingId={null} />
        </React.StrictMode>,
      ),
    );
    act(() => {
      window.dispatchEvent(new MouseEvent('click'));
    });
    expect(playing.size).toBe(1);

    act(() => root.render(null));
    expect(playing.size).toBe(0);
    expect(created.every((audio) => !audio.getAttribute('src'))).toBe(true);
  });
});
