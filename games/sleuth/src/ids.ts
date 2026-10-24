// Numbers the files agree on: counters, character sequences, keys and sounds.

/**
 * Counters (the .CHR repetition meters). PLAYGAME lets a block refuse to be touched when
 * its counter would drop to zero or below, so each of these is stored one higher than it
 * reads: 1 means none.
 */
export const CTR = {
  /** Evidence collected: the Money counter (F2 shows it as "Money"). Doors test it. */
  evidence: 3,
  /** Lens charges: carrying the prop magnifying glass lets hidden things show. */
  lens: 20,
  /** Lantern oil: the dark under the stage only shows where the lantern has been. */
  lantern: 21,
  /** Keys on Ada's ring. */
  keys: 22,
  /** How many of the safe's three dials show the right symbol. */
  dials: 23,
  /** A wrong accusation waiting to be paid for. */
  strike: 24,
  /** Something found behind the green room's fireplace at 2 AM. */
  egg: 25,
} as const;

/** Sequence slots: 0-4 are PLAYGAME's own (idle, die, hurt, pick up, drop). */
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
  d: 9,
  a: 10,
  w: 11,
  s: 12,
  q: 13,
  e: 14,
  num7: 15,
  num9: 16,
  num1: 17,
  num3: 18,
  lens: 19,
} as const;

/** PC scan codes. */
export const SCAN = {
  right: 0x4d,
  left: 0x4b,
  up: 0x48,
  down: 0x50,
  d: 0x20,
  a: 0x1e,
  w: 0x11,
  s: 0x1f,
  q: 0x10,
  e: 0x12,
  num7: 0x47,
  num9: 0x49,
  num1: 0x4f,
  num3: 0x51,
  space: 0x39,
  z: 0x2c,
  enter: 0x1c,
  esc: 0x01,
} as const;

/** Sequence keys: scan code in the high byte, ASCII in the low byte. */
export const KEY = {
  right: 0x4d00,
  left: 0x4b00,
  up: 0x4800,
  down: 0x5000,
  d: 0x2064,
  a: 0x1e61,
  w: 0x1177,
  s: 0x1f73,
  q: 0x1071,
  e: 0x1265,
  num7: 0x4700,
  num9: 0x4900,
  num1: 0x4f00,
  num3: 0x5100,
  space: 0x3920,
  z: 0x2c7a,
};

/** Sound effects in FINAL.SND (0-8 are PLAYGAME's own events). */
export const SND = {
  help: 0,
  kill: 1,
  addMoney: 2, // a piece of evidence: the "aha" chord
  subMoney: 3,
  addLife: 4,
  addScore: 5,
  subScore: 6,
  addOther: 7,
  subOther: 8,
  pickup: 9,
  strike: 10,
  hurt: 11,
  lens: 12,
  none: 30,
} as const;
