// The NINE TO FIVE set's own monster slots (after the common ones in ids.ts MON).
import { FIRST_GROUP_MON } from '../../ids';

export const WORK_MON = {
  // ---- A Totally Normal Meeting
  /** A buzzword ("SYNERGY") drifting off a coworker in the meeting: a word balloon beats it. */
  buzz: FIRST_GROUP_MON,
  /** One of the angry spider footprints his notes turned into, scuttling under the table. */
  spider: FIRST_GROUP_MON + 1,
  /** The scratchy, spiteful backup pen from the supply closet, hopping and writing in Morse code. */
  pen: FIRST_GROUP_MON + 2,
  /** A buzzword or a pen beaten: a puff of ink, then gone. */
  inkPuff: FIRST_GROUP_MON + 3,
} as const;

/** The Coffee Goat in the Breakroom (its own .MON: the slots start over). */
export const CGOAT_MON = {
  /** His brain gone full static: a fuzz of grey with a question in it (SUGAR? CREAM?). */
  static: FIRST_GROUP_MON,
  /** The empty creamer, lovingly put back in the fridge, hopping out of it. */
  creamer: FIRST_GROUP_MON + 1,
  /** A fizz bubble off the coffee that should not fizz. */
  fizz: FIRST_GROUP_MON + 2,
  /** A goat he sees when he blinks (not the real one: that's the third from the left). */
  mirage: FIRST_GROUP_MON + 3,
  /** Something beaten: a puff. */
  puff: FIRST_GROUP_MON + 4,
} as const;

/** The Office Chair That Tried to Kill Me (its own .MON). */
export const CHAIR_MON = {
  /** A loose screw, rolling about the cubicle floor. */
  screw: FIRST_GROUP_MON,
  /** The chair's creak, a banshee with arthritis, wailing down the aisle. */
  squeak: FIRST_GROUP_MON + 1,
  /** The intern who stole the chair (it was "too loud"), rolling about on it: hop over. */
  intern: FIRST_GROUP_MON + 2,
  /** The janitor who lent him the wrench: "Good luck, you'll need it." A hello is a tip. */
  janitor: FIRST_GROUP_MON + 3,
  janitorOff: FIRST_GROUP_MON + 4,
  puff: FIRST_GROUP_MON + 5,
} as const;

/** Gerald the Ficus is Dead (its own .MON). */
export const FICUS_MON = {
  /** A crispy leaf letting go of the shelf of dead plants. */
  leaf: FIRST_GROUP_MON,
  /** Fungus gnats over Gerald's soil. */
  gnat: FIRST_GROUP_MON + 1,
  /** A runaway shopping cart in the parking lot: hop over it. */
  cart: FIRST_GROUP_MON + 2,
  /** Peggy, in the parking lot: cash only, no questions asked. A hello is a tip. */
  peggy: FIRST_GROUP_MON + 3,
  peggyOff: FIRST_GROUP_MON + 4,
  puff: FIRST_GROUP_MON + 5,
} as const;
