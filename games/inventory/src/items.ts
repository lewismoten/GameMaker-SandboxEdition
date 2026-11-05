// The numbers the hero, the monsters and the levels agree on. A sequence's number is also the number of its
// repetition counter; here the counters are never used (every throw is free), and what turns a throw on is the
// block it is TIED to (a sequence's "Block required in inventory"): the star sequence works while a star item is in
// the pack, the flame sequence while a flame item is, and the shrug always.
import { SEQ } from '../../kit/starter/ids';

/** The flame goes in the kit's unused Dig slot (14), the star in its Throw slot (15), so a flame comes first in the list. */
export const SEQ_FLAME = SEQ.dig;
export const SEQ_STAR = SEQ.throw;
export const SEQ_NONE = 17;
