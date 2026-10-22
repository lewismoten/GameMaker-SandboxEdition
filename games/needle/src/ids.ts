// The numbers every file of THREAD THE NEEDLE, BROTHER CAMEL agrees on: monster slots, the
// camel's sequences, keys and counters, and the sound effects.

export const MON = {
  // The rich man is two blocks wide (A his back and his moneybags, B his front); R/L the way he walks.
  richAR: 0,
  richAL: 1,
  richBR: 2,
  richBL: 3,
  dog: 4,
  pigeon: 5,
  melon: 6,
  splat: 7,
  scorpion: 8,
  vulture: 9,
  goat: 10,
  tumble: 11,
  seed: 12,
  scissors: 13,
  moth: 14,
  needle: 15,
  thimble: 16,
  star: 17,
  starOff: 18,
  dove: 19,
  guard: 20,
} as const;

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
  kneel: 10,
  crawlLeft: 11,
  crawlRight: 12,
  dream: 13,
  rightD: 14,
  leftA: 15,
  hopW: 16,
  kneelS: 17,
  crawlLeft1: 18,
  crawlRight3: 19,
} as const;

/** Keys (scan code << 8 | ASCII). */
export const KEY = {
  up: 0x4800,
  down: 0x5000,
  left: 0x4b00,
  right: 0x4d00,
  space: 0x3920,
  w: 0x1177,
  a: 0x1e61,
  s: 0x1f73,
  d: 0x2064,
  q: 0x1071,
  e: 0x1265,
  z: 0x2c7a,
  c: 0x2e63,
  end: 0x4f00,
  pgdn: 0x5100,
} as const;

/** PC scan codes the bot and the demo press. */
export const SCAN = { up: 72, down: 80, left: 75, right: 77, space: 57, q: 16, e: 18, z: 44, c: 46 } as const;

/**
 * Gold: the rich man's coins in the saddlebags he left behind (money, counter 3). Like every
 * counter it starts one higher than it shows, and a touch that would empty it is refused, so
 * each poor soul along the road can only be given a coin while there is one to give.
 */
export const GOLD = 3;
export const GOLD_START = 10;
/**
 * Grace: one for every coin given away. The narrow ways (the eye gates) each take one to
 * squeeze through, and the eye of the needle itself takes EYE_GRACE.
 */
export const GRACE = 20;
export const EYE_GRACE = 4;
/** Thread: spools from the tailor's shop. A frayed place in a hanging thread takes one to mend. */
export const THREAD = 21;

/** Sound effect numbers in each .SND (0..8 are the ones PLAYGAME plays by itself). */
export const SND = {
  /** Hit points back (a drink of water, a date). */
  help: 0,
  /** A monster done in (a star caught). */
  kill: 1,
  /** Gold found. */
  money: 2,
  /** Gold given away: "Drop that gold and run your race!" */
  pay: 3,
  /** An extra life: "Thread the needle, Brother Camel!" */
  life: 4,
  score: 5,
  lose: 6,
  /** A counter up (grace, thread). */
  gain: 7,
  /** A counter spent (an eye gate opens, a thread mended; the eye of the needle). */
  spend: 8,
  hop: 9,
  kneel: 10,
  hurt: 11,
  faint: 12,
  dream: 13,
} as const;
