// BEAT THE CLOCK's numbers. Game-Maker keeps time in ticks, 18.2 a second (code/GM/PLAYBACK.C
// changeblks): a block can turn into another block after a number of ticks, and that is the
// only clock the editor gives you. Everything below is in ticks.

/** Ticks in a second. */
export const TICKS = 18.2;

/** Segments in the bar, and the ticks each lasts. */
export const SEGMENTS = 5;
/** Ticks for a segment to stay lit in the race (level 1). */
export const RACE_SEG = 60;
/** Ticks for a segment in the looping clock (level 2). */
export const LOOP_SEG = 45;
/** How long a segment flashes red before it goes out. */
export const WARN = 16;
/** How long the looping gate stays shut before the bar fills again. */
export const SHUT_FOR = 80;
/** Ticks for the clock face's hand to move a quarter turn. */
export const HAND = 18;

/** Ticks until the race's gate shuts, and the looping gate's open time and whole round. */
export const RACE_TOTAL = SEGMENTS * RACE_SEG;
export const LOOP_OPEN = SEGMENTS * LOOP_SEG;
export const LOOP_ROUND = LOOP_OPEN + SHUT_FOR;
