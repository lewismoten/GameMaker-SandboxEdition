// The numbers every Starter file agrees on: the hero's sequences (what each key does), the
// keys and scan codes, the monsters' numbers and the sound effects. In the editor these are the
// Character tab's sequence list, the Monsters tab's list and the Sounds tab's list.

/** Sequences: 0 to 4 are Game-Maker's own (idle, die, hurt, pick up, drop). One sequence per key. */
export const SEQ = {
  idle: 0,
  die: 1,
  hurt: 2,
  right: 5,
  left: 6,
  /** Up: climb a ladder (and Down climbs back down). */
  up: 7,
  down: 8,
  /** Space: jump. Gravity does the rest. */
  jump: 9,
  /** The same walking on A and D, and climbing on W and S. */
  rightD: 10,
  leftA: 11,
  upW: 12,
  downS: 13,
  /** Animations the character file carries for a game to play (no key of their own): digging, tossing a star and cheering. */
  dig: 14,
  throw: 15,
  cheer: 16,
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
} as const;

/** PC scan codes the bot and the demo press. */
export const SCAN = { up: 72, down: 80, left: 75, right: 77, space: 57, q: 16, e: 18 } as const;

/** Monster numbers in a Starter's .MON file. */
export const MON = {
  /** A purple gumdrop that waddles back and forth along the ground. */
  gumdrop: 0,
  /** A bee that bobs up and down in the air. */
  buzzer: 1,
  /** A snail that creeps along slowly. */
  shelly: 2,
} as const;

/** Sound effects in the .SND file (0 to 8 are played by Game-Maker for counter changes). */
export const SND = {
  help: 0,
  kill: 1,
  /** A coin: money is counter 3. */
  coin: 2,
  spend: 3,
  life: 4,
  score: 5,
  lose: 6,
  /** A counter goes up (a key). */
  gain: 7,
  /** A counter goes down (a door uses a key). */
  use: 8,
  jump: 9,
  hurt: 10,
  die: 11,
  step: 12,
} as const;
