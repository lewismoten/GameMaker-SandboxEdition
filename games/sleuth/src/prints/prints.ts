// The stage door's fingerprint puzzle, in one place: the box's Evidence sheet and the game's
// stage-door scenes both read it. Each suspect has a pattern and a seed (the paper draws
// the ridges from them, web/src/manual/printables/fingerprint.ts), and the print lifted from
// the trick dagger is one suspect's, turned and smudged. The game only needs to know which
// card is the right one; web/src/manual/printables/sleuthPrints.test.ts keeps the box's
// printables.json in step with this file.
import type { Who } from '../art/people';

export type PrintPattern = 'whorl' | 'spiral' | 'arch' | 'tented' | 'loop-l' | 'loop-r';

export interface PrintSpec {
  who: Who;
  name: string;
  role: string;
  pattern: PrintPattern;
  seed: number;
  /** Ridges across the print's width. */
  ridges: number;
}

/** In the case's order of suspects (levels/parlor.ts SUSPECTS). */
export const PRINT_SPECS: PrintSpec[] = [
  { who: 'lila', name: 'Lila Fontaine', role: 'Leading lady', pattern: 'whorl', seed: 1936, ridges: 19 },
  { who: 'edgar', name: 'Edgar Bliss', role: 'Understudy', pattern: 'loop-l', seed: 3610, ridges: 22 },
  { who: 'agatha', name: 'Agatha Crane', role: 'Victor’s widow', pattern: 'arch', seed: 1031, ridges: 20 },
  { who: 'felix', name: 'Felix Morrow', role: 'Stage manager', pattern: 'spiral', seed: 5040, ridges: 18 },
  { who: 'pike', name: 'Oliver Pike', role: 'Critic', pattern: 'loop-r', seed: 7077, ridges: 21 },
];

/** The print lifted from the trick dagger's handle: this suspect's, turned, shifted and smudged. */
export const DAGGER_PRINT = { who: 'lila' as Who, turn: 14, shift: [0.07, -0.05] as [number, number], seed: 361 };

/** The stage door's right answer: whose card the dagger's print matches. */
export const DOOR_ANSWER: Who = DAGGER_PRINT.who;
