/** The only sounds the game makes itself: the two stamps. Music comes from previewPlayer. */
class StampSound {
  private ctx: AudioContext | null = null;
  private muted = false;

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  private context(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  play(kind: 'collect' | 'skip'): void {
    if (this.muted) return;
    const ctx = this.context();
    if (!ctx) return;
    const now = ctx.currentTime;
    const collect = kind === 'collect';

    // The thump of the stamp head.
    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = collect ? 'triangle' : 'sawtooth';
    thump.frequency.setValueAtTime(collect ? 145 : 115, now);
    thump.frequency.exponentialRampToValueAtTime(36, now + 0.11);
    thumpGain.gain.setValueAtTime(0.36, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    thump.connect(thumpGain).connect(ctx.destination);
    thump.start(now);
    thump.stop(now + 0.15);

    // The click of the ink pad.
    const length = Math.floor(ctx.sampleRate * 0.06);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.25)) * 0.35;
    }
    const click = ctx.createBufferSource();
    click.buffer = buffer;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = collect ? 1600 : 950;
    click.connect(lowpass).connect(ctx.destination);
    click.start(now);
  }
}

export const stampSound = new StampSound();
