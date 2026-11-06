// TO THE HORIZON's view: one screen, 16 blocks across and 10 down, that never scrolls. The
// road is painted in perspective on it (the geometry is the kit's, kit/road3d.ts, as In The
// Year 2000!'s Cloud Lane and the BLASTER's data bus rides use it). Everything else measures from here.
import { roadView } from '@lewismoten/gamemaker-sandbox-tools/kit/road3d';

/** The screen in blocks, and in pixels. */
export const COLS = 16;
export const ROWS = 10;
/** The horizon's height in pixels (the top of block row 3) and the vanishing point's x (the middle of block column 8). */
export const HORIZON = 60;
export const VX = 170;
/** The road's half width at a screen row, where each lane runs, and the lines between the lanes. */
export const { halfWidth, laneX, dividerX } = roadView(HORIZON, VX, 1.2);

/** The row Lami stands on (the road's near edge) and the column and row she starts in (her feet), a few blocks above it so she drops in. */
export const GROUND_ROW = 9;
export const START: [number, number] = [8, 5];
/** The vanishing point's block: where every ball comes over the hill. */
export const HORIZON_ROW = 3;
export const VP: [number, number] = [8, HORIZON_ROW];
/** Off the right edge of the screen, where nobody sees them: lane k's spawner sits at (SPAWN_COL + k, HORIZON_ROW). */
export const SPAWN_COL = 18;
/** The level is this many blocks wide (the screen, then the spawners) and as high as the screen. */
export const WIDTH = 21;
/** The exit door's column (its bottom block is on row 8). */
export const DOOR_COL = 13;
