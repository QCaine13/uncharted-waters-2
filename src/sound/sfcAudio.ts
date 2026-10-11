export const SFC_AUDIO_STORAGE_KEY = 'uw2.sound_fx';

export const SPEAKER_FREQUENCIES: Record<string, number> = {
  // Duke Leon Franco (420Hz: 威严沉稳)
  leon: 420,
  'duke-leon': 420,
  'duke-franco': 420,
  '19': 420,

  // Uncle Rocco (360Hz: 豪迈粗犷)
  rocco: 360,
  '32': 360,

  // João Ferrero (580Hz: 青年英气)
  joao: 580,
  '1': 580,

  // Narrator / System / Default (640Hz: 清脆轻盈)
  system: 640,
  narrator: 640,
};

export const DEFAULT_SPEAKER_FREQUENCY = 640;

export function getSpeakerFrequency(speakerRole?: string): number {
  if (!speakerRole) {
    return DEFAULT_SPEAKER_FREQUENCY;
  }

  const normalized = speakerRole.toLowerCase().trim();
  if (SPEAKER_FREQUENCIES[normalized] !== undefined) {
    return SPEAKER_FREQUENCIES[normalized];
  }

  if (
    normalized.includes('leon') ||
    normalized.includes('莱昂') ||
    normalized.includes('公爵') ||
    normalized.includes('franco')
  ) {
    return 420;
  }
  if (normalized.includes('rocco') || normalized.includes('洛克')) {
    return 360;
  }
  if (normalized.includes('joao') || normalized.includes('约翰')) {
    return 580;
  }

  return DEFAULT_SPEAKER_FREQUENCY;
}

export class SfcAudioEngine {
  private static instance: SfcAudioEngine | null = null;

  private audioCtx: AudioContext | null = null;

  private enabled: boolean = true;

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.enabled = SfcAudioEngine.loadEnabledPreference();
  }

  public static getInstance(): SfcAudioEngine {
    if (!SfcAudioEngine.instance) {
      SfcAudioEngine.instance = new SfcAudioEngine();
    }
    return SfcAudioEngine.instance;
  }

  private static loadEnabledPreference(): boolean {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return true;
    }
    try {
      const stored = localStorage.getItem(SFC_AUDIO_STORAGE_KEY);
      if (stored === null) return true;
      return stored !== 'false';
    } catch {
      return true;
    }
  }

  public isAudioEnabled(): boolean {
    return this.enabled;
  }

  public setAudioEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(SFC_AUDIO_STORAGE_KEY, enabled ? 'true' : 'false');
      } catch {
        // Safe fallback in restricted environments
      }
    }
    this.listeners.forEach((listener) => listener());
  }

  public toggleAudioEnabled(): boolean {
    const next = !this.isAudioEnabled();
    this.setAudioEnabled(next);
    return next;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioContextClass) {
        return null;
      }

      try {
        this.audioCtx = new AudioContextClass();
      } catch {
        return null;
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  /**
   * Synthesize classic SFC triangle wave dialogue beep (40ms, gentle exponential decay).
   */
  public playDialogueBeep(speakerRole?: string): void {
    if (!this.enabled) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const frequency = getSpeakerFrequency(speakerRole);
      const startTime = ctx.currentTime;
      const duration = 0.04; // 40ms

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, startTime);

      // Volume envelope: soft attack, exponential decay to prevent clicks
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // Safe no-op on audio synthesis issues
    }
  }

  /**
   * Synthesize classic dual-frequency / sine sweep confirmation sound (440Hz -> 880Hz).
   */
  public playConfirmSound(): void {
    if (!this.enabled) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const startTime = ctx.currentTime;
      const duration = 0.12;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, startTime);
      osc.frequency.exponentialRampToValueAtTime(880, startTime + 0.08);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // Safe no-op on audio synthesis issues
    }
  }
}

export const sfcAudio = SfcAudioEngine.getInstance();
