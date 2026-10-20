// The numbers that tie Virus Blaster's ship, monsters, blocks, sounds and maps together.

/** Character sequences (0-4 are Game-Maker's fixed ones; pick up and drop are unused). */
export const SEQ = {
  idle: 0,
  die: 1,
  hurt: 2,
  pickup: 3,
  drop: 4,
  /** Space: the Nova Bomb (uses a charge from counter 5). */
  nova: 5,
  up: 6,
  down: 7,
  left: 8,
  right: 9,
  /** Number pad 7 / 9 / 1 / 3. */
  upLeft: 10,
  upRight: 11,
  downLeft: 12,
  downRight: 13,
  /** W A S D duplicate the arrows; Q and E fly up-left and up-right. */
  w: 14,
  s: 15,
  a: 16,
  d: 17,
  q: 18,
  e: 19,
} as const;

/** Keys: high byte = PC scan code, low byte = ASCII. */
export const KEY = {
  up: 0x4800,
  down: 0x5000,
  left: 0x4b00,
  right: 0x4d00,
  kp7: 0x4700,
  kp9: 0x4900,
  kp1: 0x4f00,
  kp3: 0x5100,
  w: 0x1177,
  a: 0x1e61,
  s: 0x1f73,
  d: 0x2064,
  q: 0x1071,
  e: 0x1265,
  space: 0x3920,
} as const;

/** Scan codes (for bots and demo recordings). */
export const SCAN = {
  up: 72,
  down: 80,
  left: 75,
  right: 77,
  kp7: 71,
  kp9: 73,
  kp1: 79,
  kp3: 81,
  w: 17,
  a: 30,
  s: 31,
  d: 32,
  q: 16,
  e: 18,
  space: 57,
  esc: 1,
} as const;

/** Sound set slots (0-8 are PLAYGAME's fixed events). */
export const SND = {
  repair: 0,
  kill: 1,
  money: 2,
  moneyDown: 3,
  oneUp: 4,
  score: 5,
  scoreDown: 6,
  charge: 7,
  chargeDown: 8,
  hurt: 9,
  die: 10,
  nova: 11,
  none: 30,
} as const;

/**
 * Monster powers. A stronger monster destroys a weaker one it touches; the player's shots
 * are the strongest thing that moves, wrecks are as strong as shots (so shots fly over
 * them) and armor is stronger still (it soaks shots up).
 */
export const POWER = {
  spark: 1,
  bullet: 40,
  enemy: 50,
  boom: 50,
  core: 150,
  bigBoom: 150,
  shot: 200,
  wreck: 200,
  armor: 250,
} as const;

/** Ship counters. */
export const START = {
  hp: 40,
  lives: 3,
  novas: 3,
} as const;

/** How many pixels a tick the scrolling stages carry the ship forward. */
export const DRIFT = 2;
