// The numbers every file of TUNE-UP agrees on: Teddy's sequences and keys, the counters, the
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
  sit: 10,
  boop: 11,
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
} as const;

/** PC scan codes the bot presses. */
export const SCAN = { up: 72, down: 80, left: 75, right: 77, space: 57, q: 16, e: 18 } as const;

/**
 * Counters. Each starts one higher than F2 shows, and a touch that would leave one at 0 or
 * less is refused: that is how a door waits for enough.
 */
export const CTR = {
  /** Notes played on the beat in the Player Piano (its way out takes HITS_NEEDED). */
  hits: 20,
  /** Instruments found in this neighborhood (its way out takes them all). */
  found: 22,
  /** The piano stairs' notes (a harmless count, so the touch rings slot 7). */
  stairs: 23,
  /** A count that only goes down, from high (so the touch rings slot 8). */
  down: 24,
  /** Instruments set on their stands at the bandstand. */
  band: 25,
  /** Notes Doc Leo's baton flicks on the beat at the marching field (its own: the piano's spare hits stay there). */
  beats: 26,
  /** Hollow notes played on the staff doors in the woods. */
  staff: 27,
} as const;
export const HITS_NEEDED = 12;
export const DOWN_START = 100;

/** Monster slots in every .MON. */
export const MON = {
  drummer: 0,
  sparkle: 1,
  gwinn: 2,
} as const;

/** Sound slots (0..8 are the ones PLAYGAME plays by itself, by the kind of change). */
export const SND = {
  /** Hit points up: in the Player Piano, the high lane's note; on the stairs, a note. */
  help: 0,
  kill: 1,
  /** Money up: a stair note. */
  money: 2,
  life: 4,
  /** Score up: a stair note, or a cheer. */
  score: 5,
  /** Score down: a stair note. */
  lose: 6,
  /** A counter up: an instrument found, the low lane's note, a stair note. */
  gain: 7,
  /** A counter down: a boop on an unlit key, a stair note, a door opening. */
  spend: 8,
  hop: 9,
  hurt: 10,
  faint: 11,
  boop: 12,
} as const;
