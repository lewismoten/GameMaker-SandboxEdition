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

  /** Must be called from a user gesture the first time (browser autoplay rules). */
  async resume(): Promise<void> {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(output(this.ctx));
      // The OPL2 emulator and CMF sequencer run inside the worklet (audio thread); this
      // side only posts load/stop/pause messages to it.
      this.musicReady = this.ctx.audioWorklet
        .addModule(workletUrl)
        .then(() => {
          this.music = new AudioWorkletNode(this.ctx!, 'gm-music', { outputChannelCount: [1] });
          this.music.connect(this.master!);
        })
        .catch((e) => console.warn('Music unavailable:', e));
    }
    if (this.ctx.state !== 'running') await this.ctx.resume().catch(() => undefined);
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
      buffer = this.ctx.createBuffer(1, voc.samples.length, voc.sampleRate);
      buffer.copyToChannel(voc.samples as Float32Array<ArrayBuffer>, 0);
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
