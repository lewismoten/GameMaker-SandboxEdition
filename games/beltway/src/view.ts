// ROUND AND ROUND's view: one screen, 16 blocks across and 10 down, that never scrolls. Level 1
// is a flatbed riding a road, its scenery a few strips of blocks that slide past and start over;
// level 2 is a loop track in the sky with a car that goes round it. Everything measures from here.

/** The screen in blocks. */
export const COLS = 16;
export const ROWS = 10;
/** The row Kit stands on (the truck's deck, the ground) and the column and row he starts in (his feet), a few blocks up so he drops in. */
export const GROUND_ROW = 9;
export const START: [number, number] = [6, 5];

/**
 * Level 1's sliding strips. A strip is a tile 40 pixels wide that repeats; its blocks are the tile seen through a
 * 20-pixel window at offsets `shift` apart, each turning into the window `shift` pixels on after `ntime` ticks, the
 * last back into the first. `rows` are the block rows it fills. Near things slide faster than far ones.
 */
export interface Strip {
  rows: number[];
  shift: number;
  ntime: number;
}
export const HILLS: Strip = { rows: [2], shift: 4, ntime: 14 };
export const TREES: Strip = { rows: [3, 4], shift: 5, ntime: 2 };
export const RAIL: Strip = { rows: [8], shift: 10, ntime: 2 };
/** The tile's width and the window's. */
export const TILE = 40;
/** Level 1's exit door: a door in the back of the truck's cab (its bottom block is on row 8). */
export const DOOR_COL = 13;

/** Level 2's loop track (its top must stay below the screen's top row: PLAYGAME does not draw a monster whose cell is the top row, so the car vanished there): its middle block, the radius of the path of the car's block centers in pixels, and where the car starts (the bottom). */
export const RING = { col: 7, row: 4, radius: 58, half: 12 } as const;
export const CAR_AT: [number, number] = [7, 7];
/** The car's path as block offsets from where it starts, going round to the right and up (counterclockwise on the screen), with the way it faces (the engine's orientation: 0 as drawn, 3 turned nose up, 2 upside down, 1 nose down) on the way to each. */
export const LOOP: [number, number, number][] = [
  [2, -1, 0],
  [3, -3, 3],
  [2, -5, 3],
  [0, -6, 2],
  [-2, -5, 2],
  [-3, -3, 1],
  [-2, -1, 1],
  [0, 0, 0],
];
/** Pixels a tick the car drives. */
export const CAR_SPEED = 3;
/** Level 2's lap lamps (their blocks) and its exit door's column. */
export const LAMPS: [number, number][] = [
  [6, 4],
  [7, 4],
  [8, 4],
];
export const DOOR2_COL = 13;
/** Ticks (18.2 to the second) the car takes to go once round, measured on the engine (tools/route.ts checks it); the lamps and the door count in laps. */
export const LAP = 112;
/** Laps before the barred door opens. */
export const LAPS = 3;
