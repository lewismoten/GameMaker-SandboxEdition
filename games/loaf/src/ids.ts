// The numbers every file of LOAF #13 agrees on: monster slots (the block sets give birth to
// some), the loaf's sequences, keys and counters, and the sound effects.

export const MON = {
  /** A hungry hand reaching up out of the crowd, and down again. */
  hand: 0,
  /** Fish flying like a prayer: out of the fish basket in an arc, to the right or to the left. */
  fishR: 1,
  fishL: 2,
  /** Where a fish lands: a flop, then gone. */
  flop: 3,
  /** A brother loaf passed hand to hand overhead: say hello (a touch) for points. */
  brother: 4,
  brotherOff: 5,
  gull: 6,
  /** A hungry man pacing (big, solid). */
  man: 7,
  /** Third goat from the left, a long way from Bethlehem, grazing. Harmless. */
  goat: 8,
  weevil: 9,
  mouse: 10,
  /** A tiny mustard seed in red sneakers, hopping along. Harmless; a hello is worth points. */
  seed: 11,
  fox: 12,
  owl: 13,
  dog: 14,
  /** Brother Camel kneeling by the well, two blocks wide (A his humps, B his head). */
  camelA: 15,
  camelB: 16,
  moth: 17,
  /** The child, walking home ahead of you, two blocks tall (A her head, B her robe). */
  girlA: 18,
  girlB: 19,
} as const;

/** Sequences: 0..4 are Game-Maker's own (idle, die, hurt, pick up, drop). */
export const SEQ = {
  idle: 0,
  die: 1,
  hurt: 2,
  right: 5,
  left: 6,
  rise: 7,
  riseLeft: 8,
  riseRight: 9,
  down: 10,
  rightD: 11,
  leftA: 12,
  riseW: 13,
  downS: 14,
  bread: 15,
  breadB: 16,
  riseLeft7: 17,
  riseRight9: 18,
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
  b: 0x3062,
  home: 0x4700,
  pgup: 0x4900,
} as const;

/** PC scan codes the bot and the demo press. */
export const SCAN = { up: 72, down: 80, left: 75, right: 77, space: 57, q: 16, e: 18, b: 48 } as const;

/**
 * Crumbs: the holy ones, golden. Counters 20 and up refuse a touch that would empty them, so the
 * lid of the wicker wasteland only opens for CRUMBS_NEEDED. Like money, a counter starts at 1
 * and shows one less.
 */
export const CRUMBS = 20;
export const CRUMBS_NEEDED = 7;
/** Baskets gathered up full at dusk; the twelfth basket only takes you when the other eleven are full. */
export const BASKETS = 21;
export const BASKETS_NEEDED = 11;

/** Sound effect numbers in each .SND (0..8 are the ones PLAYGAME plays by itself). */
export const SND = {
  /** Hit points back (a sip of water from the well, a drop of olive oil). */
  help: 0,
  /** A monster done in (a hello to a brother, a fish caught). */
  kill: 1,
  money: 2,
  pay: 3,
  /** An extra life: "Don't count me out!" */
  life: 4,
  /** Points (crumbs). */
  score: 5,
  lose: 6,
  /** A counter up (a holy crumb, a basket gathered full). */
  gain: 7,
  /** A counter spent (the lid opens, the twelfth basket takes you). */
  spend: 8,
  rise: 9,
  roll: 10,
  hurt: 11,
  crumble: 12,
  bread: 13,
} as const;
