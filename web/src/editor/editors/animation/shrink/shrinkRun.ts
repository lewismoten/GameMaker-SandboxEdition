// "Make it smaller", the work itself: the chosen steps run on an FLI's bytes and the result
// encoded as the real bytes Apply would write. Pure; the worker (shrinkWorker.ts) calls it.
import { decodeFli, encodeFrames, shrinkFrames, type ShrinkStep } from '@lewismoten/gamemaker-sandbox-tools/kit/fliShrink';
import type { VisibilityNumbers } from './shrinkOptions';

export interface ShrinkOutcome {
  bytes: Uint8Array;
  before: number;
  /** Every step in order with what it did on its own. */
  steps: { name: string; lossless: boolean; savedBytes: number; visibility: VisibilityNumbers }[];
  /** What shows, original against the end result. */
  visibility: VisibilityNumbers;
  lossless: boolean;
}

/** Runs the steps on an FLI's bytes; the result is exactly the bytes Apply would write. */
export function shrinkFli(fli: Uint8Array, steps: ShrinkStep[]): ShrinkOutcome {
  const orig = decodeFli(fli);
  const results = shrinkFrames(orig, steps);
  const last = results[results.length - 1];
  const bytes = last ? encodeFrames(last.frames, last.encode) : fli;
  const lossless = results.every((r) => r.lossless);
  // each step measures against the one before, so the whole is measured here against the original
  const visibility = lossless ? { mean: 0, worst: 0, changedShare: 0 } : visibilityAgainst(results.map((r) => r.visibility));
  return {
    bytes,
    before: fli.length,
    steps: results.map((r) => ({ name: r.name, lossless: r.lossless, savedBytes: r.savedBytes, visibility: r.visibility })),
    visibility,
    lossless,
  };
}

/** The steps' own numbers combined into an upper bound on the whole change: worst is the biggest, the rest add up (capped). */
function visibilityAgainst(v: VisibilityNumbers[]): VisibilityNumbers {
  return {
    mean: Math.min(
      255,
      v.reduce((s, x) => s + x.mean, 0),
    ),
    worst: Math.min(255, Math.max(0, ...v.map((x) => x.worst))),
    changedShare: Math.min(
      1,
      v.reduce((s, x) => s + x.changedShare, 0),
    ),
  };
}
