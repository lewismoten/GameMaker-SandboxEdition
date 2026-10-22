// The numbers every file of Quest for the Round Tuit agrees on: counters, sequences, monster
// slots, sound slots and the block numbers that mean the same thing in every block set.

/**
 * Counters. Game-Maker's ten general counters (20..29) start at 1 and refuse a touch that
 * would leave them at 0 or less, so a block that takes k and gives it straight back is a
 * question: "do you have more than k?". Money is counter 3 (shown on F2 as meter - 1).
 */
export const C = {
  money: 3,
  /** The Royal Writ: the King hands one over every time you ask (they're free). */
  writ: 20,
  /** The three pieces of the Round Tuit. */
  p1: 21,
  p2: 22,
  p3: 23,
  /** The Harbor Master's foghorn, found in the Snooze Barrows. */
  fog: 24,
  /** A miner's lamp from the Eventually Falls general store. */
  lamp: 25,
  /** Royal hounds found (Teddy and Gwinn each add one). */
  dogs: 26,
  /** Sir Reginald Cluckington III, Doc Leo's rubber chicken. */
  chick: 27,
  /** The Tome of Tomorrow, 300 years overdue. */
  book: 28,
  /** The felt egg (picking it up counts it here as well as carrying it). */
  egg: 29,
} as const;

/** Character sequences in PIP.CHR (0-4 are Game-Maker's idle, die, hurt, pick up, drop). */
export const SEQ = {
  up: 5,
  down: 6,
  left: 7,
  right: 8,
  w: 9,
  a: 10,
  s: 11,
  d: 12,
  /** The steel sword: it shares Space with the wooden one and comes first, so once bought it wins. */
  steel: 13,
  wood: 14,
  kazoo: 15,
  tonic: 16,
} as const;

/** Steel swings bought with the sword (its counter, counted down per swing). */
export const STEEL_SWINGS = 30000;

/** Monster numbers that are the same in every .MON (the character file fires them). */
export const MON = {
  slashWood: 0,
  slashSteel: 1,
  note: 2,
  tonicA: 3,
  tonicB: 4,
  gem: 5,
  bigGem: 6,
  heart: 7,
} as const;
/** The first monster number free for each scene's own cast. */
export const MON_FREE = 8;

/**
 * Powers: higher kills lower when two monsters touch. Foes are under 100, so a foe that bites
 * Pip pays for it (Game-Maker kills a weaker monster that touches the character, turning it
 * into what it becomes): every bite costs the foe a hit, as a blow would. Bosses are 100 and up
 * (they never die of touching), and from the Vaults on stronger than the wooden sword.
 */
export const POWER = {
  drop: 1,
  foeEasy: 90,
  slashWood: 130,
  foeHard: 98,
  slashSteel: 160,
  boss: 150,
  note: 200,
  npc: 250,
} as const;

/** Background blocks that are the same in every block set. */
export const BLK = {
  /** The felt egg: an inventory pickup, so it ends up in the save file. */
  egg: 149,
} as const;

/** Sound slots in REALM.SND (0-8 are Game-Maker's own: help, kill, money...). */
export const SND = {
  help: 0,
  kill: 1,
  addMoney: 2,
  subMoney: 3,
  addLife: 4,
  addScore: 5,
  subScore: 6,
  addOther: 7,
  subOther: 8,
  slash: 9,
  hurt: 10,
  die: 11,
  kazoo: 12,
  tonic: 13,
  pickup: 14,
  honk: 15,
} as const;
