// "Make it smaller", the work itself: the chosen steps run on an FLI's bytes and the result
// encoded as the real bytes Apply would write. Pure; the worker (shrinkWorker.ts) calls it.
import { chainVisibility, decodeFli, encodeFrames, shrinkFrames, type ShrinkStep } from '@lewismoten/gamemaker-sandbox-tools/kit/fliShrink';
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
  const visibility = lossless || !last ? { mean: 0, worst: 0, changedShare: 0 } : chainVisibility(orig, last.frames);
  return {
    bytes,
    before: fli.length,
    steps: results.map((r) => ({ name: r.name, lossless: r.lossless, savedBytes: r.savedBytes, visibility: r.visibility })),
    visibility,
    lossless,
  };
}
