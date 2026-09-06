import { playAudio } from './Sound';

describe('playAudio', () => {
  it('accepts an interrupted play request when a new track starts loading', async () => {
    const audio = {
      play: () =>
        Promise.reject(
          new DOMException(
            'The play() request was interrupted by a new load request.',
            'AbortError',
          ),
        ),
    } as HTMLAudioElement;

    await expect(playAudio(audio)).resolves.toBeUndefined();
  });

  it('keeps unexpected playback failures visible', async () => {
    const failure = new DOMException('Playback failed.', 'NotSupportedError');
    const audio = {
      play: () => Promise.reject(failure),
    } as HTMLAudioElement;

    await expect(playAudio(audio)).rejects.toBe(failure);
  });
});
