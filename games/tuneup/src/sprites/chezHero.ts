// THE CHEZ as the hero for the test drive and the parade (CHEZ.CBL): the shared side view
// (games/kit/chez.ts) at half scale, a little taller, facing left so the passenger side shows,
// with Teddy in the front passenger seat looking out of the door window. A PLAYGAME hero is one
// block wide and two tall, so the car is the bottom block and the top block is clear.
//
// CHEZ.CHR drives the way the archive's Jet Driver does: Left is the accelerator, a momentum
// sequence (its frames add to the car's momentum instead of moving it, engine/character.ts);
// let go and the car coasts to a stop (momentum decays to 5/6 a tick while no momentum sequence
// runs); Right is the brake, a sequence that holds still so the decay goes on; Down backs up
// (momentum the other way, gently). Space toots the
// horn and bounces the car on its springs (a reach up: the parade's cue lamps hang overhead).
import { CHARBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { chezPicture } from '../../../kit/chez';
import { makeBook } from '../../../snowbound/src/sprites/kidArt';
import { P } from '../art/palette';
import { CTR, KEY, MONEY, SEQ, SND } from '../ids';
import { CHEZ_INK } from '../screens/art';

const c = P.c;
/** How much taller than true the little car is drawn (room for Teddy in the window). */
const TALL = 1.6;

/** Teddy's head in the door window: two upright ears, a tan face, a white blaze and muzzle. */
function teddy(p: Pixels, x: number, y: number): void {
  p.set(x, y, c('corgi', 2)).set(x + 3, y, c('corgi', 2));
  p.rect(x, y + 1, 4, 2, c('corgi', 3))
    .set(x + 1, y + 1, c('ink', 0))
    .set(x + 3, y + 1, c('ink', 0));
  p.set(x + 2, y + 1, c('fur', 2))
    .rect(x + 1, y + 3, 2, 1, c('fur', 2))
    .set(x, y + 2, c('ink', 0));
}

/** One frame of the car: its wheels' turn (0 or 1), lifted `lift` pixels on its springs. */
function car(turn: number, lift = 0): Pixels {
  const body = chezPicture(CHEZ_INK, 'left', 0.5, TALL);
  const p = new Pixels(20, 20, 255);
  const top = 20 - body.h - lift;
  p.blit(body, 0, top, 255);
  teddy(p, 9, top + 2);
  // the hubcaps' bolt turns round as the wheels roll
  for (const wx of [Math.round(20 - 9.35 * 0.5), Math.round(20 - 31.1 * 0.5)]) {
    const wy = 20 - lift - 2;
    p.set(wx + (turn ? 1 : -1), wy, c('ink', 1));
  }
  return p;
}

/** CHEZ.CBL: the clear top block, the car rolling (two frames) and the car bouncing on its springs. */
export function chezBlocks() {
  const book = makeBook('cbl');
  book.add('clear', new Pixels(20, 20, 255));
  book.add('roll0', car(0));
  book.add('roll1', car(1));
  book.add('bounce', car(0, 2));
  return book;
}

const CB = chezBlocks();
/** The accelerator's push every other tick (momentum, capped by PLAYGAME at 11 pixels a tick). */
export const GAS = 1;
/** The horn's bounce: pixels up (gravity brings the car back down). */
export const BOUNCE = 6;

const f = (pose: string, pause = 1, x = 0, y = 0): Frame => ({ ...emptyFrame(), x, y, pic1: CHARBL, pic2: CB.n(pose), pause });

/** CHEZ.CHR: THE CHEZ, Left to go, Right to brake, Down to back up, Space to toot. */
export function buildChez(): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  set(S[SEQ.idle], [f('roll0', 30)]);
  set(S[SEQ.die], [f('roll0', 30)], { jstkBut: 0 });
  set(S[SEQ.hurt], [f('roll0', 2)], { jstkBut: 0 });
  set(S[3], [f('roll0')], { key: 0 });
  set(S[4], [f('roll0')], { key: 0 });
  set(S[SEQ.left], [f('roll0', 2, -GAS), f('roll1', 2, -GAS)], { key: KEY.left, jstkMov: 7, momentum: 1 });
  set(S[SEQ.right], [f('roll0', 1)], { key: KEY.right, jstkMov: 3 });
  set(S[SEQ.down], [f('roll1', 3, GAS), f('roll0', 3, GAS)], { key: KEY.down, jstkMov: 5, momentum: 1 });
  set(S[SEQ.boop], [f('bounce', 2, 0, -BOUNCE), f('roll0', 3)], { key: KEY.space, jstkBut: 1, sound: SND.boop, norepeat: 1 });
  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 20;
  ch.meter[1] = 3;
  for (const n of [MONEY, ...Object.values(CTR)]) ch.meter[n] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}

export { CB as CHEZ_BLOCKS };
