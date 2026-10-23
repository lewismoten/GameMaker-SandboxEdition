// The OUT AND ABOUT set's own monster slots (after the common ones in ids.ts MON). Each
// monologue is a scene with its own .MON, so each fills the slots from FIRST_GROUP_MON afresh.
import { FIRST_GROUP_MON } from '../../ids';

const F = FIRST_GROUP_MON;

/** The Day the Self-Checkout Tried to Destroy Me. */
export const CHECKOUT_MON = {
  /** The loyalty card he doesn't have, flapping up and down the aisle demanding a scan. */
  card: F,
  /** UNEXPECTED ITEM IN BAGGING AREA: a warning drifting off the self-checkout's screen. */
  unexpected: F + 1,
  /** The scanner rejecting the bread's barcode: a red BEEP shot along the lane. */
  beep: F + 2,
  /** The slowest employee on earth (a word can't hurry him: hop over). */
  clerk: F + 3,
  /** The milk jug, the final boss, in three stages: furious, too big for the bagging area, held mid-air. */
  jugA: F + 4,
  jugB: F + 5,
  jugC: F + 6,
  poof: F + 7,
} as const;

/** How I Earned a Nod from the Smoking Cashier. */
export const CASHIER_MON = {
  /** The devil on his shoulder: "Everyone else leaves it." */
  devil: F,
  /** A swarm of gnats, vengeful soup fairies. */
  gnats: F + 1,
  /** The beige minivan reversing into his personal space (two halves, the driver eating corn on the cob): no word stops it. */
  vanRear: F + 2,
  vanFront: F + 3,
  /** The balloon the child screams at, bobbing just out of reach. */
  balloon: F + 4,
  /** The goose hissing in the distance. */
  goose: F + 5,
  /** A gust off the hill: thirty feet uphill against the wind. */
  gust: F + 6,
  poof: F + 7,
  /** The cashier smoking behind the dumpsters: a nod (a tip). */
  cashier: F + 8,
  cashierOff: F + 9,
} as const;

/** I Don't Work Here, But Emotionally I Do. */
export const PLATES_MON = {
  /** The wait staff floating by like dining-room phantoms (invisible but for their eyes). */
  phantom: F,
  /** A whisper out of the kitchen doors: "TABLE 7 STACKED BACKWARDS". */
  whisper: F + 1,
  /** A quiet chuckle from behind the host stand. */
  chuckle: F + 2,
  /** The grease stain that glues the dessert plate to the entree plate, sliding about. */
  grease: F + 3,
  /** The busboy: silent, but judging, always judging (a word can't move him: hop over). */
  busboy: F + 4,
  poof: F + 5,
} as const;

/** I Held in a Fart and Killed a Bird. */
export const BANQUET_MON = {
  /** The speeches that had not wilted: BLAH off the podium. */
  blah: F,
  /** The coughing duet: the man behind him coughs in sync. */
  cough: F + 1,
  /** "Are you cold?" from the woman next to him. */
  cold: F + 2,
  /** The uprising within, in three stages: a rumble from the depths, an angry balloon, a disappointed goose. */
  rumble: F + 3,
  balloon: F + 4,
  goose: F + 5,
  poof: F + 6,
} as const;
