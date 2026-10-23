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
