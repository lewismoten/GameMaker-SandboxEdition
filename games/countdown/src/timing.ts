// COUNTDOWN's numbers. Game-Maker keeps time in ticks, 18.2 a second (code/GM/PLAYBACK.C
// changeblks): a block can turn into another block after a number of ticks. A digit here is a
// chain of blocks, each showing one number and turning into the next after 18 ticks, which is
// about a second (18 ticks are 0.99 of one, so a count of 99 runs a second short of 100).
// Everything below is in ticks.

/** Ticks a digit stays on one number: the nearest whole number to a second (18.2). */
export const SECOND = 18;
/** Level 1 counts 9 to 0, and the door opens when it shows 0. */
export const DOOR_AT = 9 * SECOND;
/** Level 2 counts 99 to 0: a tens digit changes every ten of the ones digit's steps. */
export const TENS = 10 * SECOND;
export const FLOOR_AT = 99 * SECOND;
/** How long the floor flashes its stripes before it opens (three seconds). */
export const WARN = 3 * SECOND;
