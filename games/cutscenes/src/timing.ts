// CUTSCENES' clock. Game-Maker keeps time in ticks, 18.2 a second (code/GM/PLAYBACK.C
// changeblks): a block can turn into another block after a number of ticks. A scene's stage
// floor is planks that flash and then drop away, so the scene ends by itself. Everything below
// is in ticks.

/** Ticks in about a second: the nearest whole number to 18.2. */
export const SECOND = 18;
/** The floor opens after this long (seventeen seconds, long enough to read two signs), so a scene lasts about that after its words. */
export const FLOOR_AT = 17 * SECOND;
/** How long the floor flashes its stripes before it opens (three seconds). */
export const WARN = 3 * SECOND;
/** A tale's stage has no signs to read, so its floor goes sooner: shut for three seconds, flashing for two. */
export const QUICK_AT = 5 * SECOND;
export const QUICK_WARN = 2 * SECOND;
