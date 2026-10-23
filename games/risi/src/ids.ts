// The numbers every file of VENI, VIDI, RISI! agrees on: monster slots (the block sets give
// birth to some), the sequences of both characters (Marcus the poet and Felix, the cat), keys and
// counters, and the sound effects. The six levels come in three pairs, each pair sharing one
// background set and one monster set (a .BBL holds 150 blocks, a .MBL 100):
//   villa   (I. the banquet, IV. the kitchen)        VILLA.BBL  VILLA.MBL
//   campus  (II. the battle, III. the rooftops)      CAMPUS.BBL CAMPUS.MBL
//   thermae (V. the baths, VI. the theater)          THERMAE.BBL THERMAE.MBL
// Monster slots are numbered for the whole game, so a slot means the same thing in every .MON.

export const MON = {
  /** What Marcus throws (Space): a joke, "HA!", flying the way he faces. */
  joke: 0,
  // ---- I. the banquet (Canis Meus Flatum Dedit)
  /** A cloud of Rufus's wind, drifting up from under the table. Jokes clear the air. */
  gas: 1,
  /** Lady Flavia, horrified behind her fan. A bow is points. */
  flavia: 3,
  flaviaOff: 4,
  /** Teddy and Gwinn, the senators' good dogs, sitting politely: solid, harmless. */
  teddy: 5,
  gwinn: 6,
  /** A slave with a tray of figs pacing the dining room: solid, harmless. */
  servus: 7,
  // ---- IV. the kitchen (Felis Fortissimus)
  /** A mouse on the kitchen floor: it bites. A meow scares it into dropping its cheese. */
  mouse: 8,
  /** The cheese a scared mouse drops (counter 21). */
  crumb: 9,
  /** What Felix throws (Space): "MIAU!" */
  meow: 10,
  /** An ant on the shelf (formicae timent: ants fear him). */
  ant: 11,
  // ---- II. the battle (Laudes Ignavi)
  /** The Gaulish horde: two warriors that chase Marcus all the way to the gate. */
  gaul: 12,
  gaul2: 13,
  /** An arrow loosed from the hill, falling. */
  arrow: 14,
  /** A crow over the field. Harmless. */
  crow: 15,
  // ---- III. the rooftops (Titus Torquet Lingua)
  /** A spell the clever wise man shoots off his chimney (sagax sapiens sagitat sagas). */
  spell: 16,
  /** A pigeon pacing the roof ridge. */
  pigeon: 17,
  /** Doc Leo, a philosopher on the rooftops (from the Bard of Bizarre). A hello is points. */
  leo: 18,
  leoOff: 19,
  /** The clever wise man himself, on his chimney: solid, harmless. */
  sagax: 20,
  // ---- V. the baths (Canit Piscis Aureus)
  /** A golden note of the diva's song, drifting up. Points. */
  note: 21,
  /** A mouse in the stands of the baths, cheering (clamant mures). A hello is points. */
  fan: 22,
  fanOff: 23,
  /** A scalding bubble rising out of the hot pool. */
  bubble: 24,
  /** A drop of hot water off the steamy vault, falling to the walkway (it hisses). */
  drip: 43,
  /** A senator floating on his back in the pool: solid, stand on him. */
  bather: 25,
  // ---- VI. the theater (Silentium Ridentium)
  /** A stone-faced spectator (omnes spectant, nemo ridet): a joke makes it laugh. */
  stony: 26,
  /** A spectator laughing at last: it comes down to Marcus, and a laugh counts (counter 24). */
  laugher: 27,
  /** A stone face just cracked: it shakes with laughter where it sits a moment (no joke can stop
   * it), then gets up and comes to Marcus as a laugher. */
  giggle: 42,
  /** A cabbage thrown from the top of the stands. */
  cabbage: 28,
  /** Doc Leo again, the theater's jester. A hello is points. */
  jester: 29,
  jesterOff: 30,
  /** Emperor Gravis, two blocks tall (A his laurel and stern face, B his toga and throne), four jokes each half. */
  gravisA0: 31,
  gravisA1: 32,
  gravisA2: 33,
  gravisA3: 34,
  gravisB0: 35,
  gravisB1: 36,
  gravisB2: 37,
  gravisB3: 38,
  /** An imperial decree ("SILENTIUM!") he hurls in an arc, and where it lands. */
  decree: 39,
  thud: 40,
  /** The laurel crown, dropped when his top half laughs: the stage's altar takes it. */
  crown: 41,
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
  /** Space: a joke to the right (Felix: a meow). It never runs out. */
  throw: 19,
  /** Z: a joke to the left (Felix: a meow). */
  throwLeft: 16,
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
  z: 0x2c7a,
  home: 0x4700,
  pgup: 0x4900,
} as const;

/** PC scan codes the bot and the demo press. */
export const SCAN = { up: 72, down: 80, left: 75, right: 77, space: 57, q: 16, e: 18, b: 48, z: 44 } as const;

/**
 * Counters 20 and up refuse a touch that would empty them, so each gate only lets him by with
 * all of what it needs, and takes it. Like money, a counter starts at 1 and shows one less.
 */
/** Shutters thrown open at the banquet: the door only opens once five have let the air out. */
export const AIR = 20;
export const AIR_NEEDED = 5;
/** Cheese the scared mice drop: the crown of cheese on the table only crowns a cat with six. */
export const CHEESE = 21;
export const CHEESE_NEEDED = 6;
/** Titles Titus touched (tot titulos tetigit): the tavern door on the roof takes seven. */
export const TITLES = 22;
export const TITLES_NEEDED = 7;
/** Golden scales of the diva: her basin takes six (cantus tuus, aurum nostrum). */
export const SCALES = 23;
export const SCALES_NEEDED = 6;
/** Laughs in the stands: the stairs to the stage open for five. */
export const LAUGHS = 24;
export const LAUGHS_NEEDED = 5;
/** The laurel crown: the altar on the stage takes it. */
export const CROWN = 25;

/** Sound effect numbers in each .SND (0..8 are the ones PLAYGAME plays by itself). */
export const SND = {
  /** Dignity back (grapes, a cup of wine and water). */
  help: 0,
  /** A monster done in (a joke landing, a hello). */
  kill: 1,
  money: 2,
  pay: 3,
  /** An extra life (a laurel wreath). */
  life: 4,
  /** Points. */
  score: 5,
  lose: 6,
  /** A counter up (a shutter, cheese, a title, a scale, a laugh, the crown). */
  gain: 7,
  /** A counter spent (the door, the cheese crown, the tavern, the basin, the stairs, the altar). */
  spend: 8,
  hop: 9,
  step: 10,
  hurt: 11,
  die: 12,
  /** Space: the joke ("HA!"). */
  speak: 13,
  /** B: a line of the song. */
  wail: 14,
} as const;
