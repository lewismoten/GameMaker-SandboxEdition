// Web Audio output for GameMaker games:
//  - Sound Blaster music (.cmf) through the OPL2 AudioWorklet,
//  - PC speaker effects (.snd) as a square wave stepping one frequency per timer tick,
//  - Sound Blaster digital effects (.voc) as AudioBuffers.
// The method names follow PLAYGAME.C (PlaySong, DoSound, PlaySbVocFile). Everything
// passes through one master gain into the shared volume node from output.ts.
import workletUrl from './music.worklet.ts?worker&url';
import type { MusicMessage } from './music.worklet';
import { CMF_GAMEMAKER_CLOCK, isCmf, parseCmf } from '../formats/cmf';
import { decodeVoc, isVoc } from '../formats/voc';
import { TICK_RATE } from './cmfPlayer';
import { output } from './output';
import { audioContext, unlock } from './context';

/** The music worklet's module, added once to the page's context. */
let worklet: Promise<void> | undefined;

export class AudioEngine {
  private ctx?: AudioContext;
  private master?: GainNode;
  private music?: AudioWorkletNode;
  private musicReady?: Promise<void>;
  private speaker?: { osc: OscillatorNode; gain: GainNode };
  private voc?: AudioBufferSourceNode;
  private vocCache = new WeakMap<Uint8Array, AudioBuffer>();
  musicEnabled = true;
  soundEnabled = true;

  /**
   * Starts the sound. The first time, call it from a user gesture's handler (iOS: inside
   * the touchend/click itself, before any await); the page's one AudioContext (context.ts)
   * is resumed there.
   */
  async resume(): Promise<void> {
    if (!this.ctx) {
      const ctx = audioContext();
      if (!ctx) return;
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(output(ctx));
      // The OPL2 emulator and CMF sequencer run inside the worklet (audio thread); this
      // side only posts load/stop/pause messages to it.
      worklet ??= ctx.audioWorklet.addModule(workletUrl);
      const master = this.master;
      this.musicReady = worklet
        .then(() => {
          if (this.master !== master) return; // disposed meanwhile
          this.music = new AudioWorkletNode(ctx, 'gm-music', { outputChannelCount: [1] });
          this.music.connect(master);
        })
        .catch((e) => console.warn('Music unavailable:', e));
    }
    if (this.ctx.state !== 'running') {
      if (navigator.userActivation?.isActive) unlock();
      await this.ctx.resume().catch(() => undefined);
    }
  }

  /** Where this engine's sound leaves it (for recording just this game's sound). */
  get node(): AudioNode | undefined {
    return this.master;
  }

  /**
   * Stops everything and lets go of the page's context (it is shared, so it stays open);
   * a later resume() starts afresh.
   */
  dispose(): void {
    this.stopAll();
    this.music?.port.postMessage({ type: 'end' } satisfies MusicMessage);
    this.music?.disconnect();
    this.master?.disconnect();
    this.music = this.master = this.ctx = undefined;
    this.musicReady = undefined;
  }

  get context(): AudioContext | undefined {
    return this.ctx;
  }

  private post(m: MusicMessage, transfer: Transferable[] = []): void {
    this.music?.port.postMessage(m, transfer);
  }

  /** PlaySong: returns false (silently, as the original did) for invalid songs. */
  async playSong(bytes: Uint8Array | undefined): Promise<boolean> {
    this.stopSong();
    if (!bytes || !isCmf(bytes) || !this.musicEnabled) return false;
    const cmf = parseCmf(bytes);
    // Playgame refused songs not converted to its 146 Hz clock.
    if (cmf.clockTicks !== CMF_GAMEMAKER_CLOCK) return false;
    await this.musicReady;
    this.post({ type: 'load', music: cmf.music.slice(), instruments: cmf.instruments.map((i) => i.slice()) });
    return true;
  }

  stopSong(): void {
    this.post({ type: 'stop' });
  }

  pauseMusic(paused: boolean): void {
    this.post({ type: 'pause', paused });
  }

  /** DoSound's PC speaker path: one frequency per 1/145.6 s tick; 0 = silence. */
  playSpeaker(freqs: ArrayLike<number>): void {
    if (!this.ctx || !this.master || !this.soundEnabled) return;
    this.stopSpeaker();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    gain.gain.value = 0;
    osc.connect(gain).connect(this.master);
    // The whole effect is scheduled up front on the audio clock, one step per timer tick.
    const t0 = this.ctx.currentTime + 0.005;
    const step = 1 / TICK_RATE;
    for (let i = 0; i < freqs.length; i++) {
      const f = freqs[i];
      const t = t0 + i * step;
      // Borland's sound() programs the PIT with 1193180 / f; very low values are inaudible.
      if (f >= 20) {
        osc.frequency.setValueAtTime(Math.min(f, 20000), t);
        gain.gain.setValueAtTime(0.12, t);
      } else gain.gain.setValueAtTime(0, t);
    }
    const end = t0 + freqs.length * step;
    gain.gain.setValueAtTime(0, end);
    osc.start(t0);
    osc.stop(end + 0.01);
    this.speaker = { osc, gain };
    osc.onended = () => {
      if (this.speaker?.osc === osc) this.speaker = undefined;
    };
  }

  stopSpeaker(): void {
    if (!this.speaker) return;
    try {
      this.speaker.osc.stop();
    } catch {
      /* already stopped */
    }
    this.speaker = undefined;
  }

  /** PlaySbVocFile: a new digital sound cuts off the previous one. */
  playVoc(bytes: Uint8Array | undefined): boolean {
    if (!this.ctx || !this.master || !bytes || !this.soundEnabled || !isVoc(bytes)) return false;
    this.stopVoc();
    let buffer = this.vocCache.get(bytes);
    if (!buffer) {
      const voc = decodeVoc(bytes);
      if (!voc.samples.length) return false;
      buffer = vocBuffer(this.ctx, voc.samples, voc.sampleRate);
      this.vocCache.set(bytes, buffer);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.master);
    src.start();
    this.voc = src;
    return true;
  }

  stopVoc(): void {
    try {
      this.voc?.stop();
    } catch {
      /* already stopped */
    }
    this.voc = undefined;
  }

  stopAll(): void {
    this.stopSong();
    this.stopSpeaker();
    this.stopVoc();
  }
}

/**
 * A VOC's samples at their own rate (Web Audio resamples them to the device's, 48000 on
 * most phones). Older Safari refuses buffers below 22050 Hz: there they are resampled here.
 */
function vocBuffer(ctx: BaseAudioContext, samples: Float32Array, rate: number): AudioBuffer {
  try {
    const b = ctx.createBuffer(1, samples.length, rate);
    b.copyToChannel(samples as Float32Array<ArrayBuffer>, 0);
    return b;
  } catch {
    const to = ctx.sampleRate;
    const n = Math.max(1, Math.floor((samples.length * to) / rate));
    const b = ctx.createBuffer(1, n, to);
    const out = b.getChannelData(0);
    const r = rate / to;
    for (let i = 0; i < n; i++) {
      const x = i * r;
      const a = Math.floor(x);
      const f = x - a;
      out[i] = (samples[a] ?? 0) * (1 - f) + (samples[a + 1] ?? samples[a] ?? 0) * f;
    }
    return b;
  }
}
