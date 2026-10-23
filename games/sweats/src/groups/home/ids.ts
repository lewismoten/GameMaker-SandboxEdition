// The HOME SWEET HOME set's own monster slots (after the common ones in ids.ts MON). Each
// monologue has its own .MON, so the monologues reuse the same slots for their own foes.
import { FIRST_GROUP_MON } from '../../ids';

const F = FIRST_GROUP_MON;

/** A beaten foe of the house: a puff of lint, then gone (every monologue's slot F). */
export const FLUFF = F;

export const BLANKET_MON = {
  fluff: FLUFF,
  /** A chill off the window: a snowflake with a grudge, drifting down to the floor. */
  chill: F + 1,
  /** An allen key from the flat-pack bookcase, hopping. */
  key: F + 2,
  /** The new blanket with the foot pocket (it doesn't know his scent): whole, then crumpled, then folded. */
  newA: F + 3,
  newB: F + 4,
  newC: F + 5,
} as const;

export const SOCKS_MON = {
  fluff: FLUFF,
  /** Static-cling lint off the dryer, the cruel trickster. */
  lint: F + 1,
  /** A perfectly matched pair, marching in step: conformity. */
  pair: F + 2,
  /** A whisper off a colleague: "WHY?" */
  why: F + 3,
} as const;

export const PIZZA_MON = {
  fluff: FLUFF,
  /** The rogue salad fork, hopping. */
  fork: F + 1,
  /** The suspiciously sticky napkin, creeping. */
  napkin: F + 2,
  /** A pizza cutter, rolling. */
  cutter: F + 3,
  /** Aunt Marge's question, drifting: "WHO SNEEZED ON THE DIP?" */
  dip: F + 4,
  /** The smoke alarm's BEEP. */
  beep: F + 5,
  /** The cat, on the table: it wins. Too tough for words. */
  cat: F + 6,
} as const;

export const ITCH_MON = {
  fluff: FLUFF,
  /** The itch: a little ghost with a feather and a personal grudge. */
  ghost: F + 1,
  /** A judging look off an onlooker: "TSK". */
  tsk: F + 2,
  /** Someone else's eyebrow hair (still unexplained), wriggling. */
  brow: F + 3,
  /** The car horn he honked: "HONK". */
  honk: F + 4,
  /** The toddler in his stroller, staring (hop over him). */
  toddler: F + 5,
} as const;

export const DBLTAP_MON = {
  fluff: FLUFF,
  /** A trending tag, drifting off the feed. */
  trend: F + 1,
  /** A petition on a clipboard, marching. */
  petition: F + 2,
  /** A newsletter from the artisanal mushroom rights mailing list, flapping. */
  mail: F + 3,
  /** A mushroom that grows sideways (an outlier), shuffling. */
  shroom: F + 4,
  /** A turtle: slow to rise, but its time has come (hop over it). */
  turtle: F + 5,
} as const;
