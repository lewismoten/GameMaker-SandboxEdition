// The numbers the hero, the monsters and the levels agree on: which sequence is which weapon (a sequence's
// number is also the number of its repetition counter, its "uses left"), and what a pouch gives.
import { SEQ } from '../../kit/starter/ids';

/** The sequences (the flame goes in the kit's unused Dig slot, the star in its Throw slot), which are also the numbers of their counters. */
export const SEQ_FLAME = SEQ.dig;
export const SEQ_STAR = SEQ.throw;
export const SEQ_NONE = 17;
/** What a pouch gives: stars or flames for the counter. */
export const STARS_PER_POUCH = 2;
export const FLAMES_PER_POUCH = 2;

