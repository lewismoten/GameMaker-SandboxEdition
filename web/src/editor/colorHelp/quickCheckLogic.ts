// The Quick color check's screens and how its answers become suggestions. Each screen is a
// grid of tiles in one color with one tile in a different color that looks the same as the rest
// under one kind of simulated color difference. The answers only ever suggest which Color help
// settings to turn on; they are never saved. No DOM.
import type { Rgb } from '@lewismoten/gamemaker-sandbox-engine/gfx/colorVision';
import type { ColorHelp, Preview, Warn } from './colorHelpPrefs';

interface Screen {
  kind: 'rg' | 'by';
  base: Rgb;
  odd: Rgb;
  /** Which of the 9 tiles (0..8, row by row) is different. */
  at: number;
}

export const SCREENS: Screen[] = [
  { kind: 'rg', base: [90, 160, 70], odd: [150, 150, 75], at: 4 },
  { kind: 'by', base: [0, 160, 70], odd: [45, 165, 0], at: 0 },
  { kind: 'rg', base: [170, 90, 20], odd: [110, 130, 20], at: 8 },
  { kind: 'by', base: [60, 80, 230], odd: [0, 60, 255], at: 2 },
  { kind: 'rg', base: [200, 130, 160], odd: [165, 150, 165], at: 6 },
  { kind: 'by', base: [230, 110, 140], odd: [255, 120, 105], at: 5 },
];

/** An answer: the tile picked (0..8), or -1 for "I can't tell". */
export type Answer = number;

export const isHit = (s: Screen, a: Answer): boolean => a === s.at;

/** Settings to suggest (never to apply without being accepted), or nothing when all was easy. */
export function suggest(answers: Answer[]): Partial<ColorHelp> | undefined {
  const misses = { rg: 0, by: 0 };
  SCREENS.forEach((s, i) => {
    if (answers[i] !== undefined && !isHit(s, answers[i])) misses[s.kind]++;
  });
  const rg = misses.rg >= 2,
    by = misses.by >= 2;
  if (!rg && !by) return undefined;
  const warn: Warn = rg && by ? 'both' : rg ? 'rg' : 'by';
  const preview: Preview = rg && by ? 'all' : rg ? 'rg' : 'by';
  return { names: true, warn, preview };
}
