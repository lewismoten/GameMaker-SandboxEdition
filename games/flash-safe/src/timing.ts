// FLASH SAFE's clocks. Game-Maker keeps time in ticks, 18.2 a second (code/GM/PLAYBACK.C
// changeblks): a block can turn into another block after a number of ticks, and every block of
// one kind changes on the same tick. Everything below is in ticks, and every number is chosen to
// stay far under three flashes a second (a flash is a change and back: 6 changes in 18 ticks is
// the line; nothing here comes near it). tools/flash.ts measures the pictures to prove it.

/** Level 1: how long a hit's picture (the shaken thorns, the number) stays before it can hit again. */
export const HIT_SHOWN = 36;
/** Hit points a thorn bush takes, and the points Lami starts with. */
export const THORN_HURT = -5;
export const HERO_HIT_POINTS = 50;

/** Level 2: a warning lamp that blinks once a second (18 ticks: 9 lit, 9 dark). */
export const BLINK_ON = 9;
export const BLINK_OFF = 9;
/** Level 2: a lamp that pulses softly through four steps, 8 ticks each (32 ticks a pulse, under two a second). */
export const PULSE_STEP = 8;

/** Level 3: the storm sky. Calm, then a soft lift in two small steps, held, then settling back in two. */
export const SKY_FIRST = 40;
export const SKY_CALM = 60;
export const SKY_STEP = 4;
export const SKY_HOLD = 22;
