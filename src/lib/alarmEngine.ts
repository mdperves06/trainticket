/**
 * Dual-tone Web Audio Siren Engine
 * Synthesizes an alternating frequency siren (960 Hz / 770 Hz square/sawtooth oscillation at 400ms intervals)
 * with mobile physical vibration support.
 * Zero external MP3 asset dependencies.
 */
class AlarmEngine {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private intervalId: number | null = null;
  private vibrationIntervalId: number | null = null;
  private isToneHigh: boolean = true;
  private running: boolean = false;

  private initAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!this.audioCtx) {
      this.audioCtx = new AudioContextClass();
    }
    return this.audioCtx;
  }

  /**
   * Starts the dual-tone audio siren and mobile vibration.
   */
  public async start(): Promise<void> {
    if (this.running || typeof window === 'undefined') return;

    const ctx = this.initAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn('AudioContext resume requires user interaction:', err);
      }
    }

    try {
      this.oscillator = ctx.createOscillator();
      this.gainNode = ctx.createGain();

      // Alternating frequency setup: 960 Hz and 770 Hz with sawtooth waveform for penetration
      this.oscillator.type = 'sawtooth';
      this.oscillator.frequency.setValueAtTime(960, ctx.currentTime);

      // Volume envelope
      this.gainNode.gain.setValueAtTime(0.3, ctx.currentTime);

      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(ctx.destination);

      this.oscillator.start();
      this.running = true;

      // Alternate tone every 400ms
      this.isToneHigh = true;
      this.intervalId = window.setInterval(() => {
        if (!this.oscillator || !this.audioCtx) return;
        this.isToneHigh = !this.isToneHigh;
        const targetFreq = this.isToneHigh ? 960 : 770;
        this.oscillator.frequency.setValueAtTime(targetFreq, this.audioCtx.currentTime);
      }, 400);

      // Trigger HTML5 physical vibration pattern on mobile devices
      this.triggerVibration();
      this.vibrationIntervalId = window.setInterval(() => {
        this.triggerVibration();
      }, 4000);
    } catch (err) {
      console.error('Failed to start alarm engine:', err);
    }
  }

  /**
   * Triggers navigator.vibrate if supported on device
   */
  private triggerVibration(): void {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([1000, 400, 1000, 400, 1000]);
      } catch {
        // Ignore devices where vibrate is restricted
      }
    }
  }

  /**
   * Stops the dual-tone siren and clears timers.
   */
  public stop(): void {
    if (!this.running) return;

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.vibrationIntervalId !== null) {
      clearInterval(this.vibrationIntervalId);
      this.vibrationIntervalId = null;
    }

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {
        // ignore
      }
    }

    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch {
        // ignore if already stopped
      }
      this.oscillator = null;
    }

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {
        // ignore
      }
      this.gainNode = null;
    }

    this.running = false;
  }

  public isPlaying(): boolean {
    return this.running;
  }
}

export const alarmEngine = new AlarmEngine();
export default alarmEngine;
