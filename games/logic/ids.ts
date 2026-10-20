// Shared numbers: monster slots, sound effects and keys.

/** Monsters 0..15 are each board's own currents (battery k gives birth to monster k). */
export const ROUTES = 16;

/** Sound set slots. PLAYGAME plays 0..8 by itself (1 when a monster is beaten, 4 for a life...). */
export const SND = {
  help: 0,
  click: 1,
  life: 4,
  score: 5,
  zap: 9,
  fizzle: 10,
  boing: 11,
  none: 30,
} as const;

/** Key words: scan code << 8 | ASCII. */
export const KEY = {
  up: 0x4800,
  down: 0x5000,
  left: 0x4b00,
  right: 0x4d00,
  w: 0x1177,
  s: 0x1f73,
  a: 0x1e61,
  d: 0x2064,
  r: 0x1372,
} as const;
