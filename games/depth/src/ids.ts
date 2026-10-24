// The numbers every Depth Perception file agrees on: counters, sequences, sounds, monsters.

/** Character sequences (0..4 are Game-Maker's idle, die, hurt, pick up and drop). */
export const SEQ = {
  idle: 0,
  die: 1,
  hurt: 2,
  pickup: 3,
  up: 5,
  down: 6,
  left: 7,
  right: 8,
  fire: 9,
  w: 10,
  a: 11,
  s: 12,
  d: 13,
  q: 14,
  e: 15,
  pad7: 16,
  pad9: 17,
  pad1: 18,
  pad3: 19,
} as const;

/**
 * The three lenses of a level (red, green, blue) each count into a counter of their own, and
 * the RGB gate before the vanishing point takes one from each: at 20 and up Game-Maker refuses
 * a touch that would leave a counter at 0, so a gate stays shut until its lens is carried.
 * Counters start at 1 (shown as 0). Levels use three counters in turn, so a lens picked up
 * twice (a scene comes back as it was whenever you pull focus) never opens the next level's gate.
 */
export function lensCounters(level: number): [number, number, number] {
  const base = 20 + 3 * ((level - 1) % 3);
  return [base, base + 1, base + 2];
}

/** The last polygon Count Polygon leaves behind: the vanishing point's final door takes it. */
export const CROWN = 29;

/** Sound effect numbers in DEPTH.SND (0..8 are the slots Game-Maker plays by itself). */
export const SND = {
  help: 0,
  kill: 1,
  money: 2,
  pay: 3,
  life: 4,
  score: 5,
  lose: 6,
  lens: 7,
  gate: 8,
  fire: 9,
  hurt: 10,
  die: 11,
  egg: 12,
} as const;

/** Monster numbers (the same in every level's .MON). */
export const MON = {
  shot: 0,
  spark: 1,
  wire: 2, // wireframe cube patrolling a path
  wireH: 3, // the same, the other way
  crystal: 4, // a wireframe, rendered by a hit: touch it for points
  jaggy: 5, // aliasing staircase that hops along a path
  jaggyV: 6,
  steam: 7, // a teapot's puff, drifting at you
  mirror: 8, // the dark chrome double that chases you
  teddy: 9,
  gwinn: 10,
  leo: 11,
  bat: 12, // the Count's polygon bats
  count1: 13, // Count Polygon, 20 faces
  count2: 14, // 8 faces
  count3: 15, // 4 faces
  count4: 16, // a triangle
  count5: 17, // a point
  crown: 18, // the last polygon he drops
  pop: 19, // something de-rendered
  wireV: 20,
  shard: 21, // the Count's shard, thrown at you
  stolen: 22, // the blue lens the Count swallowed, coughed up when he flees to the far plane
} as const;

/**
 * Count Polygon's stages, each a run of monsters a ray takes him through: whole, cracked
 * (blinking), shattered (blinking faster), then the next stage's whole. The first of each
 * run is the MON.count number; the rest follow from 23 up. The point takes two rays.
 */
export const COUNT_RUNS: number[][] = [
  [MON.count1, 23, 24],
  [MON.count2, 25, 26],
  [MON.count3, 27, 28],
  [MON.count4, 29, 30],
  [MON.count5, 31],
];
/** Every Count Polygon monster in the near half of the fight, and in the far half. */
export const COUNT_NEAR = [...COUNT_RUNS[0], ...COUNT_RUNS[1]];
export const COUNT_FAR = [...COUNT_RUNS[2], ...COUNT_RUNS[3], ...COUNT_RUNS[4]];
