// Sound effects made in code: PC speaker tunes (36 frequencies, one per 1/145.6 s) for
// .SND sets, and digitized Sound Blaster samples (.VOC) from a little synthesizer.
import { encodeVoc } from '../../web/src/formats/voc';
import { NUMFREQ } from '../../web/src/formats/sound';
import { rng } from './pixels';

/** A PC speaker sound from a function of step (0..35) → Hz (0 = silence). */
export function speaker(fn: (i: number, t: number) => number): Uint16Array {
  return Uint16Array.from({ length: NUMFREQ }, (_, i) => Math.max(0, Math.min(8192, Math.round(fn(i, i / (NUMFREQ - 1))))));
}

export const SPEAKER = {
  rise: (from = 200, to = 2000) => speaker((_, t) => from * (to / from) ** t),
  fall: (from = 2000, to = 150) => speaker((_, t) => from * (to / from) ** t),
  coin: () => speaker((i) => (i < 4 ? 988 : i < 18 ? 1319 : 0)),
  hurt: () => speaker((i) => (i % 2 ? 140 : 95) * (1 - i / 60)),
  zap: () => speaker((i) => 3000 - i * 75 + (i % 3) * 300),
  chirp: () => speaker((i) => (i < 12 ? 1200 + i * 120 : 0)),
  arpeggio: (notes = [523, 659, 784, 1047]) => speaker((i) => (i < notes.length * 6 ? notes[Math.floor(i / 6)] : 0)),
  noise: (seed = 1, low = 100, high = 2000) => {
    const r = rng(seed);
    return speaker((i) => (i < 30 ? low + r() * (high - low) : 0));
  },
  warble: (base = 600, depth = 300, speed = 1.3) => speaker((i) => base + Math.sin(i * speed) * depth),
};

/** A synthesizer voice for samples: time (s) → -1..1. */
export type Synth = (t: number) => number;

export const osc = {
  sine: (hz: number | ((t: number) => number)): Synth => {
    let phase = 0;
    let last = 0;
    return (t) => {
      const f = typeof hz === 'number' ? hz : hz(t);
      phase += 2 * Math.PI * f * (t - last);
      last = t;
      return Math.sin(phase);
    };
  },
  square: (hz: number | ((t: number) => number)): Synth => {
    const s = osc.sine(hz);
    return (t) => (s(t) >= 0 ? 1 : -1);
  },
  noise: (seed = 7): Synth => {
    const r = rng(seed);
    return () => r() * 2 - 1;
  },
};

/** Renders `seconds` of a synth through an envelope (attack, decay to 0) as a .VOC. */
export function sample(seconds: number, voice: Synth, opts: { rate?: number; attack?: number; gain?: number; envelope?: (t: number) => number } = {}): Uint8Array {
  const rate = opts.rate ?? 11025;
  const n = Math.round(seconds * rate);
  const out = new Float32Array(n);
  const attack = opts.attack ?? 0.005;
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const env = opts.envelope ? opts.envelope(t / seconds) : Math.min(1, t / attack) * (1 - t / seconds) ** 1.5;
    out[i] = Math.max(-1, Math.min(1, voice(t) * env * (opts.gain ?? 0.9)));
  }
  return encodeVoc(out, rate);
}

/** Mixes synths. */
export const mix =
  (...voices: [Synth, number][]): Synth =>
  (t) =>
    voices.reduce((s, [v, g]) => s + v(t) * g, 0);
