// The numbers every file of MUSTARD SEED HUSTLE agrees on: monster slots (the block sets give
// birth to some), the seed's sequences, keys and counters, and the sound effects.

export const MON = {
  drop: 0,
  splash: 1,
  beetleR: 2,
  beetleL: 3,
  ant: 4,
  crow: 5,
  // The peacock is two blocks wide: A is the tail, B the head; R/L the way the leg goes.
  peaAR: 6,
  peaAL: 7,
  peaBR: 8,
  peaBL: 9,
  mole: 10,
  worm: 11,
  pebble: 12,
  dust: 13,
  eagle: 14,
  goat: 15,
  squirrel: 16,
  bird: 17,
  birdOff: 18,
  bee: 19,
} as const;

/**
 * Sequences: 0..4 are Game-Maker's own (idle, die, hurt, pick up, drop). PLAYGAME runs the first
 * sequence on a key that is on, so the laced-up walks (5..8, on only while the laces are carried)
 * come before the plain ones on the same keys (9..12): picking up the laces is the upgrade.
 */
export const SEQ = {
  idle: 0,
  die: 1,
  hurt: 2,
  pickup: 3,
  fastRight: 5,
  fastLeft: 6,
  fastRightD: 7,
  fastLeftA: 8,
  right: 9,
  left: 10,
  rightD: 11,
  leftA: 12,
  hop: 13,
  hopLeft: 14,
  hopRight: 15,
  root: 16,
  hopW: 17,
  rootS: 18,
  joy: 19,
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
  enter: 0x1c0d,
} as const;

/** PC scan codes the bot and the demo press. */
export const SCAN = { up: 72, down: 80, left: 75, right: 77, space: 57, q: 16, e: 18, enter: 28 } as const;

/**
 * Water: raindrops caught and drops of groundwater. Counters 20 and up refuse a touch that
 * would empty them, so the crack in the sidewalk only opens for WATER_NEEDED drops. Like money,
 * a counter starts at 1 and shows one less.
 */
export const WATER = 20;
export const WATER_NEEDED = 5;
/** Faith: the golden glimmers. Each boulder in the mountain's way takes one to move. */
export const FAITH = 21;

/** Sound effect numbers in each .SND (0..8 are the ones PLAYGAME plays by itself). */
export const SND = {
  /** Hit points back (a dewdrop). */
  help: 0,
  /** A monster done in (a raindrop caught, a bird off to its nest). */
  kill: 1,
  money: 2,
  pay: 3,
  /** An extra life: "...the mustard seed hustle!" */
  life: 4,
  /** Points (sunbeams). */
  score: 5,
  lose: 6,
  /** A counter up (water, faith). */
  gain: 7,
  /** A counter spent (a boulder moved, the sidewalk cracked open). */
  spend: 8,
  hop: 9,
  root: 10,
  hurt: 11,
  wilt: 12,
  joy: 13,
  /** The laces picked up: "...got the greatest feet!" */
  laces: 14,
} as const;
