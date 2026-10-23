// The numbers every file of SHAKESPEARE IN SWEATPANTS agrees on: the poet's sequences and keys,
// the counters, the sound slots each scene's .SND fills, and the monster slots every .MON shares
// (each group of monologues fills slots FIRST_GROUP_MON.. with its own).

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
  down: 10,
  rightD: 11,
  leftA: 12,
  hopW: 13,
  downS: 14,
  /** Space: declaim. A word balloon flies out to each side. */
  declaim: 15,
  /** B: the monologue's line (each scene's .SND has its own). */
  line: 16,
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
  b: 0x3062,
  home: 0x4700,
  pgup: 0x4900,
} as const;

/** PC scan codes the bot and the demo press. */
export const SCAN = { up: 72, down: 80, left: 75, right: 77, space: 57, q: 16, e: 18, b: 48 } as const;

/** Money (counter 3) is tips: coins and dollar bills in every scene. The counter sells coffee. */
export const MONEY = 3;
/**
 * Coffee (counter 20): bought at The Hive's counter, and the curtain up to the stage only lets the
 * poet through with a cup in hand (it takes it). Like money, a counter 20 and up starts at 1 and
 * shows one less, and refuses a touch that would leave it at 0.
 */
export const COFFEE = 20;
/** What a cup costs at the counter, in tips. */
export const COFFEE_PRICE = 5;
/**
 * The monologue's plot (counter 21): each monologue's own things to find (the pens, the plants,
 * the socks...). Its last gate only opens with all of them, and takes them all, so the counter is
 * empty again for the next one.
 */
export const PLOT = 21;

/**
 * Sound effect numbers in each .SND. 0..8 are the ones PLAYGAME plays by itself, and each
 * monologue's scene fills two of them with its own recording:
 *   - score: only one block in a monologue's scene gives points alone, the spotlight on the
 *     boards where the poet starts, so stepping into it says the monologue's opening line;
 *   - spend: the last gate (it takes the plot) says the punch line.
 * Tips are money, mugs of coffee mend composure, so neither ever plays the score sound.
 */
export const SND = {
  /** Composure back (a sip of coffee). */
  help: 0,
  /** A monster done in. */
  kill: 1,
  /** Tips. */
  money: 2,
  /** Tips spent (a cup of coffee at the counter). */
  pay: 3,
  /** An extra life (applause). */
  life: 4,
  /** The opening line (the spotlight). */
  score: 5,
  lose: 6,
  /** A plot thing found. */
  gain: 7,
  /** The punch line (the last gate takes the plot; the curtain takes the coffee in The Hive). */
  spend: 8,
  hop: 9,
  step: 10,
  hurt: 11,
  die: 12,
  /** Space: declaim. */
  declaim: 13,
  /** B: the line. */
  line: 14,
} as const;

/**
 * Monster slots every .MON shares (the poet's word balloons, and friends from the Bard's other
 * songs who turn up in more than one place). A group's own monsters start at FIRST_GROUP_MON.
 */
export const MON = {
  /** Space: a word balloon flying out to the right, and one to the left. */
  wordR: 0,
  wordL: 1,
  /** Where a word lands: a little burst, then gone. */
  burst: 2,
  /** Teddy the corgi, asleep (solid, harmless: hop over him). */
  teddy: 3,
  /** Gwinn, asleep. */
  gwinn: 4,
  /** Carl the fly (A Fly Named Carl), buzzing about. A hello is a tip. */
  carl: 5,
  carlOff: 6,
  /** The third goat from the left (Third Goat from the Left), chewing. A hello is a tip. */
  goat: 7,
  goatOff: 8,
  /** Doc Leo, host of the open mic, with his rubber chicken on its leash. A hello is a tip. */
  leo: 9,
  leoOff: 10,
} as const;
export const FIRST_GROUP_MON = 12;

/** Power: what beats what. A word balloon beats a foe; nothing beats a friend or a dog. */
export const POWER = {
  word: 160,
  /** Foes: a word balloon beats them; touching one costs composure. */
  foe: 150,
  /** Tough ones a word cannot beat (only hop over or go round). */
  tough: 200,
  /** Friends: a touch says hello. */
  friend: 50,
} as const;
