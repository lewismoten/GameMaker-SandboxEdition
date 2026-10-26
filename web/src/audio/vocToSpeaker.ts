// A digitized sound (a .voc's samples) as a PC speaker sound: the 36 steps of a sound set slot,
// one tone each (1/145.6 s apart), 0 for silence. The game plays slot n's .voc on a Sound
// Blaster and its steps on a PC speaker (engine/scene.ts), so this drafts the steps from the
// .voc. The speaker plays one square wave with no volume, so each step gets the sound's
// strongest pitch, or silence where the sound is quiet.
//
// Pitch is found with the normalized square difference function and its "first peak near the
// highest" rule from Philip McLeod and Geoff Wyvill, "A Smarter Way to Find Pitch" (ICMC 2005),
// with parabolic interpolation of the peaks (NOTICE.md). Written fresh from the paper. Where
// there is no clear pitch (noise, like an explosion), the zero-crossing rate gives how bright it
// is, and the steps hop around that pitch, as the sound effect maker's noise does.
import { NUMFREQ } from '../formats/sound';

/** The PC speaker's timer tick: one step of a sound set slot lasts 1/145.6 s. */
export const SPEAKER_STEP = 1 / 145.6;
const MIN_F = 60;
const MAX_F = 8192;
/** How clear a pitch must be (NSDF peak, 0..1) to be taken as a tone, not noise. */
const CLEAR = 0.6;
/** McLeod and Wyvill's k: the first peak at least this share of the highest is the pitch. */
const K = 0.88;

export type SpeakerFit = 'start' | 'whole';

interface PitchGuess {
  /** Hz, 0 when none was found. */
  freq: number;
  /** The NSDF peak, 0..1: near 1 for a clean tone, low for noise. */
  clarity: number;
}

/** The strongest pitch in a window of samples. */
export function findPitch(x: Float32Array, rate: number): PitchGuess {
  const n = x.length;
  let mean = 0;
  for (const v of x) mean += v;
  mean /= n || 1;
  const d = Float64Array.from(x, (v) => v - mean);
  const maxLag = Math.min(n >> 1, Math.floor(rate / MIN_F));
  if (maxLag < 2) return { freq: 0, clarity: 0 };
  const nsdf = new Float64Array(maxLag + 1);
  for (let tau = 0; tau <= maxLag; tau++) {
    let r = 0;
    let m = 0;
    for (let j = 0; j + tau < n; j++) {
      r += d[j] * d[j + tau];
      m += d[j] * d[j] + d[j + tau] * d[j + tau];
    }
    nsdf[tau] = m ? (2 * r) / m : 0;
  }
  // the peaks: the highest point between each rise above zero and the next fall below it,
  // after the first fall (lag 0 always matches perfectly)
  const peaks: number[] = [];
  let tau = 1;
  while (tau <= maxLag && nsdf[tau] > 0) tau++;
  let best = -1;
  for (; tau < maxLag; tau++) {
    if (nsdf[tau] <= 0) {
      if (best >= 0) peaks.push(best);
      best = -1;
      continue;
    }
    if (best < 0 || nsdf[tau] > nsdf[best]) best = tau;
  }
  if (best >= 0 && best < maxLag) peaks.push(best);
  if (!peaks.length) return { freq: 0, clarity: 0 };
  // each peak's place and height between lags, by a parabola through it and its neighbors
  const exact = peaks.map((p) => {
    const a = nsdf[p - 1];
    const b = nsdf[p];
    const c = nsdf[p + 1];
    const den = a - 2 * b + c;
    const shift = den ? Math.max(-0.5, Math.min(0.5, (0.5 * (a - c)) / den)) : 0;
    return { lag: p + shift, height: b - 0.25 * (a - c) * shift };
  });
  const top = Math.max(...exact.map((e) => e.height));
  const pick = exact.find((e) => e.height >= K * top)!;
  return { freq: rate / pick.lag, clarity: Math.min(1, pick.height) };
}

/** How bright a window is: half its zero crossings per second (a tone's pitch, noise's center). */
export function zeroCrossingPitch(x: Float32Array, rate: number): number {
  let mean = 0;
  for (const v of x) mean += v;
  mean /= x.length || 1;
  let crossings = 0;
  for (let i = 1; i < x.length; i++) if (x[i - 1] - mean < 0 !== x[i] - mean < 0) crossings++;
  return x.length > 1 ? (crossings * rate) / (2 * (x.length - 1)) : 0;
}

const rms = (x: Float32Array) => {
  let s = 0;
  for (const v of x) s += v * v;
  return x.length ? Math.sqrt(s / x.length) : 0;
};

/**
 * The 36 PC speaker steps for a sound. `start` keeps the sound's own timing, so a long sound
 * is cut after its first quarter second; `whole` speeds a longer sound up to fit (its pitches
 * stay as they are).
 */
export function vocToSpeaker(samples: Float32Array, rate: number, fit: SpeakerFit = 'whole'): Uint16Array {
  const out = new Uint16Array(NUMFREQ);
  if (!samples.length || !rate) return out;
  const seconds = samples.length / rate;
  const step = fit === 'whole' ? Math.max(SPEAKER_STEP, seconds / NUMFREQ) : SPEAKER_STEP;
  const len = Math.max(1, Math.round(step * rate));
  // pitch is looked for in a window of at least 30 ms, so low pitches repeat a few times in it
  const win = Math.max(len, Math.round(0.03 * rate), 8);
  const around = (mid: number, w: number) => {
    const from = Math.max(0, Math.min(samples.length - w, mid - (w >> 1)));
    return samples.subarray(from, Math.min(samples.length, from + w));
  };
  const mids: number[] = [];
  for (let i = 0; i < NUMFREQ; i++) {
    const mid = Math.round((i + 0.5) * step * rate);
    if (mid >= samples.length) break;
    mids.push(mid);
  }
  const frames = mids.map((m) => around(m, win));
  // loudness only switches the speaker on or off: a step quiet next to the loudest is silence
  const levels = mids.map((m) => rms(around(m, len)));
  const loudest = Math.max(0, ...levels);
  const gate = Math.max(0.02, loudest * 0.12);
  let seed = 0x2f6b;
  const hop = () => ((seed = (seed * 1103515245 + 12345) >>> 0), 0.6 + ((seed >>> 8) % 1000) / 1000);
  frames.forEach((f, i) => {
    if (levels[i] < gate) return;
    const p = findPitch(f, rate);
    const freq = p.clarity >= CLEAR ? p.freq : zeroCrossingPitch(f, rate) * hop();
    out[i] = freq ? Math.max(40, Math.min(MAX_F, Math.round(freq))) : 0;
  });
  return out;
}
