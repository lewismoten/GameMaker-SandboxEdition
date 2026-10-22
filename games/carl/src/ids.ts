// The numbers every file of CARL agrees on: monster slots (the block sets give birth to some),
// Carl's sequences, keys and counters, and the sound effects.

export const MON = {
  /** The dish towel, snapped at Carl: a swipe back and forth. */
  towel: 0,
  /** "MISSED!": whatever Carl's barrel roll made miss, before it tries again. */
  missTowel: 1,
  /** A big hand reaching down into the snack bowl, and back up. */
  reach: 2,
  /** The old clap: two hands, above and below, that come together and part. */
  clap: 3,
  missClap: 4,
  /** Where Carl's barrel-roll whoosh hits something: a whirl that makes everything there miss. */
  whirl: 5,
  /** A rolled-up magazine swatting down and up. */
  swatter: 7,
  missSwatter: 8,
  /** Teddy the corgi, snapping at flies (hops up and down). */
  teddy: 9,
  /** Loaf #13 (from another song) on the coffee table, saying hi. A hello is points. */
  loaf: 10,
  loafOff: 11,
  /** His ear on the pillow, asleep: buzz it (B). */
  ear: 12,
  /** The ear, twitching after a buzz: fly into it ("near my ear") and it counts. */
  earTwitch: 13,
  /** The ear, sound asleep again for a while (nothing gets through). */
  earZzz: 14,
  /** Teddy's big corgi ear in the dog bed, and the same three states. */
  dogEar: 15,
  dogTwitch: 16,
  dogZzz: 17,
  /** A slipper thrown in the dark, end over end. */
  slipper: 18,
  /** The ceiling fan's blades, going round. */
  fan: 19,
  /** A puff of sage smoke drifting by. */
  sage: 20,
  /** A cloud of essential oil mist from the diffuser, rising. */
  mist: 21,
  /** The mop on the wet floor, back and forth. */
  mop: 22,
  /** A robin outside. */
  bird: 23,
  /** A wasp, minding its own business, mostly. */
  wasp: 24,
  /** A hand out the window waving Carl out: please leave. */
  wave: 25,
  /** A frog by the pond, and its tongue flicking out. */
  frog: 26,
  tongue: 27,
  /** A dragonfly patrolling. */
  dragonfly: 28,
  /** A spider on a thread, up and down. */
  spider: 29,
  /** The third goat from the left (from another song), grazing. Harmless. */
  goat: 30,
  /** The mustard seed in red sneakers (from another song), hopping. A hello is points. */
  seed: 31,
  seedOff: 32,
  /** Brother Camel (from another song), resting in the documentary's desert (A his humps, B his head). */
  camelA: 33,
  camelB: 34,
  /** Carl's barrel roll: a whoosh of wind that flies ahead the way he last flew (power 160) and makes swatting things miss. */
  whoosh: 35,
  /** Carl's buzz: a wave that flies the way he last flew (power 110) and wakes what's asleep. */
  buzz: 36,
  /** A snore Z drifting up off the sleeper. Harmless. */
  snore: 37,
  /** The man, mopping, gloomy (two blocks tall: A his head, B his body). */
  mopperA: 38,
  mopperB: 39,
} as const;

/** Sequences: 0..4 are Game-Maker's own (idle, die, hurt, pick up, drop). */
export const SEQ = {
  idle: 0,
  die: 1,
  hurt: 2,
  right: 5,
  left: 6,
  up: 7,
  down: 8,
  upLeft: 9,
  upRight: 10,
  downLeft: 11,
  downRight: 12,
  upLeft7: 13,
  upRight9: 14,
  downLeft1: 15,
  downRight3: 16,
  roll: 17,
  buzz: 18,
} as const;

/** Keys (scan code << 8 | ASCII). */
export const KEY = {
  up: 0x4800,
  down: 0x5000,
  left: 0x4b00,
  right: 0x4d00,
  space: 0x3920,
  q: 0x1071,
  e: 0x1265,
  z: 0x2c7a,
  c: 0x2e63,
  b: 0x3062,
  home: 0x4700,
  pgup: 0x4900,
  end: 0x4f00,
  pgdn: 0x5100,
} as const;

/** PC scan codes the bot and the demo press. */
export const SCAN = { up: 72, down: 80, left: 75, right: 77, space: 57, q: 16, e: 18, z: 44, c: 46, b: 48 } as const;

/**
 * Counters 20 and up refuse a touch that would empty them, so each gate opens only for what it
 * asks. Like money, a counter starts at 1 and shows one less.
 */
/** Snacks Carl has landed on ("on my food"): the lamp only takes him with eight. */
export const SNACKS = 20;
export const SNACKS_NEEDED = 8;
/** Smiles flashed from the walls: the kitchen door opens for six. */
export const SMILES = 21;
export const SMILES_NEEDED = 6;
/** Ears buzzed: three and he gets up and opens the window. */
export const EARS = 22;
export const EARS_NEEDED = 3;
/** Hours lived (each hourglass is two): the clock breaks at twenty-four. */
export const HOURS = 23;
export const HOURS_NEEDED = 24;

/** Sound effect numbers in each .SND (0..8 are the ones PLAYGAME plays by itself). */
export const SND = {
  /** Hit points back (a sip of soda, a drop of honey). */
  help: 0,
  /** A monster done in ("MISSED!", a hello). */
  kill: 1,
  money: 2,
  pay: 3,
  /** An extra life. */
  life: 4,
  /** Points (crumbs). */
  score: 5,
  lose: 6,
  /** A counter up (a snack, a smile, an ear, an hour). */
  gain: 7,
  /** A counter spent (the lamp, the door, the window, the clock). */
  spend: 8,
  fly: 9,
  roll: 10,
  hurt: 11,
  splat: 12,
  buzz: 13,
} as const;
