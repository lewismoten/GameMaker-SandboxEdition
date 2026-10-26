// The numbers every file agrees on: scenes, counters, sound slots and keys.

/** The .GAM's scene numbers. 0 is the title and 1 the end (won or lost), as in every game. */
export const SCENE = {
  title: 0,
  end: 1,
  library: 2,
  road1: 3,
  /** A one-tick pass scene whose intro is chapter 1's card, on the way into the square. */
  card1: 4,
  square: 5,
  tower: 6,
  belfry: 7,
  /** The square at seven o'clock: the same square, the clock going, the parade lined up. */
  square7: 8,
  /** Talks: one-tick pass scenes whose intro is the conversation (levels/pass.ts). */
  talkBook: 9,
  talkBench: 10,
  talkLeo: 11,
  talkLeo7: 12,
  /** The bell's seven strokes, between the belfry and the square at seven. */
  bell: 13,
  /** Over the hill: where the road goes on (for now, the end). */
  over: 14,
  // chapter 2, valentines in the park
  card2: 15,
  park: 16,
  talkTeddy: 17,
  talkTeddy2: 18,
  // chapter 3, the parade
  card3: 19,
  street: 20,
  talkBard: 21,
  // the Long Road's second leg
  road2: 22,
  // chapter 4, the music box
  card4: 23,
  shop: 24,
  talkGoat: 25,
  inbox: 26,
  shop7: 27,
  talkGoat2: 28,
  // chapter 5, the charging run
  card5: 29,
  lot: 30,
  talkLot: 31,
  lot7: 32,
  talkLot2: 33,
  // chapter 6, the lighthouse
  card6: 34,
  cove: 35,
  lighthouse: 36,
  coveLit: 37,
  talkCarl: 38,
  // the Long Road's third leg, in the snow
  road3: 39,
  // chapter 7, snow day
  card7: 40,
  snow: 41,
  talkLewie: 42,
  talkLewie2: 43,
  // chapter 8, open mic at the Hive
  card8: 44,
  hive: 45,
  talkWill: 46,
  loft: 47,
  hive7: 48,
  talkWill2: 49,
  // chapter 9, the painted rocks (the road's last leg runs one stop into the next)
  card9: 50,
  talkLoaf: 51,
  garden: 52,
  talkLoaf2: 53,
  // chapter 10, the fair
  card10: 54,
  talkFair: 55,
  fair: 56,
  talkFair2: 57,
  // chapter 11, the tall plant
  card11: 58,
  talkSeed: 59,
  plant: 60,
  talkSeed2: 61,
  // the finale, the Smart Home
  card12: 62,
  home: 63,
  talkWatt: 64,
  homeGold: 65,
  epilogue: 66,
} as const;

/**
 * Counters (repetition meters). Each reads one more than it holds, and a block that would
 * leave counter 3 or 20..29 at zero or below refuses the touch (PLAYGAME.C DoBlockTouchChar).
 * There are only ten of those, so they are spent with care: one for thank-yous, one shared by
 * every chapter's task (each chapter's gate spends exactly what it asks for), and eight
 * once-only flags for the chapters Joe can come back to from the road.
 */
export const CTR = {
  /** Thank-you hearts: one from each friend helped. The Long Road's gates count them. */
  thanks: 20,
  /** The chapter's task: gears turned, valentines found, drumsticks found... */
  task: 21,
} as const;

/**
 * Lewie's shovel's load: picking up the shovel adds this to chapter 1's flag (counter 22), which
 * nothing needs once the road's first leg is behind Joe (no way leads back to it), and each drift
 * shoveled spends one, so a drift refuses to budge for a robot without a shovel.
 */
export const SHOVEL = { counter: 22, load: 250 } as const;

/** Chapter n's once-only flag (n from 1): starts at 2 (one to spend), so a friend's corner opens once. */
export const flag = (n: number): number => {
  if (n < 1 || n > 8) throw new Error(`no flag for chapter ${n}`);
  return 21 + n;
};

/** What each counter starts at, stored (one more than it holds). */
export const COUNTER_START: Record<number, number> = {
  [CTR.thanks]: 1,
  [CTR.task]: 1,
  ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [flag(i + 1), 2])),
  // chapter 7 spends its flag twice: Lewie's box (the spare shovel) and the rope
  [flag(7)]: 3,
};

/** Gears the hammer needs turned before it can strike. */
export const GEARS = 3;
/** Valentines Teddy's party box needs: six blown about the lawn, six in Gwinn's box. */
export const VALENTINES = 12;
/** The Bard's drumsticks, dropped along the parade route. */
export const DRUMSTICKS = 2;

/** Notes to put back on the music box's cylinder before its crank turns. */
export const NOTES = 7;
/** Breakers to throw before the lot's charger has power. */
export const BREAKERS = 3;

/** Thank-you hearts the end of the first leg of the road asks for, and Joe's count by the end of the second. */
export const LEG1_THANKS = 3;
export const LEG2_THANKS = 6;
/** Every friend's thank-you, by the end of the road. */
export const ALL_THANKS = 11;

/** Front walks on Lewie's street to shovel (each has a doormat to step on, cleared). */
export const WALKS = 5;
/** Will's pages: blowing round the Hive's floor under the fans (the turret door wants them), and up the turret (the stage steps want those). */
export const FLOOR_PAGES = 3;
export const LOFT_PAGES = 4;
/** The painted rocks to roll home, each into its circle. */
export const ROCKS = 4;

/** Sound set slots. PLAYGAME plays 0..8 by itself (5 on points, 7 a counter up, 8 down...). */
export const SND = {
  help: 0,
  kill: 1,
  money: 2,
  spend: 3,
  life: 4,
  /** Points: a soft tally click. */
  score: 5,
  lose: 6,
  /** A counter up: a gear turns, a thank-you is counted. */
  up: 7,
  /** A counter down: a gate gives (a click and a creak). */
  down: 8,
  hop: 9,
  bump: 10,
  /** Joe's chirp when he picks something up. */
  chirp: 11,
  /** HELLO thrown: a soft whump. */
  boom: 12,
  /** The tool key with nothing to use: a little "hm?". */
  nope: 13,
  /** A puff of air into the balloon. */
  puff: 14,
  none: 30,
} as const;

/** Key words for sequences: scan code << 8 | ASCII. */
export const KEY = {
  up: 0x4800,
  down: 0x5000,
  left: 0x4b00,
  right: 0x4d00,
  w: 0x1177,
  s: 0x1f73,
  a: 0x1e61,
  d: 0x2064,
  q: 0x1071,
  e: 0x1265,
  home: 0x4700,
  pgup: 0x4900,
  space: 0x3920,
  enter: 0x1c0d,
  x: 0x2d78,
} as const;

/** Scan codes, for the bot. */
export const SCAN = { up: 0x48, down: 0x50, left: 0x4b, right: 0x4d, q: 0x10, e: 0x12, space: 0x39, esc: 0x01, enter: 0x1c, x: 0x2d } as const;

/** The monster number every scene's .MON keeps free for HELLO, the drum's boom Joe throws. */
export const TOOL_MON = { hello: 62 } as const;

/** Where every map's drawing starts on the 100x100 grid (the rest is wall). */
export const ORIGIN = 2;
