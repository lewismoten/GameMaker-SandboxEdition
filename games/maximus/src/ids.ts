// Numbers every file of Maximus agrees on: which block slots hold the ten courier
// modules and the ten star-shards, which counters the shards fill, which monster slots
// are the courier's own shots, and the keys.

/** Background block slots shared by every .BBL (same art, same shared palette colors). */
export const ITEM_BASE = 140; // 140..149: the ten courier modules (inventory objects)
export const SHARD_BASE = 130; // 130..139: the ten star-shards (planet sets) / shard gates (space set)

/** Counters: 1 lives, 3 money (credits), 5..19 sequence ammo, 20..29 the star-shards. */
export const SHARD_COUNTER = 20;
export const MONEY = 3;

/** The ten courier modules, by inventory block (ITEM_BASE + n). */
export const MODULES = [
  { id: 'plasma', name: 'Plasma Lance', key: 'Z' },
  { id: 'nova', name: 'Nova Core', key: 'X' },
  { id: 'dash', name: 'Dash Boots', key: 'Q / E' },
  { id: 'shield', name: 'Shield Emitter', key: 'C' },
  { id: 'hover', name: 'Hover Pack', key: 'F' },
  { id: 'mine', name: 'Mine Layer', key: 'V' },
  { id: 'medkit', name: 'Med Kit', key: 'H' },
  { id: 'flak', name: 'Flak Cannon', key: 'W' },
  { id: 'hydro', name: 'Hydro Jets', key: 'Q / E (sub)' },
  { id: 'spring', name: 'Spring Shocks', key: 'Up (rover)' },
] as const;
export type ModuleId = (typeof MODULES)[number]['id'];
export const itemBlock = (id: ModuleId) => ITEM_BASE + MODULES.findIndex((m) => m.id === id);

export const SHARDS = ['Ruby', 'Amber', 'Citrine', 'Emerald', 'Jade', 'Aqua', 'Sapphire', 'Amethyst', 'Rose', 'Pearl'] as const;

/** PC scan codes (high byte of a sequence key). */
export const SCAN = {
  esc: 1,
  q: 16,
  w: 17,
  e: 18,
  t: 20,
  p: 25,
  a: 30,
  s: 31,
  d: 32,
  f: 33,
  h: 35,
  l: 38,
  z: 44,
  x: 45,
  c: 46,
  v: 47,
  b: 48,
  m: 50,
  space: 57,
  home: 71,
  up: 72,
  pgup: 73,
  left: 75,
  right: 77,
  end: 79,
  down: 80,
  pgdn: 81,
} as const;
const ASCII: Partial<Record<keyof typeof SCAN, number>> = {
  q: 113,
  w: 119,
  e: 101,
  t: 116,
  p: 112,
  a: 97,
  s: 115,
  d: 100,
  f: 102,
  h: 104,
  l: 108,
  z: 122,
  x: 120,
  c: 99,
  v: 118,
  b: 98,
  m: 109,
  space: 32,
};
/** A sequence key word: scan code << 8 | ASCII. */
export const keyOf = (k: keyof typeof SCAN) => (SCAN[k] << 8) | (ASCII[k] ?? 0);

/**
 * Character sequences, the same number for the same job in every .CHR so the ammo
 * counters (meter[seq]) carry from the pod to the suit, the sub and the rover.
 */
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
  fire: 9,
  plasma: 10,
  nova: 11,
  dashR: 12,
  dashL: 13,
  shield: 14,
  hover: 15,
  mine: 16,
  medkit: 17,
  flak: 18,
  hail: 19,
} as const;

/** Monster slots every .MON reserves for the courier's weapons (fired from .CHR frames). */
export const MON = {
  /** 0..43 are each set's own creatures. */
  creatures: 44,
  healPod: 44,
  healGlow: 45,
  flakL: 46,
  flakR: 47,
  credit: 48,
  heart: 49,
  gem: 50,
  spark: 51,
  bolt: 52,
  plasma: 53,
  shield: 54,
  mine: 55,
  nova: 56, // 56..63: N, NE, E, SE, S, SW, W, NW
} as const;
/** Monster blocks every .MBL reserves for weapon and loot art (shared palette colors). */
export const MBL_SHARED_BASE = 80; // 80..99

/** Sound effect slots in the .SND (0..8 are fixed by Game-Maker). */
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
  jump: 9,
  fire: 10,
  plasma: 11,
  nova: 12,
  dash: 13,
  shield: 14,
  hover: 15,
  mine: 16,
  hurt: 17,
  die: 18,
  pickup: 19,
  drop: 20,
  hail: 21,
  thrust: 22,
  swim: 23,
  rover: 24,
  medkit: 25,
  flak: 26,
  splash: 27,
  warp: 28,
  crouch: 29,
} as const;
