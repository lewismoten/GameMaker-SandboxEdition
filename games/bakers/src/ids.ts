// The numbers every file of the game agrees on: counters, character sequences, sound slots
// and keys.

/**
 * Counters ("repetition meters"). A counter reads one more than it holds, and a block that
 * would leave counter 3 or 20..29 at zero or below refuses the touch: every lock in
 * Ebenezer Baker's kitchen is built on that.
 */
export const CTR = {
  /**
   * Ingredients found (F2 calls them Money: Ebenezer paid his debts in sassafras). The
   * Vault's lock wants twelve and gives them straight back.
   */
  ingredients: 3,
  /** Skeleton keys carried: a lock door takes one. */
  keys: 20,
  /** Quarter turns of the Clock Room's lazy Susan (blocks/susan.ts). */
  turns: 21,
} as const;

/** Ingredients in the recipe card's list. The thirteenth is not on it. */
export const INGREDIENTS = 12;

/** Character sequences (0..4 are Game-Maker's own: idle, die, hurt, pick up, drop). */
export const SEQ = {
  idle: 0,
  die: 1,
  hurt: 2,
  pickup: 3,
  drop: 4,
  up: 5,
  down: 6,
  left: 7,
  right: 8,
  w: 9,
  s: 10,
  a: 11,
  d: 12,
  /** Space: squawk the rubber chicken (it is carried, so F2 shows it). */
  squawk: 13,
  /** K: a kazoo blast, all four ways (once the kazoo is found). */
  kazoo: 14,
  /** T: tip the tricorn (once it is found). Does nothing. Ebenezer insisted. */
  salute: 15,
} as const;

/** Sound set slots. PLAYGAME plays 0..8 by itself (2 when money goes up, 7 another counter...). */
export const SND = {
  /** Hit points up: a root beer float. */
  help: 0,
  /** A monster beaten (a mouse sent packing). */
  kill: 1,
  /** An ingredient (counter 3 up). */
  ingredient: 2,
  /** The Vault's twelve-hole lock taking its twelve (counter 3 down). */
  vault: 3,
  /** A slice of pie: a life. */
  life: 4,
  /** A bottle cap. */
  score: 5,
  subScore: 6,
  /** A key picked up (counter 20 up). */
  key: 7,
  /** A lock turning (counter 20 down). */
  unlock: 8,
  squawk: 9,
  hurt: 10,
  die: 11,
  kazoo: 12,
  fife: 13,
  pickup: 14,
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
  space: 0x3920,
  k: 0x256b,
  t: 0x1474,
  enter: 0x1c0d,
} as const;

/** Scan codes for recordings and the simulator. */
export const SCAN = { up: 0x48, down: 0x50, left: 0x4b, right: 0x4d, space: 0x39, k: 0x25, t: 0x14, enter: 0x1c, esc: 0x01 } as const;

/**
 * Monster numbers every room's .MON keeps in the same place: the character file fires the
 * squawk and the kazoo blasts by number, and the block sets (each shared by three rooms)
 * give birth by number, so an oven's "monster 10" is a fireball in the Bakehouse and a puff
 * of steam in the Tea Room.
 */
export const MON = {
  squawk: 0,
  kazooN: 1,
  kazooE: 2,
  kazooS: 3,
  kazooW: 4,
  /** Born by a hazard block, heading east, west, south or north. */
  bornE: 10,
  bornW: 11,
  bornS: 12,
  bornN: 13,
} as const;

/** Background block numbers every set keeps in the same place (inventory items are block numbers). */
export const FIXED_BLOCK = { void: 0, chicken: 1, kazoo: 2, tricorn: 3, eggRotten: 4, eggFaberge: 5 } as const;

/** The scenes of the two egg cupboards. */
export const EGG_SCENE = { rotten: 16, faberge: 17 } as const;
