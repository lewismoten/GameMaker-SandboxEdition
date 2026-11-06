// HEAT WAVES' view: one screen, 16 blocks across and 10 down. Levels 1 and 3 never scroll; level 2
// is a long road that scrolls as Kit walks right (PLAYGAME runs the view on ahead of him). Rows 4 to 6
// are the far hills, the rows the heat makes wobble; the signs hang above them in the sky, and
// Kit walks the road below them, so nothing he reads ever wobbles.
// Everything else measures from here.

/** The screen in blocks. */
export const COLS = 16;
export const ROWS = 10;
/** The road (solid) that Kit walks on, and where he starts (his feet): mid-screen, a few blocks above the road, so he
 * drops in (PLAYGAME puts the view so the hero starts in the middle of it, so that cell is where the level's screen starts). */
export const GROUND_ROW = 9;
export const START: [number, number] = [8, 5];
/** The exit door's column in the one-screen levels (its bottom block is on row 8). */
export const DOOR_COL = 14;
/** Level 2's road: its width in blocks, the rock wall that ends it, the door before the wall, and the
 * desert drawn on past the wall so the view that runs ahead of Kit never shows the end of the map. */
export const LONG = { width: 60, wall: 47, door: 46 } as const;
/** Level 2's puddles: the left block of each (each is two blocks wide), on the road. PLAYGAME's attack range is
 * 8 blocks across, and the view runs about 11 blocks ahead of a walking hero, so each shows for a few steps. */
export const PUDDLES = [24, 38] as const;
/** Level 2's two signs (their left block). */
export const LONG_SIGNS = { puddle: 10, mirage: 20 } as const;
/** The rows of far hills that wobble, top to bottom. */
export const HAZE_ROWS = [4, 5, 6] as const;
/** The near rock in the middle of level 1, in front of the hills (it is close, so it never wobbles): columns 7 and 8. */
export const ROCK_COLS = [7, 8] as const;

/** Pictures in one wobble: the hills moved this many pixels right (minus is left) of where they rest, round and round. */
export const SWAY = [1, 2, 1, -1, -2, -1] as const;
/** Ticks (18.2 a second) each wobble picture shows: one whole wobble is 6 x 4 = 24 ticks, a little over a second. */
export const SWAY_TICKS = 4;
/** How many pictures each row of hills starts behind the row under it, where the wobble climbs. */
export const LAG = 1;
