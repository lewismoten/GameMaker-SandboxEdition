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
};

/** Gears the hammer needs turned before it can strike. */
export const GEARS = 3;
/** Valentines Teddy's party box needs: six blown about the lawn, six in Gwinn's box. */
export const VALENTINES = 12;
/** The Bard's drumsticks, dropped along the parade route. */
export const DRUMSTICKS = 2;

/** Thank-you hearts the end of the first leg of the road asks for. */
export const LEG1_THANKS = 3;

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
} as const;

/** Scan codes, for the bot. */
export const SCAN = { up: 0x48, down: 0x50, left: 0x4b, right: 0x4d, q: 0x10, e: 0x12, space: 0x39, esc: 0x01 } as const;

/** Where every map's drawing starts on the 100x100 grid (the rest is wall). */
export const ORIGIN = 2;
