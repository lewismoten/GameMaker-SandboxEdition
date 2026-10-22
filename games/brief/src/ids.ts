// The numbers every file agrees on: counters, sound slots and keys.

/**
 * Counters ("repetition meters"). A counter reads one more than it holds, and a block that
 * would leave counter 3 or 20..29 at zero or below refuses the touch: that is the Word
 * Counter's whole brain.
 */
export const CTR = {
  /** Words picked up and not yet put back in a book (F2 calls them Money: words are money). */
  words: 3,
  /** Stories restored in wing w (0..7) is counter 20 + w. */
  wing0: 20,
} as const;

export const wingCounter = (w: number) => CTR.wing0 + w;

/** Words in every book. Not 99. Not 101. */
export const WORDS_PER_BOOK = 100;
/** Stories a wing must have restored before its egg cup in the Reserve Stacks opens. */
export const BOOKS_PER_WING = 4;

/** Sound set slots. PLAYGAME plays 0..8 by itself (7 when a counter goes up, 8 down...). */
export const SND = {
  help: 0,
  kill: 1,
  /** A word picked up (counter 3 up). */
  word: 2,
  /** Words taken: a shusher confiscating one, or THE END page taking its hundred. */
  shh: 3,
  life: 4,
  score: 5,
  lose: 6,
  /** A wing counter up: a story shelved. */
  shelved: 7,
  /** A wing counter down: an egg cup lock turns. */
  unlock: 8,
  none: 30,
} as const;

/** Key words: scan code << 8 | ASCII. */
export const KEY = {
  up: 0x4800,
  down: 0x5000,
  left: 0x4b00,
  right: 0x4d00,
  w: 0x1177,
  s: 0x1f73,
  a: 0x1e61,
  d: 0x2064,
} as const;

/** Scan codes for recordings and the simulator. */
export const SCAN = { up: 0x48, down: 0x50, left: 0x4b, right: 0x4d, esc: 0x01 } as const;
