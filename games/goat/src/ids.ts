// The numbers every file of THIRD GOAT FROM THE LEFT agrees on: monster slots (the block
// sets give birth to some), the goat's sequences and counters, and the sound effects.

export const MON = {
  scream: 0,
  echo: 1,
  lamb: 2,
  lambShorn: 3,
  goat: 4,
  goatFaint: 5,
  pigeon: 6,
  feathers: 7,
  // Two-block camels: A is the left half, B the right; R/L the way the leg goes.
  camelAR: 8,
  camelAL: 9,
  camelBR: 10,
  camelBL: 11,
  spitL: 12,
  spitR: 13,
  splat: 14,
  walker: 15,
  walker2: 16,
  donkey: 17,
  ox: 18,
  cousin: 19,
  cousinFaint: 20,
  rooster: 21,
  wiseman: 22,
  lineGoat: 23,
  lineLamb: 24,
} as const;

/** The scream: its sequence's counter is your breath (eating hay and thistles fills it). */
export const SCREAMSEQ = 9;
/** A bleat of joy (B) and a quiet chew (C): no counter, nothing but a sound. */
export const BLEATSEQ = 18;
export const CHEWSEQ = 19;

/**
 * Wool, the only gift a goat has: tufts caught on the thorn bushes and the lambs you bump
 * into add one each. At 20 and up Game-Maker refuses a touch that would empty a counter,
 * so the empty place in the line at the manger only takes five when you have five. It
 * starts at 1, like money, so five tufts make 6 and the place leaves 1.
 */
export const WOOL = 20;
export const WOOL_NEEDED = 5;

/** Sound effect numbers in each .SND (0..8 are the ones PLAYGAME plays by itself). */
export const SND = {
  help: 0,
  kill: 1,
  money: 2,
  pay: 3,
  life: 4,
  score: 5,
  lose: 6,
  wool: 7,
  gift: 8,
  scream: 9,
  hurt: 10,
  faint: 11,
  bleat: 12,
  chew: 13,
} as const;
