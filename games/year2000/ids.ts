// The numbers that tie IN THE YEAR 2000's blocks, monsters, characters and maps together.

/** Character sequences (0-4 are Game-Maker's fixed ones). */
export const SEQ = {
  idle: 0,
  die: 1,
  hurt: 2,
  pickup: 3,
  drop: 4,
  right: 5,
  left: 6,
  up: 7,
  down: 8,
  /** Space: the Laser-Tag Zapper. Its counter is the charge left. */
  zap: 9,
} as const;

/** Counters ("repetition meters"). Those at 3 and 20+ read one more than they hold. */
export const CTR = {
  lives: 1,
  /** Quarters: phone booths and arcade games take them. */
  quarters: 3,
  zap: SEQ.zap,
  /** Pages of the science report Sparky chewed up. */
  pages: 20,
  /** The garage door opener (Dome Sweet Dome). */
  remote: 21,
  /** Employees Only keycard (Mega Mall 2000). */
  keycard: 22,
  /** The report's cover page, which Sparky has in his mouth. */
  cover: 23,
  /** A Moon Pass from the Moon Visitor Center. */
  moonpass: 24,
} as const;

/** Sound effects in Y2K.SND (0-8 are played by Game-Maker for counter changes). */
export const SND = {
  heal: 0,
  kill: 1,
  coin: 2,
  insert: 3,
  life: 4,
  score: 5,
  subScore: 6,
  pickup: 7,
  open: 8,
  zap: 9,
  hurt: 10,
  die: 11,
  none: 30,
} as const;

/** How many pages the science fair judges need to see. */
export const PAGES_NEEDED = 20;

/** Monster numbers in the .MON files (one shared list; every level loads the same set). */
export const MON = {
  zap: 0,
  pop: 1,
  mowerH: 2,
  mowerV: 3,
  mowerBox: 4,
  dog: 5,
  paper: 6,
  paperbot: 7,
  alien: 8,
  alien2: 9,
  beam: 10,
  carR: 11,
  carL: 12,
  fastR: 13,
  fastL: 14,
  truckR: 15,
  truckL: 16,
  faxbot: 17,
  secbot: 18,
  cart: 19,
  cartV: 20,
  telemarketer: 21,
  static: 22,
  fish: 23,
  fishV: 24,
  dino: 25,
  grandma: 26,
  meteor: 27,
  boom: 28,
  buggy: 29,
  buggyV: 30,
  lava: 31,
  sparky: 32,
  sparky2: 33,
  sparky3: 34,
  cover: 35,
  judge: 36,
  shopper: 37,
  skater: 38,
  skaterV: 39,
  secbotPatrol: 40,
  dinoV: 41,
  meteorL: 42,
  none: 64,
} as const;
