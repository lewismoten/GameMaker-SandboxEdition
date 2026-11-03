// "Make it smaller": what the author picks (lossless only, or lossy with each step's strength),
// the list of fliShrink steps that makes, and the plain words for how much the result differs.
// Pure and DOM-free so it runs in the worker and in tests.
import type { ShrinkStep } from '@lewismoten/gamemaker-sandbox-tools/kit/fliShrink';

export interface ShrinkOptions {
  /** False: only the lossless step runs, whatever else is set. */
  lossy: boolean;
  /** 0 = off, else the most colors any picture may use (2 to 256). */
  maxColors: number;
  /** Keep every other frame and show each twice as long. */
  dropFrames: boolean;
  /** 0 = off, else near colors within this many (0 to 255 per channel) merge. */
  snapTolerance: number;
  /** 0 = off, else dithering between shades this close flattens. */
  ditherTolerance: number;
  /** 0 = off, else pixels that change by this little from the frame before stay put. */
  holdTolerance: number;
}

/** Starts lossless, with each lossy step set to a gentle strength for when it is switched on. */
export const DEFAULT_OPTIONS: ShrinkOptions = { lossy: false, maxColors: 0, dropFrames: false, snapTolerance: 0, ditherTolerance: 0, holdTolerance: 0 };

/** What each control starts at when the author turns it on. */
export const GENTLE = { maxColors: 64, snapTolerance: 8, ditherTolerance: 24, holdTolerance: 6 } as const;

/** The steps these options mean, in the order that works best (each on the one before's frames). */
export function stepsFor(o: ShrinkOptions): ShrinkStep[] {
  const steps: ShrinkStep[] = [{ step: 'sparsePalettes' }];
  if (!o.lossy) return steps;
  if (o.holdTolerance > 0) steps.push({ step: 'holdStill', tolerance: o.holdTolerance });
  if (o.snapTolerance > 0) steps.push({ step: 'snapColors', tolerance: o.snapTolerance });
  if (o.ditherTolerance > 0) steps.push({ step: 'flattenDither', tolerance: o.ditherTolerance });
  if (o.maxColors >= 2 && o.maxColors < 256) steps.push({ step: 'maxColors', colors: Math.round(o.maxColors) });
  if (o.dropFrames) steps.push({ step: 'dropFrames' });
  return steps;
}

export interface VisibilityNumbers {
  mean: number;
  worst: number;
  changedShare: number;
}

/** How much shows, in words, from the three numbers (compared with the original, frame for frame). */
export function describeVisibility(v: VisibilityNumbers): { level: 'identical' | 'hardly' | 'slight' | 'noticeable' | 'obvious'; words: string } {
  const pct = v.changedShare * 100;
  const share = pct < 0.1 ? 'almost no pixels differ' : `${pct < 10 ? pct.toFixed(1) : Math.round(pct)}% of the pixels differ`;
  if (v.changedShare === 0) return { level: 'identical', words: 'Looks exactly the same: no pixel differs.' };
  if (v.mean < 0.5 && v.worst < 32) return { level: 'hardly', words: `Hardly visible: ${share}, and only slightly.` };
  if (v.mean < 2 && v.worst < 80) return { level: 'slight', words: `A slight change: ${share}; look closely to see it.` };
  if (v.mean < 6) return { level: 'noticeable', words: `Noticeable: ${share}, some by a lot (up to ${Math.round(v.worst)} of 255).` };
  return { level: 'obvious', words: `Obvious: ${share}, up to ${Math.round(v.worst)} of 255.` };
}

/** "12.3 KB" for a byte count. */
export const kb = (n: number): string => `${(n / 1024).toFixed(1)} KB`;

/** "Saves 4.2 KB (31%)" or, when it grew or stayed the same, says so. */
export function describeSaved(before: number, after: number): string {
  const saved = before - after;
  if (saved <= 0) return saved === 0 ? 'The same size.' : `${kb(-saved)} bigger (${Math.round((-saved / before) * 100)}%).`;
  return `Saves ${kb(saved)} (${Math.round((saved / before) * 100)}%): ${kb(before)} to ${kb(after)}.`;
}
