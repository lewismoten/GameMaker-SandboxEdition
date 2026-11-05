// WARNING FIRST's clocks. Game-Maker keeps time in ticks, 18.2 a second (code/GM/PLAYBACK.C
// changeblks): a block can turn into another block after a number of ticks, and every block of
// one kind changes on the same tick. Every clock starts when the scene loads, so nothing the
// player does can start, stop or restart one. Everything below is in ticks.

/** A fog vent rests, rumbles (the warning), then puffs, and starts again. */
export const REST = 90;
export const RUMBLE = 40;
export const PUFF = 30;
/** How long each of level 1's three vents rests the first time (they take turns). */
export const VENT_FIRST = [90, 140, 190];
/** Hit points a puff takes, once for each vent (levels.ts). */
export const PUFF_HURT = -10;

/** A plank bridge is solid, flickers (the warning, and still solid), then is gone, and comes back. */
export const SOLID = 108;
export const FLICKER = 36;
export const GONE = 54;
/** How long each of level 2's two bridges stays solid the first time. */
export const PLANK_FIRST = [108, 54];
