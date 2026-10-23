// The numbers every file of CLEANSE ME, O LOOFAH agrees on: monster slots (the block sets give
// birth to some), the man's sequences, keys and counters, and the sound effects.

export const MON = {
  // ---- I. the haunted bathroom
  /** A drip from the cursed shower head, falling. */
  drip: 0,
  /** A bar of grapefruit soap, cursed, sliding along a ledge. */
  grapefruit: 1,
  /** A bar of mango soap, cursed, sliding faster. */
  mango: 2,
  /** The screaming towel on its bar: solid, it screams. */
  towel: 3,
  /** A soap bubble drifting up out of the tub. Harmless. */
  bubble: 4,
  /** Carl the fly (from another song), buzzing round the light. A hello is points. */
  carl: 5,
  carlOff: 6,
  // ---- II. the forest-dark aisle
  /** A wild loofah (a gourd off the vine), hopping along a shelf: brine beats it. */
  feral: 7,
  /** What a splashed wild loofah becomes: a clean sponge, points. */
  tame: 8,
  /** An owl's eyes, blinking in the dark of the aisle. Harmless. */
  owl: 9,
  /** Loaf #13 (from another song), in the bakery's day-old bin. A hello is points. */
  loaf: 10,
  loafOff: 11,
  /** The mustard seed in red sneakers (from another song), at the spice rack. */
  seed: 12,
  seedOff: 13,
  // ---- III. home in the dark
  /** Teddy the corgi, asleep in the hall: solid, harmless. Hop over him. */
  teddy: 14,
  /** Gwinn, asleep by the couch. */
  gwinn: 15,
  /** A towel from the linen closet, screaming, flapping along the hall. */
  flapper: 16,
  /** A "Z" of her snoring, drifting up off the pillow. Harmless. */
  zzz: 17,
  // ---- IV. Scrubbus Maximus
  /** The demon sponge, two blocks tall (A its horns and smug face, B its mesh and the rack), four splashes each part. */
  spongeA0: 18,
  spongeA1: 19,
  spongeA2: 20,
  spongeA3: 21,
  spongeB0: 22,
  spongeB1: 23,
  spongeB2: 24,
  spongeB3: 25,
  /** A cursed citrus suds ball it spits: out of the soap dish behind it, floating slowly left over the gap and down. Brine pops it. */
  suds: 26,
  /** Where a suds ball lands: a splat, then gone. */
  splat: 27,
  /** What the man throws (Space): a splash of rosemary brine, flying the way he last moved. */
  brine: 28,
  /** The pink one, clean again, dropped when the sponge's top half is beaten: her rack takes it. */
  pink: 29,
  /** Steam curling up off the water. Harmless. */
  steam: 30,
  /** A screaming towel that has flapped into him: it snaps him once, then flutters off up the hall. */
  flapperOff: 31,
  /** Scrubbus sliding along the tub rim to a new spot between stages (brine bounces off while it slides). */
  spongeA1m: 32,
  spongeA2m: 33,
  spongeA3m: 34,
  spongeB1m: 35,
  spongeB2m: 36,
  spongeB3m: 37,
  /** A sprig of rosemary that grows on the pot by the vent now and then: so he never runs out of brine. */
  sprig: 38,
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
  down: 10,
  rightD: 11,
  leftA: 12,
  hopW: 13,
  downS: 14,
  /** B: a line of the song. */
  sing: 15,
  hopLeft7: 17,
  hopRight9: 18,
  /**
   * Space: throw rosemary brine. Its own counter (meter 19) is the brine in hand: none at first
   * (a sequence whose count is 0 cannot be done), and every sprig of rosemary is three splashes.
   * There is one character file, so the count carries on from scene to scene.
   */
  throw: 19,
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
 * Counters 20 and up refuse a touch that would empty them, so each gate only lets him by with
 * all of what it needs, and takes it. Like money, a counter starts at 1 and shows one less.
 */
/** Jars of bath salt: five in the mop bucket make the brine. */
export const SALT = 20;
export const SALT_NEEDED = 5;
/** Silver coins from the floor of the aisle: six at the checkout buy him a loofah of his own. */
export const COINS = 21;
export const COINS_NEEDED = 6;
/** Candles lit for the cleansing: the bathroom door only opens with six burning. */
export const CANDLES = 22;
export const CANDLES_NEEDED = 6;
/** The pink one, clean again: her silver rack takes it back. */
export const PINK = 23;
/** Splashes of brine a sprig of rosemary gives (the throw's own counter, meter[SEQ.throw]). */
export const SPRIG = 3;

/** Sound effect numbers in each .SND (0..8 are the ones PLAYGAME plays by itself). */
export const SND = {
  /** Dignity back (a dry washcloth). */
  help: 0,
  /** A monster done in (a hello, a wild loofah splashed, the sponge hit). */
  kill: 1,
  money: 2,
  pay: 3,
  /** An extra life (the bath duck). */
  life: 4,
  /** Points. */
  score: 5,
  lose: 6,
  /** A counter up (salt, a coin, a candle, rosemary, the pink one). */
  gain: 7,
  /** A counter spent (the bucket, the checkout, the bathroom door, her rack). */
  spend: 8,
  hop: 9,
  step: 10,
  hurt: 11,
  die: 12,
  /** Space: the throw ("Rough!"). */
  speak: 13,
  /** B: a line of the song. */
  wail: 14,
} as const;
