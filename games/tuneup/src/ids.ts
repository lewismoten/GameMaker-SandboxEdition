// The numbers every file of TUNE-UP agrees on: Doc Leo's sequences and keys, the counters, the
// monster slots and the sound slots.

/** Sequences: 0..4 are Game-Maker's own (idle, die, hurt, pick up, drop); there are 20 in all. */
export const SEQ = {
  idle: 0,
  die: 1,
  hurt: 2,
  right: 5,
  left: 6,
  hop: 7,
  hopLeft: 8,
  hopRight: 9,
  down: 10,
  boop: 11,
  /** Oil's Well: Z X C V B squirt the oil can into the staff's five lines, bottom to top. */
  oil0: 12,
} as const;

/** Keys (scan code << 8 | ASCII). */
export const KEY = {
  up: 0x4800,
  down: 0x5000,
  left: 0x4b00,
  right: 0x4d00,
  space: 0x3920,
  q: 0x1071,
  e: 0x1265,
  z: 0x2c7a,
  x: 0x2d78,
  c: 0x2e63,
  v: 0x2f76,
  b: 0x3062,
} as const;

/** PC scan codes the bot presses. */
export const SCAN = { up: 72, down: 80, left: 75, right: 77, space: 57, q: 16, e: 18, z: 44, x: 45, c: 46, v: 47, b: 48 } as const;
/** The oil can's keys, bottom line to top. */
export const OIL_KEYS = ['z', 'x', 'c', 'v', 'b'] as const;

/**
 * Counters. Each starts one higher than F2 shows, and a touch that would leave one at 0 or
 * less is refused: that is how a door waits for enough.
 */
export const CTR = {
  /** Jump Start: the red clamp and the black clamp, each its own terminal's key. */
  red: 20,
  black: 21,
  /** Jump Start: the battery, charged by the crank. */
  charge: 22,
  /** Spark Plucks: plugs plucked (the third plug's pluck is a tip instead, for its pitch). */
  plucked: 23,
  /** The Timing Beat: notes played on the beat in the first verse (the second and third count on 26 and 27). */
  hits: 24,
  /** Oil's Well: oiled Squeaks whose notes have come home. */
  oiled: 25,
  hits2: 26,
  hits3: 27,
} as const;
/** Money: the Tips line on F2. */
export const MONEY = 3;

/** Monster slots in every .MON. */
export const MON = {
  /** Sir Reginald III, at work. */
  reggie: 0,
  /** Lady Regina III (the same bird, once she has laid the egg). */
  regina: 1,
  /** Oil's Well: a Squeak on its line, the oil can's drop (one per line), an oiled note coming home. */
  squeak: 2,
  squeakFast: 3,
  note: 4,
  drop0: 5,
} as const;

/** Sound slots (0..8 are the ones PLAYGAME plays by itself, by the kind of change). */
export const SND = {
  /** Hit points up. */
  help: 0,
  /** A monster done for (an oiled Squeak). */
  kill: 1,
  /** Money up. */
  money: 2,
  tip: 3,
  life: 4,
  /** Score up. */
  score: 5,
  lose: 6,
  /** A counter up. */
  gain: 7,
  /** A counter down (a door opening). */
  spend: 8,
  hop: 9,
  hurt: 10,
  faint: 11,
  /** Space: the reach (a crank's ratchet, a key's boop). */
  boop: 12,
  /** Oil's Well: the oil can's squirt on each line, a note of the scale each. */
  oil0: 13,
} as const;
