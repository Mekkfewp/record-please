import type { GrooveConfig } from '../types/game';

const SCALES: Record<GrooveConfig['mode'], number[]> = {
  dorian: [0, 2, 3, 5, 7, 9, 10, 12],
  minor: [0, 2, 3, 5, 7, 8, 10, 12],
  major7: [0, 2, 4, 7, 9, 11, 12, 14],
  mixolydian: [0, 2, 4, 5, 7, 9, 10, 12],
  phrygian: [0, 1, 3, 5, 7, 8, 10, 12],
  pentatonic: [0, 3, 5, 7, 10, 12, 15, 17],
};

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

class SoundDeskEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private loopTimer: number | null = null;
  private crackleTimer: number | null = null;
  private currentTrackId: string | null = null;
  private stepIndex = 0;
  private listeners = new Set<() => void>();

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  isMuted(): boolean {
    return this.muted;
  }

  getPlayingTrackId(): string | null {
    return this.currentTrackId;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopGroove();
    }
    this.notify();
    return this.muted;
  }

  playPaperSlide(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const dur = 0.14;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.22;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(1900, ctx.currentTime + dur);
    filter.Q.value = 1.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  playStampClunk(kind: 'approve' | 'pass' | 'bookmark'): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Heavy mechanical wood/metal stamp impact thump
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = kind === 'approve' ? 'triangle' : 'sawtooth';
    const startFreq = kind === 'approve' ? 145 : kind === 'pass' ? 115 : 175;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.11);

    gain.gain.setValueAtTime(0.36, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    // 2. Crisp ink-pad contact click + spring rebound
    const bufLen = Math.floor(ctx.sampleRate * 0.06);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.25)) * 0.35;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = kind === 'approve' ? 1600 : 950;
    noise.connect(lp);
    lp.connect(ctx.destination);
    noise.start(now);

    // 3. Subtle tonal confirmation chime
    const chime = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chime.type = 'square';
    const note = kind === 'approve' ? 523.25 : kind === 'bookmark' ? 659.25 : 220;
    chime.frequency.setValueAtTime(note, now + 0.05);
    if (kind === 'approve') {
      chime.frequency.setValueAtTime(659.25, now + 0.11);
    }
    chimeGain.gain.setValueAtTime(0.05, now + 0.05);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    chime.connect(chimeGain);
    chimeGain.connect(ctx.destination);
    chime.start(now + 0.05);
    chime.stop(now + 0.23);
  }

  playRulebookFlip(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.06);
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playPassportFanfare(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [392.0, 493.88, 587.33, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.09;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.11, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  stopGroove(): void {
    if (this.loopTimer !== null) {
      window.clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.crackleTimer !== null) {
      window.clearInterval(this.crackleTimer);
      this.crackleTimer = null;
    }
    if (this.currentTrackId !== null) {
      this.currentTrackId = null;
      this.notify();
    }
  }

  toggleGroove(trackId: string, groove: GrooveConfig): void {
    if (this.currentTrackId === trackId) {
      this.stopGroove();
      return;
    }
    if (this.muted) {
      this.muted = false;
    }
    this.startGroove(trackId, groove);
  }

  startGroove(trackId: string, groove: GrooveConfig): void {
    this.stopGroove();
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.currentTrackId = trackId;
    this.stepIndex = 0;
    this.notify();

    const scale = SCALES[groove.mode] ?? SCALES.dorian;
    const stepMs = Math.max(115, Math.round((60000 / groove.bpm) / 2));

    // Subtle vinyl crackle ticks
    this.crackleTimer = window.setInterval(() => {
      if (this.muted || !this.ctx) return;
      if (Math.random() > 0.45) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1800 + Math.random() * 2400, now);
        g.gain.setValueAtTime(0.009, now);
        g.gain.exponentialRampToValueAtTime(0.0005, now + 0.012);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.014);
      }
    }, 130);

    const playStep = () => {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const step = this.stepIndex % 16;
      this.stepIndex++;

      // Drum synthesis per genre
      if (step % 4 === 0 || (groove.style === 'hiphop' && step === 10)) {
        // Kick
        const kOsc = this.ctx.createOscillator();
        const kGain = this.ctx.createGain();
        kOsc.type = 'sine';
        kOsc.frequency.setValueAtTime(125, now);
        kOsc.frequency.exponentialRampToValueAtTime(42, now + 0.09);
        kGain.gain.setValueAtTime(0.18, now);
        kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        kOsc.connect(kGain);
        kGain.connect(this.ctx.destination);
        kOsc.start(now);
        kOsc.stop(now + 0.12);
      }

      if (step % 8 === 4) {
        // Snare / rimshot
        const sOsc = this.ctx.createOscillator();
        const sGain = this.ctx.createGain();
        sOsc.type = groove.style === 'jazz' ? 'triangle' : 'sawtooth';
        sOsc.frequency.setValueAtTime(groove.style === 'jazz' ? 320 : 210, now);
        sOsc.frequency.exponentialRampToValueAtTime(95, now + 0.07);
        sGain.gain.setValueAtTime(0.07, now);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        sOsc.connect(sGain);
        sGain.connect(this.ctx.destination);
        sOsc.start(now);
        sOsc.stop(now + 0.09);
      }

      // Bassline
      const bassPattern = [0, 0, 3, 0, 4, 4, 2, 5];
      if (step % 2 === 0) {
        const deg = bassPattern[(step / 2) % bassPattern.length];
        const midi = groove.rootMidi - 12 + scale[deg % scale.length];
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type =
          groove.style === 'punk-postpunk' || groove.style === 'heavy-industrial'
            ? 'sawtooth'
            : 'triangle';
        bOsc.frequency.setValueAtTime(midiToFreq(midi), now);
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = groove.style === 'electronic-idm' ? 1100 : 520;
        bGain.gain.setValueAtTime(0.11, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + stepMs / 1000);
        bOsc.connect(lp);
        lp.connect(bGain);
        bGain.connect(this.ctx.destination);
        bOsc.start(now);
        bOsc.stop(now + stepMs / 1000 + 0.02);
      }

      // Lead / Chord texture per lineage
      const melodicTriggers =
        groove.style === 'electronic-idm'
          ? [0, 3, 6, 9, 11, 14]
          : groove.style === 'shoegaze-indie'
            ? [0, 8]
            : [0, 6, 12];

      if (melodicTriggers.includes(step)) {
        const chordOffsets =
          groove.style === 'shoegaze-indie' || groove.style === 'jazz' || groove.style === 'artpop-citypop'
            ? [0, 2, 4, 6]
            : [0, 4];
        const shift = step >= 8 ? 2 : 0;
        chordOffsets.forEach((off, idx) => {
          if (!this.ctx) return;
          const m = groove.rootMidi + scale[(off + shift) % scale.length];
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type =
            groove.style === 'shoegaze-indie'
              ? 'sawtooth'
              : groove.style === 'electronic-idm'
                ? 'square'
                : 'triangle';
          osc.frequency.setValueAtTime(
            midiToFreq(m) * (groove.style === 'shoegaze-indie' && idx % 2 === 1 ? 1.004 : 1),
            now
          );
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = groove.style === 'shoegaze-indie' ? 900 : 1800;
          const dur = groove.style === 'shoegaze-indie' ? 0.65 : 0.28;
          g.gain.setValueAtTime(0.038, now);
          g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
          osc.connect(filter);
          filter.connect(g);
          g.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + dur + 0.02);
        });
      }
    };

    playStep();
    this.loopTimer = window.setInterval(playStep, stepMs);
  }
}

export const soundDesk = new SoundDeskEngine();
