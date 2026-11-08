// WARNING FIRST's clocks. Game-Maker keeps time in ticks, 18.2 a second (code/GM/PLAYBACK.C
// changeblks): a block can turn into another block after a number of ticks, and every block of
// one kind changes on the same tick. Every clock starts when the scene loads, so nothing the
// player does can start, stop or restart one. Everything below is in ticks.

/** A fog vent rests, rumbles (the warning), then puffs, and starts again. */
export const REST = 90;
export const RUMBLE = 40;
/** The grate shakes through its rumble: a picture for each of these, side to side (they add up to RUMBLE; 8 ticks is about two changes a second). */
export const SHAKE_STEPS = [8, 8, 8, 8, 8];
export const PUFF = 30;
/** How long each of level 1's three vents rests the first time (they take turns). */
export const VENT_FIRST = [90, 140, 190];
/** Hit points a puff takes, once for each vent (levels.ts). */
export const PUFF_HURT = -10;

/** A plank bridge is solid, flickers (the warning, and still solid), then is gone, and comes back. */
export const SOLID = 108;
export const FLICKER = 36;
/** The flicker blinks: a picture for each of these, cracked then glowing in turn (they add up to FLICKER; 7 ticks keeps it under three changes a second). */
export const FLICKER_STEPS = [7, 7, 7, 7, 8];
export const GONE = 54;
/** How long each of level 2's two bridges stays solid the first time. */
export const PLANK_FIRST = [108, 54];
