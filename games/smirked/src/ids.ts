// The numbers every file of I SCREAMED, SHE SMIRKED agrees on: monster slots (the block sets
// give birth to some), your sequences and counters, and the sound effects.

export const MON = {
  /** "GET DOWN!": the tackle flies off the way you last walked (on the last level, the $12 foam sword's swing). */
  tackle: 0,
  /** The tackle's dust settling. */
  dust: 1,
  /** An animatronic zombie: foam guts, a plastic axe, a jerky shuffle. A tackle knocks it over. */
  zombie: 2,
  zombieDown: 3,
  /** A papier-mache witch, standing very still. Tackle her (GET DOWN!) and she goes flat. */
  witch: 4,
  /** The witch, flat on her back, her broomstick broken: walk over and say sorry (counter 21). */
  witchFlat: 5,
  /** Lily, eight, in a unicorn hoodie, strolling ahead with a caramel apple like it's Target. */
  lily: 6,
  /** A rubber bat bobbing on a string. */
  bat: 7,
  /** A bedsheet ghost sliding along its wire. */
  ghost: 8,
  /** The guy in the werewolf mask, growling after you. You don't run: you strategically reposition. */
  werewolf: 9,
  /** A plastic spider dropping on its string, and back up. */
  spider: 10,
  /** Carl, the fly (A Fly Named Carl), seeing things. Harmless. */
  carl: 11,
  /** The mustard seed in red sneakers, on a field trip. Say hi. */
  seed: 12,
  seedBye: 13,
  /** The 11-year-old in a cardboard knight costume, waving his cardboard sword. Only your foam sword knocks his helmet off. */
  knight: 14,
  /** The kid, helmet off, running off laughing ("Good duel!"). */
  knightRuns: 15,
  /** The cardboard helmet, left behind (counter 22). */
  helmet: 16,
  /** The third goat from the left, a long way from Bethlehem: a sheet over its head, it's a ghost goat this year. */
  goat: 17,
  /** Lily walking beside you on the last level, apple in hand. */
  lilyNear: 18,
  /** A loose dollar bill blowing about (money). */
  bill: 19,
  /** The witch toppling over (the tackle passes on before she lands, so it doesn't knock her flat twice). */
  witchFalls: 20,
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
  /** SPACE: "GET DOWN!" (the tackle is a monster; on the last level, the sword's swing). */
  tackle: 9,
  w: 10,
  a: 11,
  s: 12,
  d: 13,
  upLeft: 14,
  upRight: 15,
  downLeft: 16,
  downRight: 17,
  /** B: scream like a cat being dipped in a bathtub. */
  scream: 18,
  /** C: ask Lily if it's real. */
  ask: 19,
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
 * Counters 20 and up refuse a touch that would empty them, so a door only opens with enough.
 * Like money, each starts at 1 and shows one less.
 *   BATTERIES: for the flashlight; the door to the dark hallway only opens with four.
 *   SORRY: witches you tackled and said sorry to; the STAFF ONLY door opens at five ("Not part
 *   of the show." "Pretty sure I broke her broomstick.").
 *   HELMET: the cardboard knight's helmet, knocked off with the foam sword; the emergency exit only opens for it.
 *   SMIRKS: Lily's judgment. Every time something gets you (a fog machine, a rubber bat, a fake
 *   spiderweb, a fog light underfoot), she smirks, and it counts. It never opens anything.
 * Dollars are Game-Maker's money (counter 3): the souvenir sword is $12.
 */
export const BATTERIES = 20;
export const BATTERIES_NEEDED = 4;
export const SORRY = 21;
export const SORRY_NEEDED = 5;
export const HELMET = 22;
export const SMIRKS = 23;
export const MONEY = 3;
export const SWORD_PRICE = 12;
export const LIVES = 1;

/** Sound effect numbers in each .SND (0..8 are the ones PLAYGAME plays by itself). */
export const SND = {
  /** Nerve back (a juice box, a bite of caramel apple, Lily's pat). */
  help: 0,
  /** A monster done in (a zombie knocked over, a witch flattened, the helmet off). */
  kill: 1,
  /** A dollar. */
  money: 2,
  /** Dollars spent (the souvenir sword). */
  pay: 3,
  /** An extra life. */
  life: 4,
  /** Points (candy corn, glow sticks). */
  score: 5,
  /** Points lost. */
  lose: 6,
  /** A counter up (a battery, a sorry, the helmet, a smirk). */
  gain: 7,
  /** A counter spent (a door opening). */
  spend: 8,
  tackle: 9,
  hurt: 10,
  die: 11,
  scream: 12,
  ask: 13,
} as const;
