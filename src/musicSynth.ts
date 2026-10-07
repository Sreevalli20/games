/**
 * 100% Client-Side Procedural Soundtrack Synthesizer for ECHO//9.
 * Uses Web Audio API & OfflineAudioContext.
 * Zero external API, zero network, zero cost.
 */

export interface OSTThemeInfo {
  id: string;
  name: string;
  category: string;
  bpm: number;
  description: string;
}

export const OST_THEMES: OSTThemeInfo[] = [
  {
    id: 'subway_drift',
    name: 'Subway Drift',
    category: 'Dark Ambient Drone',
    bpm: 65,
    description: 'Deep subterranean sub-bass with modulating low-pass filters and evolving resonance sweeps.',
  },
  {
    id: 'temporal_anomaly',
    name: 'Temporal Anomaly',
    category: 'Glitch Synth Pulse',
    bpm: 118,
    description: 'Hypnotic arpeggiated bass sequence with 16th-note syncopated ticks and metallic echoes.',
  },
  {
    id: 'miras_theme',
    name: "Mira's Echo",
    category: 'Ethereal Sci-Fi Ambient',
    bpm: 72,
    description: 'Melancholic D-minor 9th chords with warm analog pads and crystalline temporal chimes.',
  },
  {
    id: 'chronos_overdrive',
    name: 'Chronos Overdrive',
    category: 'Cyberpunk Action',
    bpm: 130,
    description: 'High-energy driving analog bassline with resonant filter sweeps and punchy rhythmic accents.',
  },
];

class ProceduralMusicManager {
  private audioCtx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private timerId: number | null = null;
  public currentTheme: string | null = null;
  private isMuted: boolean = false;
  private step: number = 0;

  public init(context?: AudioContext): void {
    if (this.audioCtx) return;
    this.audioCtx = context || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.musicGain = this.audioCtx.createGain();
    this.musicGain.gain.setValueAtTime(0.38, this.audioCtx.currentTime);
    this.musicGain.connect(this.audioCtx.destination);
  }

  public setVolume(vol: number): void {
    if (this.musicGain && this.audioCtx) {
      this.musicGain.gain.setTargetAtTime(this.isMuted ? 0 : vol * 0.45, this.audioCtx.currentTime, 0.05);
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.musicGain && this.audioCtx) {
      this.musicGain.gain.setTargetAtTime(muted ? 0 : 0.38, this.audioCtx.currentTime, 0.05);
    }
  }

  public playTheme(themeId: string): void {
    this.stop();
    this.init();
    if (!this.audioCtx || !this.musicGain) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.currentTheme = themeId;
    this.step = 0;

    const theme = OST_THEMES.find((t) => t.id === themeId) || OST_THEMES[0];
    const beatInterval = (60 / theme.bpm) * 1000 * 0.5; // Eighth note interval

    this.timerId = window.setInterval(() => {
      this.triggerStep(themeId);
      this.step++;
    }, beatInterval);
  }

  public stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.currentTheme = null;
  }

  private triggerStep(themeId: string): void {
    if (!this.audioCtx || !this.musicGain || this.isMuted) return;
    const now = this.audioCtx.currentTime;

    if (themeId === 'subway_drift') {
      // Ambient drone pulse every 8 steps
      if (this.step % 8 === 0) {
        this.playDroneChord([55, 110, 164.81], 3.8, now); // A1, A2, E3
      }
      if (this.step % 16 === 8) {
        this.playDroneChord([73.42, 146.83, 220], 3.8, now); // D2, D3, A3
      }
    } else if (themeId === 'temporal_anomaly') {
      // 16th arpeggiated bass sequence in D minor
      const notes = [73.42, 87.31, 110.0, 130.81, 146.83, 110.0, 87.31, 98.0];
      const freq = notes[this.step % notes.length];
      this.playSynthBass(freq, 0.22, now);

      if (this.step % 4 === 2) {
        this.playNoiseTick(now);
      }
    } else if (themeId === 'miras_theme') {
      // Warm 7th chords every 8 steps
      if (this.step % 16 === 0) {
        this.playChimeChord([146.83, 220.0, 261.63, 329.63], 3.2, now); // Dm9
      } else if (this.step % 16 === 8) {
        this.playChimeChord([116.54, 174.61, 220.0, 293.66], 3.2, now); // Bbmaj7
      }
    } else if (themeId === 'chronos_overdrive') {
      // Heavy driving bass
      const rootNotes = [73.42, 73.42, 87.31, 73.42, 98.0, 73.42, 110.0, 73.42];
      const freq = rootNotes[this.step % rootNotes.length];
      this.playSawLead(freq, 0.18, now);

      if (this.step % 4 === 0) {
        this.playSynthKick(now);
      }
    }
  }

  private playDroneChord(freqs: number[], duration: number, time: number): void {
    if (!this.audioCtx || !this.musicGain) return;
    freqs.forEach((f) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      const filter = this.audioCtx!.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, time);
      filter.frequency.exponentialRampToValueAtTime(120, time + duration);

      gain.gain.setValueAtTime(0.01, time);
      gain.gain.linearRampToValueAtTime(0.18, time + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(time);
      osc.stop(time + duration + 0.1);
    });
  }

  private playSynthBass(freq: number, duration: number, time: number): void {
    if (!this.audioCtx || !this.musicGain) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(140, time + duration);

    gain.gain.setValueAtTime(0.24, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  private playSawLead(freq: number, duration: number, time: number): void {
    if (!this.audioCtx || !this.musicGain) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq * 2, time);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  private playChimeChord(freqs: number[], duration: number, time: number): void {
    if (!this.audioCtx || !this.musicGain) return;
    freqs.forEach((f, idx) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, time + idx * 0.04);

      gain.gain.setValueAtTime(0.01, time + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.16, time + idx * 0.04 + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, time + idx * 0.04 + duration);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(time + idx * 0.04);
      osc.stop(time + idx * 0.04 + duration + 0.1);
    });
  }

  private playSynthKick(time: number): void {
    if (!this.audioCtx || !this.musicGain) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.14);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playNoiseTick(time: number): void {
    if (!this.audioCtx || !this.musicGain) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2200, time);
    osc.frequency.exponentialRampToValueAtTime(300, time + 0.03);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.005, time + 0.04);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  /**
   * Render an exportable 12-second .WAV file in-memory using OfflineAudioContext.
   */
  public async renderWav(themeId: string): Promise<Blob> {
    const sampleRate = 44100;
    const duration = 12; // 12 seconds
    const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

    const masterGain = offlineCtx.createGain();
    masterGain.gain.setValueAtTime(0.7, 0);
    masterGain.connect(offlineCtx.destination);

    // Render theme patterns into offline buffer
    const theme = OST_THEMES.find((t) => t.id === themeId) || OST_THEMES[0];
    const beatInterval = (60 / theme.bpm) * 0.5;
    const totalSteps = Math.floor(duration / beatInterval);

    for (let s = 0; s < totalSteps; s++) {
      const time = s * beatInterval;
      if (themeId === 'subway_drift') {
        if (s % 8 === 0) {
          [55, 110, 164.81].forEach((f) => {
            const osc = offlineCtx.createOscillator();
            const g = offlineCtx.createGain();
            const flt = offlineCtx.createBiquadFilter();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, time);
            flt.type = 'lowpass';
            flt.frequency.setValueAtTime(260, time);
            flt.frequency.exponentialRampToValueAtTime(110, time + 3.0);
            g.gain.setValueAtTime(0.18, time);
            g.gain.exponentialRampToValueAtTime(0.001, time + 3.0);
            osc.connect(flt);
            flt.connect(g);
            g.connect(masterGain);
            osc.start(time);
            osc.stop(time + 3.1);
          });
        }
      } else if (themeId === 'temporal_anomaly') {
        const notes = [73.42, 87.31, 110.0, 130.81, 146.83, 110.0, 87.31, 98.0];
        const osc = offlineCtx.createOscillator();
        const g = offlineCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(notes[s % notes.length], time);
        g.gain.setValueAtTime(0.24, time);
        g.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(time);
        osc.stop(time + 0.22);
      } else if (themeId === 'miras_theme') {
        if (s % 8 === 0) {
          const chords = s % 16 === 0 ? [146.83, 220.0, 261.63, 329.63] : [116.54, 174.61, 220.0, 293.66];
          chords.forEach((f, idx) => {
            const osc = offlineCtx.createOscillator();
            const g = offlineCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, time + idx * 0.04);
            g.gain.setValueAtTime(0.15, time + idx * 0.04);
            g.gain.exponentialRampToValueAtTime(0.001, time + idx * 0.04 + 2.8);
            osc.connect(g);
            g.connect(masterGain);
            osc.start(time + idx * 0.04);
            osc.stop(time + idx * 0.04 + 2.9);
          });
        }
      } else {
        const notes = [73.42, 73.42, 87.31, 73.42, 98.0, 73.42, 110.0, 73.42];
        const osc = offlineCtx.createOscillator();
        const g = offlineCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(notes[s % notes.length] * 2, time);
        g.gain.setValueAtTime(0.18, time);
        g.gain.exponentialRampToValueAtTime(0.01, time + 0.16);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(time);
        osc.stop(time + 0.18);
      }
    }

    const renderedBuffer = await offlineCtx.startRendering();
    return this.bufferToWavBlob(renderedBuffer);
  }

  private bufferToWavBlob(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = buffer.length * blockAlign;
    const bufferSize = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Interleave channels
    let offset = 44;
    const channels = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    for (let i = 0; i < buffer.length; i++) {
      for (let c = 0; c < numChannels; c++) {
        const sample = Math.max(-1, Math.min(1, channels[c][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

export const proceduralMusic = new ProceduralMusicManager();
