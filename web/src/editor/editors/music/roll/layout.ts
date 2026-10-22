// The piano roll's measurements (keyboard width, ruler, instrument lane, velocity lane), note
// names, and the kinds of drag a pointer can be doing.
import { programChanges } from '../../../../formats/cmfEdit';
import { type Note } from '../../../../formats/cmfSong';
import type { MusicDoc } from '../doc';

export const KEYW = 46;
export const RULER = 18;
export const LANE = 16;
export const HEAD = RULER + LANE;
/** Height of the velocity lane at the bottom. */
export const VEL = 64;
export const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const BLACK = [1, 3, 6, 8, 10];

export const noteName = (k: number) => `${NAMES[k % 12]}${Math.floor(k / 12) - 1}`;

export type Drag =
  | { kind: 'move'; notes: Note[]; orig: Map<Note, { start: number; len: number; key: number }>; t0: number; k0: number; grab: Note; changed: boolean }
  | { kind: 'resize'; notes: Note[]; orig: Map<Note, { start: number; len: number; key: number }>; t0: number; grab: Note; changed: boolean }
  | { kind: 'marquee'; x0: number; y0: number; x1: number; y1: number; base: Set<Note> }
  | { kind: 'erase'; changed: boolean }
  | { kind: 'pan'; x0: number; y0: number; sx: number; top: number }
  | { kind: 'ruler'; t0: number; moved: boolean }
  | { kind: 'end'; changed: boolean }
  | { kind: 'vel'; notes: Note[]; orig: Map<Note, number>; y0: number; grab?: Note; relative: boolean; lastX: number; changed: boolean };

/** The instrument (program) the selected track plays at tick t. */
export function programAtTick(doc: MusicDoc, t: number): number {
  let p = doc.track;
  for (const e of programChanges(doc.song, doc.track)) if (e.tick <= t) p = e.a;
  return p;
}
