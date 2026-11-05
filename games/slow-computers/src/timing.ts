// SLOW COMPUTERS' numbers. Game-Maker keeps time in ticks, 18.2 a second. The breeze moves one frame
// a tick: a block with a change time of 1 changes on every tick, so the whole sky is redrawn each time.

/** The breeze: frames in a cycle, one tick each (a gentle drift, about 2 and a quarter turns a second). */
export const BREEZE_FRAMES = 8;
/** Hit points and lives: nothing here hurts. */
export const HERO_HIT_POINTS = 50;
/** The monsters in the crowd of level 2. */
export const CROWD = 36;
