// The Cloud Lane's view from behind Grandpa's flying CitiCar: one screen that never scrolls,
// drawn in perspective. The sky lane runs from the vanishing point on the horizon down to
// the bottom of the screen, widening as it comes; three lanes, the car's three places. The
// blocks (sky.ts), the oncoming traffic (skySprites.ts) and its paths (skyMonsters.ts) all
// measure from here, so the picture and the things moving over it line up.

/** The horizon's height on the screen, in pixels (the top of block row 3). */
export const HORIZON = 60;
/** The vanishing point's x: the middle of block column 8, where the car starts. */
export const VX = 170;
/** How fast the lane widens: its half width is SPREAD x (y - HORIZON). */
const SPREAD = 1.2;

/** The lane's half width at screen row y (its rails sit at VX +- this). */
export const halfWidth = (y: number) => Math.max(0, (y - HORIZON) * SPREAD);

/** Where lane k (-1 left, 0 middle, 1 right) runs at screen row y: two thirds of the way out for the side lanes. */
export const laneX = (k: number, y: number) => VX + (k * 2 * halfWidth(y)) / 3;

/** Where the dashed lines between the lanes run (side -1 or 1). */
export const dividerX = (side: number, y: number) => VX + (side * halfWidth(y)) / 3;

/** The car's three lanes, as block columns on row 5 (left, middle, right). */
export const LANE_COLS = [6, 8, 10] as const;
/** The car's row, and the row of invisible wall it pushes against. */
export const CAR_ROW = 5;
export const WALL_ROW = 4;
/** Traffic comes over the horizon on row 3, one cell per lane. */
export const HORIZON_ROW = 3;
export const HORIZON_COLS = [7, 8, 9] as const;
/** The exit ramp opens over the right lane. */
export const EXIT_COL = 10;
