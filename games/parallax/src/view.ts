// PARALLAX's view: one screen, 16 blocks across and 10 down, that never scrolls. Some rows
// of it are bands that slide: each band is one row of one block, and that block is a ring of
// pictures of the same band, each shifted a few pixels left of the one before (levels.ts).
// Everything else measures from here.

/** The screen in blocks. */
export const COLS = 16;
export const ROWS = 10;
/** The row Kit stands on (the path, solid) and the column and row he starts in (his feet), a few blocks above it so he drops in. */
export const GROUND_ROW = 9;
export const START: [number, number] = [8, 5];
/** The level is as wide as the screen. */
export const WIDTH = COLS;
/** The exit door's column (its bottom block is on row 8). */
export const DOOR_COL = 13;

/** A sliding band: its row, how many pixels each picture shifts it left, and how many ticks each picture shows. */
export interface Band {
  row: number;
  shift: number;
  ticks: number;
}
/** Level 1's land: far hills, the town and the fence, three speeds (pixels a tick: 0.5, 1, 4). */
export const HILLS: Band = { row: 3, shift: 2, ticks: 4 };
export const TOWN: Band = { row: 4, shift: 2, ticks: 2 };
export const FENCE: Band = { row: 5, shift: 4, ticks: 1 };
/** Level 2's sky: wisps far off and a nearer cloud (0.25 and 0.5 pixels a tick), over the same slow hills. */
export const WISPS: Band = { row: 0, shift: 2, ticks: 8 };
export const CLOUDS: Band = { row: 1, shift: 2, ticks: 4 };
/** Pixels a tick a band moves. */
export const speed = (b: Band): number => b.shift / b.ticks;
/** How many pictures a band's ring has: it comes round when the shifts add up to 20 pixels, the width of a block. */
export const ringSize = (b: Band): number => 20 / b.shift;
