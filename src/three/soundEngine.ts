export class CoastalSoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled = false;
  private musicEnabled = false;

  private masterSfxGain: GainNode | null = null;
  private surfGain: GainNode | null = null;
  private surfFilter: BiquadFilterNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;

  private musicGain: GainNode | null = null;
  private musicTimerId: number | null = null;
  private nextNoteTime = 0;
  private stepIndex = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      // Ambient Ocean Surf & Spring Breeze bus
      this.masterSfxGain = this.ctx.createGain();
      this.masterSfxGain.gain.value = 0.0;
      this.masterSfxGain.connect(this.ctx.destination);

      const sr = this.ctx.sampleRate;
      const len = sr * 4;
      const buffer = this.ctx.createBuffer(1, len, sr);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.025 * white) / 1.025;
        lastOut = data[i];
        data[i] *= 2.6;
      }

      this.noiseSource = this.ctx.createBufferSource();
      this.noiseSource.buffer = buffer;
      this.noiseSource.loop = true;

      this.surfFilter = this.ctx.createBiquadFilter();
      this.surfFilter.type = 'lowpass';
      this.surfFilter.frequency.value = 420;

      this.surfGain = this.ctx.createGain();
      this.surfGain.gain.value = 0.16;

      this.noiseSource.connect(this.surfFilter);
      this.surfFilter.connect(this.surfGain);
      this.surfGain.connect(this.masterSfxGain);
      this.noiseSource.start();

      // Spring Cherry-Blossom Cycling BGM bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.0;
      this.musicGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    const ctx = enabled ? this.ensureContext() : this.ctx;
    if (!ctx || !this.masterSfxGain) return;
    const now = ctx.currentTime;
    this.masterSfxGain.gain.cancelScheduledValues(now);
    this.masterSfxGain.gain.setTargetAtTime(enabled ? 0.65 : 0.0, now, 0.12);
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    const ctx = enabled ? this.ensureContext() : this.ctx;
    if (!ctx || !this.musicGain) return;

    const now = ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setTargetAtTime(enabled ? 0.48 : 0.0, now, 0.22);

    if (enabled && this.musicTimerId === null) {
      this.nextNoteTime = ctx.currentTime + 0.05;
      this.stepIndex = 0;
      this.musicTimerId = window.setInterval(() => this.scheduleMusicSteps(), 45);
    } else if (!enabled && this.musicTimerId !== null) {
      clearInterval(this.musicTimerId);
      this.musicTimerId = null;
    }
  }

  /**
   * 94 BPM Cherry-Blossom Spring Breeze BGM (8-bar Fmaj9 -> G6 -> Em7 -> Am9 -> Dm9 -> G13 -> Cmaj9 -> C6)
   * Features warm Rhodes/piano chord arpeggios, shimmering celesta petals, and soft acoustic bass.
   */
  private scheduleMusicSteps() {
    if (!this.ctx || !this.musicGain || !this.musicEnabled) return;
    const stepDur = 60 / 94 / 2; // gentle eighth-note spring tempo (~0.319s)

    const chords: number[][] = [
      [174.61, 220.0, 261.63, 329.63, 392.0], // Fmaj9
      [196.0, 246.94, 293.66, 329.63, 440.0], // G13
      [164.81, 196.0, 246.94, 293.66, 392.0], // Em7
      [220.0, 261.63, 329.63, 392.0, 493.88], // Am9
      [146.83, 220.0, 261.63, 329.63, 349.23], // Dm9
      [196.0, 246.94, 293.66, 349.23, 440.0], // G9sus4
      [130.81, 196.0, 246.94, 293.66, 329.63], // Cmaj9
      [130.81, 196.0, 220.0, 261.63, 329.63], // C6
    ];

    // Lyrical cherry-blossom celesta & music-box melody across 64 eighth-note steps (8 bars)
    const melody: number[] = [
      // Bar 1 (Fmaj9)
      659.25, 0, 783.99, 880.0, 783.99, 0, 659.25, 587.33,
      // Bar 2 (G13)
      587.33, 0, 659.25, 783.99, 659.25, 0, 587.33, 0,
      // Bar 3 (Em7)
      783.99, 0, 880.0, 1046.5, 880.0, 0, 783.99, 659.25,
      // Bar 4 (Am9)
      659.25, 0, 587.33, 523.25, 587.33, 659.25, 783.99, 0,
      // Bar 5 (Dm9)
      880.0, 0, 783.99, 659.25, 587.33, 0, 523.25, 587.33,
      // Bar 6 (G9sus4)
      659.25, 0, 783.99, 659.25, 587.33, 0, 493.88, 0,
      // Bar 7 (Cmaj9)
      523.25, 659.25, 783.99, 0, 1046.5, 0, 880.0, 783.99,
      // Bar 8 (C6)
      659.25, 0, 587.33, 523.25, 523.25, 0, 0, 0,
    ];

    // Shimmering petal-fall wind chime accents
    const petalSparkle: number[] = [
      0, 0, 0, 1318.51, 0, 0, 1567.98, 0,
      0, 0, 1174.66, 0, 0, 1318.51, 0, 0,
      0, 0, 0, 1567.98, 0, 1318.51, 0, 0,
      0, 1046.5, 0, 0, 0, 0, 1567.98, 0,
      0, 0, 1318.51, 0, 0, 1174.66, 0, 0,
      0, 0, 0, 1567.98, 0, 0, 1174.66, 0,
      0, 0, 1567.98, 0, 0, 1760.0, 0, 0,
      0, 1318.51, 0, 0, 1046.5, 0, 0, 0,
    ];

    const bassRoots = [87.31, 98.0, 82.41, 110.0, 73.42, 98.0, 65.41, 65.41];

    while (this.nextNoteTime < this.ctx.currentTime + 0.24) {
      const s = this.stepIndex % 64;
      const bar = Math.floor(s / 8);
      const t = this.nextNoteTime;

      // 1. Lyrical Celesta / Spring Piano melody
      const melFreq = melody[s];
      if (melFreq > 0) {
        this.playCelestaNote(melFreq, t, 0.62, 0.19);
      }

      // 2. Delicate high-octave blossom wind-chime shimmer
      const sparkleFreq = petalSparkle[s];
      if (sparkleFreq > 0) {
        this.playCelestaNote(sparkleFreq, t + 0.02, 0.55, 0.055);
      }

      // 3. Soft rising arpeggio on warm electric piano across each bar
      const chord = chords[bar];
      if (s % 2 === 0) {
        const arpNote = chord[(s / 2) % chord.length];
        this.playPadChordNote(arpNote, t, 0.9, 0.065);
      }

      // 4. Warm sustained pad chord at start of each bar
      if (s % 8 === 0) {
        for (let c = 0; c < 4; c++) {
          this.playPadChordNote(chord[c], t + c * 0.025, 2.2, 0.036);
        }
        this.playWarmBass(bassRoots[bar], t, 1.35, 0.18);
      } else if (s % 8 === 5) {
        this.playWarmBass(bassRoots[bar] * 1.5, t, 0.65, 0.11);
      }

      // 5. Airy spring breeze brush on weak beats
      if (s % 2 === 1) {
        this.playShaker(t, 0.026);
      }

      this.nextNoteTime += stepDur;
      this.stepIndex++;
    }
  }

  private playCelestaNote(freq: number, t: number, dur: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const harm = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    harm.type = 'sine';
    harm.frequency.setValueAtTime(freq * 2, t);

    const harmGain = this.ctx.createGain();
    harmGain.gain.setValueAtTime(0.22, t);
    harmGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(g);
    harm.connect(harmGain);
    harmGain.connect(g);
    g.connect(this.musicGain);

    osc.start(t);
    harm.start(t);
    osc.stop(t + dur + 0.04);
    harm.stop(t + dur + 0.04);
  }

  private playWarmBass(freq: number, t: number, dur: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, t);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.035);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.04);
  }

  private playPadChordNote(freq: number, t: number, dur: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.04);
  }

  private playShaker(t: number, vol: number) {
    if (!this.ctx || !this.musicGain || !this.noiseSource?.buffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseSource.buffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 5600;
    const g = this.ctx.createGain();

    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);

    src.connect(hp);
    hp.connect(g);
    g.connect(this.musicGain);
    src.start(t, Math.random() * 2, 0.08);
  }

  public update(time: number, speedNorm: number) {
    if (!this.soundEnabled || !this.ctx || !this.surfFilter || !this.surfGain) return;
    const wave = 0.5 + 0.5 * Math.sin(time * 0.95);
    this.surfFilter.frequency.value = 260 + wave * 340 + speedNorm * 140;
    this.surfGain.gain.value = 0.12 + wave * 0.09;
  }

  public ringBell() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const triggerPing = (delay: number) => {
      const t0 = ctx.currentTime + delay;
      const partials = [
        { freq: 1568, gain: 0.22, dur: 0.75 },
        { freq: 3136, gain: 0.12, dur: 0.45 },
        { freq: 4480, gain: 0.07, dur: 0.28 },
      ];
      for (const p of partials) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(p.freq, t0);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(p.gain, t0 + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + p.dur);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + p.dur + 0.04);
      }
    };

    triggerPing(0);
    triggerPing(0.14);
  }

  public playRoar() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(215, t0);
    osc.frequency.exponentialRampToValueAtTime(108, t0 + 0.48);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(145, t0);
    osc2.frequency.exponentialRampToValueAtTime(82, t0 + 0.48);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, t0);
    filter.frequency.exponentialRampToValueAtTime(260, t0 + 0.5);
    filter.Q.value = 3.5;

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.22, t0 + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.54);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc2.start(t0);
    osc.stop(t0 + 0.56);
    osc2.stop(t0 + 0.56);
  }

  public playHop() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(210, t0);
    osc.frequency.exponentialRampToValueAtTime(540, t0 + 0.16);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.24);
  }

  public playSparkle(notes: number[]) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    notes.forEach((freq, idx) => {
      const t0 = ctx.currentTime + idx * 0.075;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.16, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.3);
    });
  }

  public dispose() {
    if (this.musicTimerId !== null) {
      clearInterval(this.musicTimerId);
      this.musicTimerId = null;
    }
    try {
      this.noiseSource?.stop();
    } catch {
      // ignore if already stopped
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
