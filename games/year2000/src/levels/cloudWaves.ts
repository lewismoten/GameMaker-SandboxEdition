// The Cloud Lane's timetable: what comes over the horizon in which lane, tick by tick, from
// the moment the scene starts (18.2 ticks a second). Every block's clock starts with the
// scene, so this list is exact: sky.ts turns each lane's entries into a chain of spawner
// blocks, one per entry, each giving birth once (its birth time is the entry's tick and it is
// on the map only around that tick). A death plays the scene again from the top, the same way.
//
// The miles: the sign counts 9 MI down to 1, a mile every MILE ticks, then 0 MI, when the
// exit ramp over the right lane opens. Traffic takes ARRIVE ticks from the horizon to the car,
// so each wave shows itself as dots on the horizon about 1.7 seconds before it gets there.

export type Kind = 'car' | 'truck' | 'page' | 'pill';
export type Lane = 0 | 1 | 2;

/** Ticks per mile on the sign. */
export const MILE = 110;
/** The sign starts at 9 MI. */
export const MILES = 9;
/** When the ramp opens (and the sign reads 0 MI). */
export const OPEN_AT = MILE * MILES;
/** Ticks from a birth to the car's row: one to leap onto the horizon, 20 to the wall row, 10 more. */
export const ARRIVE = 31;

/** [tick, lane (0 left, 1 middle, 2 right), what]. */
type Entry = [number, Lane, Kind];

const L = 0;
const M = 1;
const R = 2;

export const WAVES: readonly Entry[] = [
  // 9 MI: open sky, and two pages of the report fluttering down the middle lane.
  [24, M, 'page'],
  [66, M, 'page'],
  // 8 MI: hover cars, one lane at a time.
  [110, L, 'car'],
  [150, M, 'car'],
  [190, R, 'car'],
  // 7 MI: two lanes at once; the free lane has a page in it.
  [232, L, 'car'],
  [232, M, 'car'],
  [234, R, 'page'],
  [276, M, 'car'],
  [276, R, 'car'],
  [278, L, 'pill'],
  [312, L, 'car'],
  // 6 MI: the trucks (slow, wide, and they hurt more).
  [346, L, 'truck'],
  [346, M, 'truck'],
  [348, R, 'page'],
  [390, R, 'truck'],
  [430, M, 'truck'],
  [430, R, 'truck'],
  [432, L, 'page'],
  // 5 MI: cars weaving, one lane after another.
  [468, L, 'car'],
  [494, R, 'car'],
  [520, M, 'car'],
  [546, L, 'car'],
  // 4 MI: trucks two at a time.
  [570, L, 'truck'],
  [570, R, 'truck'],
  [572, M, 'page'],
  [614, M, 'truck'],
  [614, L, 'truck'],
  [616, R, 'pill'],
  [658, R, 'truck'],
  [658, M, 'truck'],
  // 3 MI: a car and a truck side by side.
  [700, L, 'car'],
  [700, M, 'truck'],
  [702, R, 'page'],
  [742, R, 'car'],
  [742, L, 'truck'],
  [744, M, 'page'],
  // 2 MI: the last rush.
  [786, M, 'car'],
  [786, R, 'car'],
  [826, L, 'truck'],
  [826, M, 'truck'],
  [828, R, 'pill'],
  [866, L, 'car'],
  [866, R, 'car'],
  [868, M, 'page'],
  // 1 MI: the right lane stays clear for the ramp; a last car on the left.
  [906, L, 'car'],
];

/** Hazards hurt; prizes help. */
export const HAZARD = (k: Kind) => k === 'car' || k === 'truck';
