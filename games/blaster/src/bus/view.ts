// The data bus rides' view from behind the BLASTER: one screen that never scrolls, drawn in
// perspective (kit/road3d.ts, as In The Year 2000!'s Cloud Lane is). The bus runs from the
// destination chip on the horizon down to the bottom of the screen, widening as it comes;
// three lanes, the ship's three places. The blocks (busBlocks.ts), the oncoming traffic
// (busSprites.ts) and its paths (busMonsters.ts) all measure from here.
import { roadView } from '../../../kit/road3d';

/** The horizon's height on the screen, in pixels (the top of block row 3). */
export const HORIZON = 60;
/** The vanishing point's x: the middle of block column 8, where the ship starts. */
export const VX = 170;

/** The bus's half width at a screen row, where each lane runs, and the lines between them. */
export const { halfWidth, laneX, dividerX } = roadView(HORIZON, VX, 1.2);

/** The ship's three lanes, as block columns on row 5 (left, middle, right). */
export const LANE_COLS = [6, 8, 10] as const;
/** The ship's row, and the row of look-alike wall it pushes against. */
export const SHIP_ROW = 5;
export const WALL_ROW = 4;
/** Traffic comes over the horizon on row 3; the vanishing point's cell. */
export const HORIZON_ROW = 3;
export const VP: [number, number] = [8, HORIZON_ROW];
/** The way out opens over the middle lane, straight into the chip. */
export const EXIT_COL = 8;
/** Screen columns and rows (the map's top-left corner is the screen's). */
export const COLS = 16;
export const ROWS = 10;
/** Where the spawners sit, off the right edge: lane k's at (SPAWN_COL + k, HORIZON_ROW); the dashes' below. */
export const SPAWN_COL = 18;
export const DASH_SPAWN: [number, number][] = [
  [18, 5],
  [20, 5],
];
/** Ticks between the dashes on the lane lines. */
export const DASH_EVERY = 8;
