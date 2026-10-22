// The walkthrough video's soundtrack, rendered offline from the sound events the game made
// (runtime.ts WalkAudio): the same OPL2 emulator and CMF sequencer the music worklet runs,
// the PC speaker's square wave one frequency per timer tick, and .voc samples, mixed as
// audio/engine.ts mixes them (everything through a 0.8 master gain).
import { Opl2 } from '../audio/opl';
import { CmfPlayer, TICK_RATE } from '../audio/cmfPlayer';
import { CMF_GAMEMAKER_CLOCK, isCmf, parseCmf } from '../formats/cmf';
import { decodeVoc, isVoc } from '../formats/voc';
import type { AudioEvent } from './runtime';

const MASTER = 0.8;
const SPEAKER = 0.12;

export class AudioRenderer {
  private opl: Opl2;
  private player: CmfPlayer;
  private untilTick = 0;
  private paused = false;
  private readonly samplesPerTick: number;
  private speaker?: { freqs: ArrayLike<number>; start: number };
  private phase = 0;
  private voc?: { samples: Float32Array; pos: number };
  private vocCache = new WeakMap<Uint8Array, Float32Array>();
  private next = 0;
  /** Samples rendered so far. */
  at = 0;

  constructor(
    private readonly events: AudioEvent[],
    readonly sampleRate = 48000,
  ) {
    this.opl = new Opl2(sampleRate);
    this.player = new CmfPlayer(this.opl);
    this.samplesPerTick = sampleRate / TICK_RATE;
  }

  /** The next `count` samples (the events up to their end must already be in the list). */
  render(count: number): Float32Array<ArrayBuffer> {
    const out = new Float32Array(count);
    let i = 0;
    while (i < count) {
      // apply the events due by this sample
      while (this.next < this.events.length && this.sampleOf(this.events[this.next].t) <= this.at + i) this.apply(this.events[this.next++], this.at + i);
      const nextEvent = this.next < this.events.length ? this.sampleOf(this.events[this.next].t) - this.at : count;
      const n = Math.max(1, Math.min(count, nextEvent) - i);
      this.mix(out, i, n);
      i += n;
    }
    this.at += count;
    for (let k = 0; k < count; k++) out[k] = Math.max(-1, Math.min(1, out[k]));
    return out;
  }

  private sampleOf(ms: number): number {
    return Math.round((ms / 1000) * this.sampleRate);
  }

  private apply(e: AudioEvent, now: number): void {
    switch (e.kind) {
      case 'song': {
        const b = e.bytes;
        if (!b || !isCmf(b)) return;
        const cmf = parseCmf(b);
        if (cmf.clockTicks !== CMF_GAMEMAKER_CLOCK) return;
        this.player.load(cmf.music.slice(), cmf.instruments.map((x) => x.slice()));
        this.untilTick = 0;
        return;
      }
      case 'stopSong':
        this.player.stop();
        return;
      case 'pause':
        this.paused = e.paused;
        return;
      case 'speaker':
        // scheduled 5 ms ahead, as the engine does
        this.speaker = { freqs: e.freqs, start: now + Math.round(0.005 * this.sampleRate) };
        return;
      case 'stopSpeaker':
        this.speaker = undefined;
        return;
      case 'voc': {
        const b = e.bytes;
        this.voc = undefined;
        if (!b || !isVoc(b)) return;
        let s = this.vocCache.get(b);
        if (!s) {
          const v = decodeVoc(b);
          s = resample(v.samples, v.sampleRate, this.sampleRate);
          this.vocCache.set(b, s);
        }
        if (s.length) this.voc = { samples: s, pos: 0 };
        return;
      }
      case 'stopVoc':
        this.voc = undefined;
    }
  }

  private mix(out: Float32Array, from: number, n: number): void {
    // music
    if (!this.paused) {
      let i = from;
      const end = from + n;
      const buf = new Float32Array(n);
      let b = 0;
      while (i < end) {
        if (this.untilTick <= 0) {
          this.player.tick();
          this.untilTick += this.samplesPerTick;
        }
        const k = Math.min(end - i, Math.ceil(this.untilTick));
        this.opl.render(buf.subarray(b, b + k));
        this.untilTick -= k;
        i += k;
        b += k;
      }
      for (let k = 0; k < n; k++) out[from + k] += buf[k] * MASTER;
    }
    // PC speaker
    const sp = this.speaker;
    if (sp) {
      const step = this.sampleRate / TICK_RATE;
      for (let k = 0; k < n; k++) {
        const t = this.at + from + k - sp.start;
        if (t < 0) continue;
        const idx = Math.floor(t / step);
        if (idx >= sp.freqs.length) {
          this.speaker = undefined;
          break;
        }
        const f = sp.freqs[idx];
        if (f < 20) continue;
        this.phase = (this.phase + Math.min(f, 20000) / this.sampleRate) % 1;
        out[from + k] += (this.phase < 0.5 ? SPEAKER : -SPEAKER) * MASTER;
      }
    }
    // digitized sound
    const v = this.voc;
    if (v) {
      const k = Math.min(n, v.samples.length - v.pos);
      for (let j = 0; j < k; j++) out[from + j] += v.samples[v.pos + j] * MASTER;
      v.pos += k;
      if (v.pos >= v.samples.length) this.voc = undefined;
    }
  }
}

/** Linear interpolation to another sample rate. */
export function resample(src: Float32Array, from: number, to: number): Float32Array {
  if (!from || from === to) return src.slice();
  const n = Math.floor((src.length * to) / from);
  const out = new Float32Array(n);
  const r = from / to;
  for (let i = 0; i < n; i++) {
    const x = i * r;
    const a = Math.floor(x);
    const f = x - a;
    out[i] = (src[a] ?? 0) * (1 - f) + (src[a + 1] ?? src[a] ?? 0) * f;
  }
  return out;
}
