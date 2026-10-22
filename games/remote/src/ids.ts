// The numbers every file of WHERE'S THE REMOTE?! agrees on: monster slots (the block sets give
// birth to some), your sequences and counters, and the sound effects.

export const MON = {
  /** "WHERE'S THE REMOTE?!": the shout flies off the way you last walked. */
  shout: 0,
  /** The shout's "?!" fading. */
  echo: 1,
  /** A dust bunny, hopping about under the furniture; a shout blows it away. */
  bunny: 2,
  poof: 3,
  /** The cat, prowling, unimpressed. A swipe costs you patience. */
  cat: 4,
  /** Teddy the corgi, following you round the kitchen in case anything falls. Harmless, in the way. */
  teddy: 5,
  /** Toast popping out of the toaster in an arc, and its crumbs where it lands. */
  toast: 6,
  crumbs: 7,
  /** A cockroach scuttling under the fridge (a shout sends it off). */
  roach: 8,
  /** A lost sock drifting through the void. */
  sock: 9,
  /** A penny floating in the void: money. */
  penny: 10,
  /** The tiny raccoon (??). Say hi; off it scurries. */
  raccoon: 11,
  raccoonBye: 12,
  /** The mustard seed in red sneakers, lost between the cushions too. Say hi. */
  seed: 13,
  seedBye: 14,
  /** Lint: a grey wisp drifting about. A shout blows it away. */
  lint: 15,
  /** The third goat from the left, a long way from Bethlehem, grazing on lost socks. Harmless. */
  goat: 16,
  /** The living room ride: the recliner, the ottoman and the lamp whirl round the room. */
  recliner: 17,
  ottoman: 18,
  lampshade: 19,
  /** Popcorn flung off the ride. */
  popcorn: 20,
  /** The raccoon came back for the ride. */
  rider: 21,
} as const;

/** Sequences: 0..4 are Game-Maker's own (idle, die, hurt, pick up, drop). */
export const SEQ = {
  idle: 0,
  die: 1,
  hurt: 2,
  up: 5,
  down: 6,
  left: 7,
  right: 8,
  /** SPACE: "WHERE'S THE REMOTE?!" (the shout is a monster). */
  shout: 9,
  w: 10,
  a: 11,
  s: 12,
  d: 13,
  upLeft: 14,
  upRight: 15,
  downLeft: 16,
  downRight: 17,
  /** B: click an imaginary remote at the TV. */
  click: 18,
  /** C: check your hand. */
  hand: 19,
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
  c: 0x2e63,
  pad1: 0x4f00,
  pad3: 0x5100,
} as const;

/** PC scan codes the bot and the demo press. */
export const SCAN = { up: 72, down: 80, left: 75, right: 77, space: 57, b: 48, c: 46 } as const;

/**
 * Counters 20 and up refuse a touch that would empty them, so a gate only opens with enough.
 * Like money, each starts at 1 and shows one less.
 *   SPOTS: places searched in the living room; the baby gate to the kitchen opens at six
 *   ("nope, not there"). DIGITS: Mom's phone number, seven fridge magnets knocked all over the
 *   kitchen floor; the phone dials them. PLAY: the VCR's PLAY button, pressed; the couch only
 *   lets you sit back down when the tape is playing.
 * Pennies are Game-Maker's money (counter 3): the pay TV in the void takes ten.
 */
export const SPOTS = 20;
export const SPOTS_NEEDED = 6;
export const DIGITS = 21;
export const DIGITS_NEEDED = 7;
export const PLAY = 22;
export const MONEY = 3;
export const PENNIES_NEEDED = 10;
export const LIVES = 1;

/** Mom's number, one fridge magnet a digit. */
export const MOMS_NUMBER = '5550113';

/** Sound effect numbers in each .SND (0..8 are the ones PLAYGAME plays by itself). */
export const SND = {
  /** Patience back (Teddy's kiss, the fridge's cold soda, cold pizza, a candy bar in the void). */
  help: 0,
  /** A monster done in (a dust bunny blown away; the raccoon says hi). */
  kill: 1,
  /** A penny. */
  money: 2,
  /** Pennies spent (the pay TV warms up). */
  pay: 3,
  /** An extra life (the Voice-O-Matic's pizza). */
  life: 4,
  /** Points (junk). */
  score: 5,
  /** Points lost (Teddy grumbles: that's his bowl). */
  lose: 6,
  /** A counter up (a spot searched, a magnet, PLAY pressed). */
  gain: 7,
  /** A counter spent (the baby gate, the phone dialing, the couch). */
  spend: 8,
  shout: 9,
  hurt: 10,
  die: 11,
  click: 12,
  hand: 13,
} as const;
