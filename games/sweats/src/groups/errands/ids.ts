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
