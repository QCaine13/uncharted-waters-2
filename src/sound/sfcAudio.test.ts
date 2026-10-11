import {
  SfcAudioEngine,
  getSpeakerFrequency,
  SFC_AUDIO_STORAGE_KEY,
} from './sfcAudio';

describe('sfcAudio - Web Audio retro sound effects', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('speaker frequency mapping', () => {
    test('maps Duke Leon Franco to 420Hz', () => {
      expect(getSpeakerFrequency('leon')).toBe(420);
      expect(getSpeakerFrequency('duke-leon')).toBe(420);
      expect(getSpeakerFrequency('duke-franco')).toBe(420);
      expect(getSpeakerFrequency('19')).toBe(420);
      expect(getSpeakerFrequency('莱昂公爵')).toBe(420);
    });

    test('maps Rocco to 360Hz', () => {
      expect(getSpeakerFrequency('rocco')).toBe(360);
      expect(getSpeakerFrequency('32')).toBe(360);
      expect(getSpeakerFrequency('老洛克')).toBe(360);
    });

    test('maps João Ferrero to 580Hz', () => {
      expect(getSpeakerFrequency('joao')).toBe(580);
      expect(getSpeakerFrequency('1')).toBe(580);
      expect(getSpeakerFrequency('约翰·法雷尔')).toBe(580);
    });

    test('maps narrator, system, or unspecified characters to 640Hz', () => {
      expect(getSpeakerFrequency('system')).toBe(640);
      expect(getSpeakerFrequency('narrator')).toBe(640);
      expect(getSpeakerFrequency(undefined)).toBe(640);
      expect(getSpeakerFrequency('')).toBe(640);
      expect(getSpeakerFrequency('unknown-character')).toBe(640);
    });
  });

  describe('audio preference & persistence', () => {
    test('defaults to enabled when no preference is saved', () => {
      const engine = new SfcAudioEngine();
      expect(engine.isAudioEnabled()).toBe(true);
    });

    test('loads saved preference from localStorage', () => {
      localStorage.setItem(SFC_AUDIO_STORAGE_KEY, 'false');
      const engine = new SfcAudioEngine();
      expect(engine.isAudioEnabled()).toBe(false);
    });

    test('updates preference and saves to localStorage', () => {
      const engine = new SfcAudioEngine();
      engine.setAudioEnabled(false);
      expect(engine.isAudioEnabled()).toBe(false);
      expect(localStorage.getItem(SFC_AUDIO_STORAGE_KEY)).toBe('false');

      engine.setAudioEnabled(true);
      expect(engine.isAudioEnabled()).toBe(true);
      expect(localStorage.getItem(SFC_AUDIO_STORAGE_KEY)).toBe('true');
    });

    test('toggles audio enabled state', () => {
      const engine = new SfcAudioEngine();
      expect(engine.isAudioEnabled()).toBe(true);
      const next = engine.toggleAudioEnabled();
      expect(next).toBe(false);
      expect(engine.isAudioEnabled()).toBe(false);
    });

    test('notifies subscribers when audio preference changes', () => {
      const engine = new SfcAudioEngine();
      const listener = jest.fn();
      const unsubscribe = engine.subscribe(listener);

      engine.setAudioEnabled(false);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      engine.setAudioEnabled(true);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('safe degradation without AudioContext', () => {
    test('does not throw when AudioContext is undefined', () => {
      const engine = new SfcAudioEngine();
      expect(() => engine.playDialogueBeep('joao')).not.toThrow();
      expect(() => engine.playConfirmSound()).not.toThrow();
    });
  });

  describe('Web Audio synthesis with mocked AudioContext', () => {
    let mockOscillator: any;
    let mockGain: any;
    let mockAudioContext: any;
    let originalAudioContext: any;

    beforeEach(() => {
      mockOscillator = {
        type: 'sine',
        frequency: {
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn(),
        },
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
      };

      mockGain = {
        gain: {
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn(),
        },
        connect: jest.fn(),
      };

      mockAudioContext = {
        currentTime: 10,
        state: 'running',
        destination: {},
        createOscillator: jest.fn(() => mockOscillator),
        createGain: jest.fn(() => mockGain),
        resume: jest.fn().mockResolvedValue(undefined),
      };

      originalAudioContext = window.AudioContext;
      (window as any).AudioContext = jest.fn(() => mockAudioContext);
    });

    afterEach(() => {
      (window as any).AudioContext = originalAudioContext;
    });

    test('plays dialogue beep with triangle wave at character frequency', () => {
      const engine = new SfcAudioEngine();
      engine.playDialogueBeep('leon');

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockOscillator.type).toBe('triangle');
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
        420,
        10,
      );
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGain);
      expect(mockGain.connect).toHaveBeenCalledWith(
        mockAudioContext.destination,
      );
      expect(mockOscillator.start).toHaveBeenCalledWith(10);
      expect(mockOscillator.stop).toHaveBeenCalledWith(10.04);
    });

    test('plays confirmation sound with sine wave frequency sweep', () => {
      const engine = new SfcAudioEngine();
      engine.playConfirmSound();

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockOscillator.type).toBe('sine');
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
        440,
        10,
      );
      expect(
        mockOscillator.frequency.exponentialRampToValueAtTime,
      ).toHaveBeenCalledWith(880, 10.08);
      expect(mockOscillator.start).toHaveBeenCalledWith(10);
      expect(mockOscillator.stop).toHaveBeenCalledWith(10.12);
    });

    test('does not synthesize sound when disabled', () => {
      const engine = new SfcAudioEngine();
      engine.setAudioEnabled(false);

      engine.playDialogueBeep('joao');
      engine.playConfirmSound();

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });

    test('resumes suspended audio context automatically', () => {
      mockAudioContext.state = 'suspended';
      const engine = new SfcAudioEngine();
      engine.playDialogueBeep('rocco');

      expect(mockAudioContext.resume).toHaveBeenCalled();
    });
  });
});
