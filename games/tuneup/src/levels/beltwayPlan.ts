// The Beltway's plan: where things sit on its one screen (the driver's seat) and the traffic's
// timetable, which the blocks (beltway.ts), the monsters (beltMonsters.ts) and the bot's route
// all read. Lanes are -1 (left), 0 (middle) and 1 (right); ticks count from the scene's start.

/** The lane strip on the dash: the driver's row, the lanes' columns, the solid caps, the exit run. */
export const STRIP = { row: 5, control: 6, lanes: [7, 8, 9], capL: 6, gate: 10, run: 11, exit: 12 } as const;
/** The lane a column of the strip is, or undefined. */
export const laneOf = (col: number): number | undefined => (col >= 7 && col <= 9 ? col - 8 : undefined);

/** The rear-view mirror's glass: a cell for each lane (the left lane shows on its left). */
export const MIRROR = { row: 0, cols: [7, 8, 9] } as const;

/** The windshield: its rows and columns, the horizon (pixels) and the vanishing point's cell. */
export const SHIELD = { top: 1, bottom: 4, left: 2, right: 11, horizon: 60, vp: [9, 2] as [number, number] } as const;

/**
 * Each lane's track on the block grid, from the windshield's base up to the vanishing point: the
 * road bends right, so the far half swings over more than the near half.
 */
export const TRACK: Record<number, [number, number][]> = {
  [-1]: [
    [4, 4],
    [6, 3],
    [9, 2],
  ],
  0: [
    [6, 4],
    [7, 3],
    [9, 2],
  ],
  1: [
    [8, 4],
    [8, 3],
    [9, 2],
  ],
};
/** The dashes between the lanes (side -1: left of the middle lane) and the posts along the shoulders. */
export const DIVIDER: Record<number, [number, number][]> = {
  [-1]: [
    [9, 2],
    [6, 3],
    [5, 4],
  ],
  1: [
    [9, 2],
    [8, 3],
    [7, 4],
  ],
};
export const POST: Record<number, [number, number][]> = {
  [-1]: [
    [9, 2],
    [5, 3],
    [3, 4],
  ],
  1: [
    [9, 2],
    [9, 3],
    [9, 4],
  ],
};
/** Pixels each picture of a divider's dash or a post is drawn off its cell's middle, by row (2, 3, 4). */
export const DIVIDER_SHIFT: Record<number, number[]> = { [-1]: [0, 10, 0], 1: [0, -10, 0] };
export const POST_SHIFT: Record<number, number[]> = { [-1]: [0, 0, -12], 1: [0, -8, 12] };

/** Off the right edge, where nobody sees them: the dashes' and the posts' spawners. */
export const SPAWN = { row: 2, dashes: [18, 19], posts: [20, 21] } as const;
/** Ticks between the dashes on each lane line, and between the posts. */
export const DASH_EVERY = 9;
export const POST_EVERY = 14;

/** Ticks a car shows in the mirror (catching up) before it passes. */
export const GLINT = 36;
/** Ticks a passing car is beside you: a driver still in its lane then gets honked at. */
export const WINDOW = 8;

/**
 * The traffic, by when each car comes alongside and its lane. Teach: one at a time in each lane,
 * the first in the lane you start in. Pattern: a steady beat. Test: two pairs that each leave
 * one lane clear.
 */
export const CARS: readonly (readonly [tick: number, lane: number])[] = [
  [160, 0],
  [300, -1],
  [430, 1],
  [550, 0],
  [640, -1],
  [730, 1],
  [830, -1],
  [860, 0],
  [960, 1],
  [990, 0],
];
/** Which picture each car is (0 a coupe, 1 a delivery van), in the order of CARS. */
export const KINDS: readonly number[] = [0, 1, 0, 1, 1, 0, 0, 1, 1, 0];

/** The trip meter's miles to the exit, a digit every MILE ticks (3 down to 0). */
export const MILES = 3;
export const MILE = 340;
/** When the EXIT sign is born at the vanishing point, and when gravity flips toward the exit. */
export const SIGN_AT = 1040;
export const FLIP_AT = 1130;
