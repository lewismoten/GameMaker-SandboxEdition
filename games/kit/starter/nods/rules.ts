// The counters, gravity and countdown timing used by arrival lessons.
import { KEYS } from '../blocks';
import { PULL } from '../book';

/** The counter the lever adds to (a free one; the hero's counter starts at 1). */
export const POWER = KEYS + 2;
export const air = { grav: PULL.down };
/** One countdown digit lasts this many ticks (the engine's clock runs about 18 a second). */
export const COUNT_TICKS = 36;
/** The number it starts at: 9 digits of 2 s is about 18 s, longer than the walk from the plaza's start to the door. */
export const COUNT_FROM = 9;
