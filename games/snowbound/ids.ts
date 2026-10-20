// Monster numbers shared by the block set (forts give birth to snowballs), the monster
// files and the maps.
export const MON = {
  snowball: 0,
  poof: 1,
  myBall: 2,
  dog: 3,
  dogRun: 4,
  bully: 5,
  bullyRun: 6,
  bullyCry: 7,
  // Two-block vehicles: A is the left half, B the right; R/L the direction of the leg.
  plowAR: 8,
  plowAL: 9,
  plowBR: 10,
  plowBL: 11,
  carAR: 12,
  carAL: 13,
  carBR: 14,
  carBL: 15,
  cart: 16,
  sledder: 17,
  // A second plow route length for maps with two roads.
  plow2AR: 18,
  plow2AL: 19,
  plow2BR: 20,
  plow2BL: 21,
  cardinal: 22,
} as const;

/** Character sequence that throws snowballs; its counter is the snowball supply. */
export const THROWSEQ = 9;

/** Sound effect numbers in SNOW.SND. */
export const SND = {
  help: 0,
  kill: 1,
  money: 2,
  pay: 3,
  life: 4,
  score: 5,
  lose: 6,
  ammo: 7,
  other: 8,
  throw: 9,
  hurt: 10,
  die: 11,
  brake: 12,
  push: 13,
} as const;
