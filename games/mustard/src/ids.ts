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

/** Sequences: 0..4 are Game-Maker's own (idle, die, hurt, pick up, drop). */
export const SEQ = {
  idle: 0,
  die: 1,
  hurt: 2,
  right: 5,
  left: 6,
  hop: 7,
  hopLeft: 8,
  hopRight: 9,
  root: 10,
  rightD: 11,
  leftA: 12,
  hopW: 13,
  rootS: 14,
  joy: 15,
  joyH: 16,
  hopLeft7: 17,
  hopRight9: 18,
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
  h: 0x2368,
  home: 0x4700,
  pgup: 0x4900,
} as const;

/** PC scan codes the bot and the demo press. */
export const SCAN = { up: 72, down: 80, left: 75, right: 77, space: 57, q: 16, e: 18, h: 35 } as const;

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
} as const;
