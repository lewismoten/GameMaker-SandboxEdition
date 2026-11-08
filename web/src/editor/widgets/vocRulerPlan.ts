// Where the zones, ticks and marks of the .VOC time ruler go, as fractions of the sound's length
// (0 to 1). Pure, so it is tested without a DOM. Drawn by vocRuler.ts.
import { TICK_MS, VOC_LIKELY_BYTES, VOC_MAX_BYTES, VOC_MAYBE_BYTES, vocBytesFor } from '../../audio/vocLimit';

interface RulerPlan {
  /** Start of the yellow zone and of the red zone (1 = not reached). */
  yellowAt: number;
  redAt: number;
  /** Where the 64 KB line falls, or undefined when the sound is smaller. */
  limitAt?: number;
  /** Whole seconds with their position. */
  seconds: { s: number; at: number }[];
  /** Game ticks (only for short sounds, where they stay readable). */
  ticks: number[];
}

export function rulerPlan(samples: number, rate: number): RulerPlan {
  const n = Math.max(1, samples);
  const secs = n / rate;
  const frac = (bytes: number) => Math.min(1, Math.max(0, (bytes - vocBytesFor(0)) / n));
  const ticks: number[] = [];
  if (secs <= 6) for (let t = 1; t * (TICK_MS / 1000) < secs; t++) ticks.push((t * (TICK_MS / 1000)) / secs);
  const seconds: { s: number; at: number }[] = [];
  for (let s = 1; s < secs; s += Math.max(1, Math.ceil(secs / 12))) seconds.push({ s, at: s / secs });
  return {
    yellowAt: frac(VOC_MAYBE_BYTES),
    redAt: frac(VOC_LIKELY_BYTES),
    limitAt: vocBytesFor(n) > VOC_MAX_BYTES ? frac(VOC_MAX_BYTES) : undefined,
    seconds,
    ticks,
  };
}
