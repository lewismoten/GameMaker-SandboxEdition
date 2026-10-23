// The numbers every file of THE GREAT DAIRY RECKONING agrees on: monster slots (the block sets
// give birth to some), the man's sequences, keys and counters, and the sound effects.

export const MON = {
  // ---- 3:17 A.M. (the bedroom, the hall, the living room)
  /** Teddy the corgi, asleep on the hall rug: solid, harmless. Hop over him. */
  teddy: 0,
  /** Gwinn, asleep by the couch. */
  gwinn: 1,
  /** A "Z" of her snoring, drifting up off the pillow. Harmless. */
  zzz: 2,
  // ---- the kitchen and the fridge: dairy, tempting you (a touch costs dignity)
  /** A milk carton, hopping along a shelf. */
  milk: 3,
  /** A yogurt cup, bouncing. */
  yogurt: 4,
  /** A wedge of cheddar, sliding along a shelf, winking. */
  cheese: 5,
  /** An ice cream cone, floating out of the freezer, swaying. */
  cream: 6,
  /** A stick of butter, sliding. */
  butter: 7,
  /** Carl the fly (from another song), buzzing round the kitchen. A hello is points. */
  carl: 8,
  carlOff: 9,
  /** Loaf #13 (from another song), in the bread box. A hello is points. */
  loaf: 10,
  loafOff: 11,
  /** The mustard seed in red sneakers (from another song), on the door shelf by the mustard. */
  seed: 12,
  seedOff: 13,
  // ---- the dash: the hall in the dark
  /** The Swamp Demon: the gurgle of his stomach, a green cloud with eyes, coming after him. */
  gurgle: 14,
  /** Teddy and Gwinn, awake now and wanting to play, pacing the hall (solid). */
  teddyUp: 15,
  gwinnUp: 16,
  // ---- the reckoning
  /** The Devil in leisure wear, two blocks tall (A his horns, face and milkshake, B his leisure suit), four hits each part. */
  devilA0: 17,
  devilA1: 18,
  devilA2: 19,
  devilA3: 20,
  devilB0: 21,
  devilB1: 22,
  devilB2: 23,
  devilB3: 24,
  /** A milkshake he throws: out of the soda fountain behind him in an arc to the left. */
  shake: 25,
  /** Where a milkshake lands: a splat, then gone. */
  splat: 26,
  /** What the man throws (Space): a splash of almond milk, flying the way he last moved. */
  splash: 27,
  /** The Devil's last straw, dropped when his top half is beaten: the porcelain throne takes it. */
  straw: 28,
  /** Smoke curling up off the floor. Harmless. */
  smoke: 29,
  /** The Devil striding to a new spot between stages (splashes bounce off while he moves). */
  devilA1m: 30,
  devilA2m: 31,
  devilA3m: 32,
  devilB1m: 33,
  devilB2m: 34,
  devilB3m: 35,
  /** A milkshake from the second spout over the throne: a higher lob at the floor where he stands. */
  shake2: 36,
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
  /** Space: a line of the monologue. */
  speak: 15,
  speakB: 16,
  hopLeft7: 17,
  hopRight9: 18,
  /**
   * Space in the reckoning: throw almond milk. Its own counter (meter 19) is the milk in hand: the
   * house's character file leaves this sequence undefined, so the count starts fresh from HELL.CHR
   * (a defined sequence's count carries on from scene to scene, and the house's Space is endless).
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
 * Willpower (celery sticks in the fridge). Counters 20 and up refuse a touch that would empty
 * them, so the cheesecake only lets him near with all of it: WILL_NEEDED. It takes every bit.
 * Like money, a counter starts at 1 and shows one less.
 */
export const WILL = 20;
export const WILL_NEEDED = 7;
/** Rolls of toilet paper: never go in without three. */
export const ROLLS = 21;
export const ROLLS_NEEDED = 3;
/** The Devil's last straw: the porcelain throne takes it. */
export const STRAW = 22;
/** Almond milk in hand at the start of the reckoning (the throw's own counter, meter[SEQ.throw]). */
export const MILK_START = 4;
/** Almond milk, oat milk: splashes in a carton. */
export const MILK_CARTON = 4;

/** Sound effect numbers in each .SND (0..8 are the ones PLAYGAME plays by itself). */
export const SND = {
  /** Dignity back (a glass of water, lactase pills). */
  help: 0,
  /** A monster done in (a hello, a milkshake splashed, the Devil hit). */
  kill: 1,
  money: 2,
  pay: 3,
  /** An extra life (the TV remote, found). */
  life: 4,
  /** Points. */
  score: 5,
  lose: 6,
  /** A counter up (willpower, a roll, almond milk, the straw). */
  gain: 7,
  /** A counter spent (the cheesecake, the bathroom door, the throne). */
  spend: 8,
  hop: 9,
  step: 10,
  hurt: 11,
  die: 12,
  /** Space: the monologue (the throw, in the reckoning). */
  speak: 13,
  /** B: the other line. */
  wail: 14,
} as const;
