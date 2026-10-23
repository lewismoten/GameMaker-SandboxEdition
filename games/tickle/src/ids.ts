// The numbers every file of CERTIFIED RAT TICKLER agrees on: monster slots (the block sets and
// Doc Leo's hands give birth to some), Doc Leo's sequences, keys and counters, and the sounds.
//
// The technique is the game, and it is done with monster powers and the shapes of the sprites:
//   - a wary rat (power 150) keeps low to the floor: its pixels are all in the bottom half of
//     its block;
//   - PIN sends Doc Leo's hands out to both sides, palms pressing down (power 160): they touch
//     the wary rat and it is pinned (a stronger monster turns a weaker one into its next);
//   - a pinned rat lies on its back with its paws up in the air (power 160, the same as a pin:
//     pinning it again does nothing);
//   - TICKLE sends wiggling fingers out to both sides (power 170), but only high up in the block,
//     over a belly: they never touch a wary rat crouched on the floor (no pixels meet, so
//     nothing happens), and they always touch the paws of a pinned one, which turns into a
//     giggling rat: pin first, or the rat will never read it as play;
//   - a giggling rat (power 50) chirps at 50 kHz and comes to Doc Leo's hand; touching it adds it
//     to the laughing carpet (counter 20) and it scampers off to join the others.
// Bumping into a rat that isn't playing startles it: 22 kHz, dread, and Doc Leo's rapport drops.

export const MON = {
  /** Doc Leo's hands pressing down, one to each side: PIN. */
  pinR: 0,
  pinL: 1,
  /** Doc Leo's fingers wiggling, one hand to each side: TICKLE. */
  tickleR: 2,
  tickleL: 3,
  /** The white lab rats: wary (slow), tense (quick), pinned, giggling, scampering off. */
  labRat: 4,
  labTense: 5,
  labPinned: 6,
  labGiggle: 7,
  labOff: 8,
  /** The wild rats of the city: the same, in agouti brown. */
  wildRat: 9,
  wildTense: 10,
  wildPinned: 11,
  wildGiggle: 12,
  wildOff: 13,
  /** The night janitor's floor buffer, whirring back and forth (big, solid). */
  buffer: 14,
  /** Dean Dour of the Board of Serious Science, two blocks tall (A his head, B his suit). */
  deanA: 15,
  deanB: 16,
  /** A sewer alligator, two blocks long (A his snout, B his tail). */
  gatorA: 17,
  gatorB: 18,
  /** A little brown bat: harmless, and the bat detector loves it (a hello for points). */
  bat: 19,
  batOff: 20,
  /** Loaf #13 on a lunch tray, the mustard seed in red sneakers and the third goat: cameos (a hello for points). */
  loaf: 21,
  loafOff: 22,
  seed: 23,
  seedOff: 24,
  goat: 25,
  goatOff: 26,
  /** A spark leaping off a Jacob's ladder. */
  spark: 27,
  /** A pigeon in the storm on the tower. */
  pigeon: 28,
} as const;

/** Monster powers: a stronger monster turns a weaker one it touches into its next. */
export const POWER = {
  /** Cameos and giggling rats: a touch from Doc Leo takes them (under 100). */
  hello: 50,
  rat: 150,
  pin: 160,
  pinned: 160,
  tickle: 170,
  /** Hazards: nothing Doc Leo sends out stops them. */
  hazard: 200,
} as const;

/** Sequences: 0..4 are Game-Maker's own (idle, die, hurt, pick up, drop). */
export const SEQ = {
  idle: 0,
  die: 1,
  hurt: 2,
  right: 5,
  left: 6,
  hop: 7,
  hopLeft: 8,
  hopRight: 9,
  rightD: 10,
  leftA: 11,
  hopW: 12,
  pin: 13,
  pinZ: 14,
  tickle: 15,
  tickleX: 16,
  laugh: 17,
  hopLeft7: 18,
  hopRight9: 19,
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
  d: 0x2064,
  q: 0x1071,
  e: 0x1265,
  z: 0x2c7a,
  x: 0x2d78,
  l: 0x266c,
  home: 0x4700,
  pgup: 0x4900,
} as const;

/** PC scan codes the bot and the demo press. */
export const SCAN = { up: 72, down: 80, left: 75, right: 77, space: 57, q: 16, e: 18, z: 44, x: 45, l: 38 } as const;

/**
 * The laughing carpet: every rat tickled happy, all game long. Counters 20 and up refuse a touch
 * that would empty them, so each level's door only lets Doc Leo through with enough rats behind
 * him (and gives them straight back as he passes). Like money, a counter starts at 1 and shows
 * one less.
 */
export const CARPET = 20;
/** The laughing carpet each level's door asks for (all game long, not just that level). */
export const NEEDED = [3, 10, 18, 26] as const;

/** Sound effect numbers in each .SND (0..8 are the ones PLAYGAME plays by itself). */
export const SND = {
  /** Rapport back (a cup of coffee). */
  help: 0,
  /** A pin or a tickle lands (a squeak and the bat detector's click). */
  kill: 1,
  money: 2,
  pay: 3,
  /** An extra life: the rubber chicken honks. */
  life: 4,
  /** Points (yogurt drops, cheese). */
  score: 5,
  lose: 6,
  /** A counter up: a rat joins the laughing carpet (50 kHz: chirps of joy). */
  gain: 7,
  /** A counter spent: a door opens for the carpet. */
  spend: 8,
  hop: 9,
  step: 10,
  /** Rapport down: 22 kHz, dread. */
  dread: 11,
  die: 12,
  pin: 13,
  tickle: 14,
  laugh: 15,
} as const;
