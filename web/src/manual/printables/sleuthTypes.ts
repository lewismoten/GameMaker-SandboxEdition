// Final Curtain's two kinds of paper in games/sleuth/printables.json: the spyglass to cut out
// and the evidence sheet of fingerprints that only shows through red film. (Kept apart from
// types.ts, which unions them in.)
import type { ItemBase } from './types';
import type { PrintPattern } from './fingerprint';

/** A paper spyglass in black ink with a round lens hole for red cellophane; on screen it is the red film. */
export interface SpyglassItem extends ItemBase {
  kind: 'spyglass';
  heading?: string;
  /** What to do with it, in order. */
  steps: string[];
  /** A line under the drawing. */
  caption?: string;
}

/** One suspect's inked print. */
export interface SuspectPrint {
  name: string;
  role: string;
  pattern: PrintPattern;
  seed: number;
  /** Ridges across the print. */
  ridges: number;
}

/** Fingerprints printed in the hidden ink: five suspects' cards and the print lifted from the dagger. */
export interface PrintsItem extends ItemBase {
  kind: 'prints';
  heading?: string;
  intro?: string;
  suspects: SuspectPrint[];
  /** The lifted print: which suspect's (an index) it is, turned and shifted, smudged by `seed`. */
  lifted: { label: string; suspect: number; turn: number; shift: [number, number]; seed: number };
  /** What the "Tell me the answer" says (screen only), with `{name}` for the matching suspect. */
  tell: string;
}
