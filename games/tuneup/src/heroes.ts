// The other heroes: Teddy (TEDDY.CHR over TEDDY.CBL, the trilogy's own corgi drawing, one block
// tall) for the levels only a small, well-trained dog can do, and nobody (NOBODY.CHR over
// NOBODY.CBL, one clear block and no keys) for the dream's swim, a scene played on the map that
// nobody steers.
//
// Teddy walks, hops (Up; Q and E up and sideways) and does four of his real tricks: Z turn,
// X roll over, C play dead, V dance. Each trick ends with a sparkle that flies off to his right
// (realMonsters.ts), on the trick ladder.
import { CHARBL, MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { makeBook } from '../../snowbound/src/sprites/kidArt';
import { CB } from '../../teddy2/src/characters/character';
import { CTR, KEY, MON, MONEY, SEQ, SND } from './ids';

export { CB as TEDDY_BLOCKS };

const JOY = { up: 1, upRight: 2, right: 3, upLeft: 8, any: 9 };
/** The bottom block flipped left-right (Teddy is the bottom block; the top is empty). */
const MIRROR = 0x40;
/** Pixels a tick walking, and the upward push a tick while Up is held. */
const STEP = 5;
const HOP = 11;
const HOP_STEP = 4;
/** Z X C V: turn, roll over, play dead, dance (the trick ladder's order). */
export const TRICK_KEYS = ['z', 'x', 'c', 'v'] as const;

const f = (pose: string, pause = 1, o: { x?: number; y?: number; mirror?: boolean } = {}): Frame => ({
  ...emptyFrame(),
  x: o.x ?? 0,
  y: o.y ?? 0,
  pic1: CHARBL,
  pic2: CB.id(pose),
  pause,
  orient: o.mirror ? MIRROR : 0,
});
/** A frame that sends trick `k`'s sparkle out from Teddy's own block. */
const sparkle = (k: number): Frame => ({ ...emptyFrame(), x: 0, y: 20, pic1: MON.trick0 + k, pic2: MONBL, pause: 1 });

/** Each trick's frames before its sparkle. */
const TRICKS: Frame[][] = [
  [f('stand', 3), f('front', 2), f('stand', 3, { mirror: true }), f('back', 2), f('stand', 3)],
  [f('dead', 3), f('roll1', 3), f('roll2', 3), f('dead', 3), f('front', 2)],
  [f('hurt', 2), f('frontTilt', 3), f('dead', 14)],
  [f('frontBeg', 4), f('frontHop', 3), f('frontBeg', 4), f('frontHop', 3)],
];

export function buildTeddy(): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  set(S[SEQ.idle], [f('front', 36), f('frontBlink', 3), f('front', 24), f('frontTilt', 20), f('front', 18), f('frontBlink', 3)]);
  set(S[SEQ.die], [f('hurt', 3), f('frontTilt', 5), f('sleep', 30)], { sound: SND.faint, jstkBut: 0 });
  set(S[SEQ.hurt], [f('hurt', 2), f('front', 1), f('hurt', 2)], { sound: SND.hurt, jstkBut: 0 });
  set(S[3], [f('front')], { key: 0 });
  set(S[4], [f('front')], { key: 0 });
  const walk = (dx: number, mirror: boolean) => ['walk1', 'stand', 'walk2', 'stand'].map((p) => f(p, 1, { x: dx, mirror }));
  set(S[SEQ.right], walk(STEP, false), { key: KEY.right, jstkMov: JOY.right });
  set(S[SEQ.left], walk(-STEP, true), { key: KEY.left, jstkMov: 7 });
  set(S[SEQ.hop], [f('frontHop', 1, { y: -HOP })], { key: KEY.up, jstkMov: JOY.up, sound: SND.hop });
  const side = (dx: number, mirror: boolean) => [f('hop', 1, { x: dx, y: -HOP, mirror }), f('hop', 1, { x: dx, y: -HOP, mirror })];
  set(S[SEQ.hopLeft], side(-HOP_STEP, true), { key: KEY.q, jstkMov: JOY.upLeft, sound: SND.hop });
  set(S[SEQ.hopRight], side(HOP_STEP, false), { key: KEY.e, jstkMov: JOY.upRight, sound: SND.hop });
  TRICKS.forEach((frames, k) =>
    set(S[SEQ.trick0 + k], [...frames, sparkle(k), f('front', 2)], { key: KEY[TRICK_KEYS[k]], sound: SND.trick0 + k, ground: 1, norepeat: 1 }),
  );
  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 20;
  ch.meter[1] = 3;
  for (const n of [MONEY, ...Object.values(CTR)]) ch.meter[n] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}

/** NOBODY.CBL: one clear block. */
export function nobodyBlocks() {
  const book = makeBook('cbl');
  book.add('clear', new Pixels(20, 20, 255));
  return book;
}

/** NOBODY.CHR: nobody to see and no keys to press; the map does the rest. */
export function buildNobody(): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const clear: Frame = { ...emptyFrame(), pic1: CHARBL, pic2: 0, pause: 200 };
  for (const n of [SEQ.idle, SEQ.die, SEQ.hurt, 3, 4]) set(S[n], [clear], { key: 0, jstkBut: 0 });
  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 20;
  ch.meter[1] = 3;
  for (const n of [MONEY, ...Object.values(CTR)]) ch.meter[n] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}
