// The numbers that tie Teddy's character, blocks, monsters, sounds and maps together.

/** Character sequences (0-4 are Game-Maker's fixed ones). */
export const SEQ = {
  idle: 0,
  die: 1,
  hurt: 2,
  /** F: fetch (pick up). */
  fetch: 3,
  drop: 4,
  right: 5,
  left: 6,
  /** Up: hop (hold for higher). */
  hop: 7,
  /** Space: speak (bark). */
  speak: 8,
  /** Down: dig. */
  dig: 9,
  /** 1: high five. */
  five: 10,
  /** 2: sit pretty. */
  sit: 11,
  /** 3: spin. */
  spin: 12,
  /** 5: roll over. */
  roll: 13,
  /** 4: play dead (hold). */
  dead: 14,
  /** D: walk right (the same as Right). */
  rightD: 15,
  /** A: walk left. */
  leftA: 16,
  /** W: hop. */
  hopW: 17,
  /** Q: hop up and to the left. */
  hopLeft: 18,
  /** E: hop up and to the right. */
  hopRight: 19,
} as const;

/**
 * Keys: high byte = PC scan code, low byte = ASCII. Every Sandbox game takes the arrows
 * and W/A/S/D, with Q/E for up-left/up-right; tricks are on the number keys (the same
 * numbers as in Sandcastle Knight).
 */
export const KEY = {
  right: 0x4d00,
  left: 0x4b00,
  up: 0x4800,
  down: 0x5000,
  space: 0x3920,
  f: 0x2166,
  w: 0x1177,
  a: 0x1e61,
  d: 0x2064,
  q: 0x1071,
  e: 0x1265,
  /** 1: high five. */
  five: 0x0231,
  /** 2: sit pretty. */
  sit: 0x0332,
  /** 3: spin. */
  spin: 0x0433,
  /** 4: play dead (hold). */
  dead: 0x0534,
  /** 5: roll over. */
  roll: 0x0635,
} as const;

/** Scan codes for recordings and the simulator. */
export const SCAN = Object.fromEntries(Object.entries(KEY).map(([k, v]) => [k, v >> 8])) as Record<keyof typeof KEY, number>;

/** Counters ("repetition meters"): 3 is money; 20-29 are free. Counters read one more than they hold. */
export const CTR = {
  lives: 1,
  /** Treats (shown as Treats on the F2 screen, by player.json). */
  treats: 3,
  /** Doc Leo's props fetched on this level (the exit gate takes one). */
  props: 20,
  /** Clown Club tickets (earned with tricks; the Club's turnstiles take them). */
  tickets: 21,
} as const;

/**
 * Background block 149 is the same carryable thing in every level's .BBL, so it looks the
 * same in the F2 status screen wherever Teddy is carrying it (the inventory keeps only
 * block numbers). Only one level ever puts it on the map.
 */
export const KEEPSAKE = 149;

/**
 * Monster numbers, the same in every level's .MON (the character gives birth to the first
 * ones by number). Powers decide who scares whom: a higher power beats a lower one.
 */
export const MON = {
  woof: 0,
  dig: 1,
  paw: 2,
  whirlL: 3,
  whirlR: 4,
  fluff: 5,
  heart: 6,
  puff: 7,
  treat: 8,
  bone: 9,
  gwinn: 10,
  gwinnGone: 11,
  ticket: 12,
  ticketFall: 13,
  treatFall: 14,
  /** One of Doc Leo's balloon animals (a balloon dog), worth points and a little energy. */
  poodle: 15,
  /** Level monsters start here. */
  level: 16,
  none: 64,
} as const;

/** Monster powers: the ladder of who beats whom. */
export const POWER = {
  pickup: 1,
  projectile: 10,
  pest: 40,
  /** 100 and up cannot be beaten by touching Teddy. */
  blocker: 102,
  plug: 103,
  dig: 105,
  woof: 106,
  balloon: 108,
  paw: 110,
  door: 112,
  spinAsk: 113,
  whirl: 115,
  stack: 117,
  fluff: 120,
  sitAsk: 125,
  heart: 130,
  friend: 200,
} as const;

/** Sound effects in the .SND set (0-8 are played by Game-Maker for counter changes). */
export const SND = {
  help: 0,
  kill: 1,
  treat: 2,
  gobble: 3,
  life: 4,
  score: 5,
  lose: 6,
  prop: 7,
  gate: 8,
  woof: 9,
  dig: 10,
  slap: 11,
  sit: 12,
  spin: 13,
  roll: 14,
  flop: 15,
  hop: 16,
  yelp: 17,
  sleep: 18,
  fetch: 19,
  none: 30,
} as const;
