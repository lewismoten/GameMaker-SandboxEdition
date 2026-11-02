// The Beltway's driver (DRIVER.CHR, DRIVER.CBL): nobody you can see. A hero is two blocks tall
// at most, so the driver's seat is drawn as scenery and the hero is a walker on the dash's lane
// strip: its top block is clear (so only its own block touches) and its only picture is the lit
// lens of the lane lamp it stands on. PLAYGAME can't turn a touched cell back by itself, so a lamp
// lit by a touch couldn't go dark again when the driver moved on; the walker's own picture can.
// Left and Right walk exactly one block a tap (four frames of 5 pixels). Their sequences are marked
// ground (PLAYGAME then neither stops them when the key is let go nor starts another key's over
// them, and holds the key's release till the step is done) and no-repeat (so a step ends there,
// however long the key was held): a lane change is one tap and finishes on its own.
import { CHARBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { makeBook } from '../../../snowbound/src/sprites/kidArt';
import { P } from '../art/palette';
import { LENS } from '../art/cab';
import { CTR, KEY, MONEY, SEQ } from '../ids';

const c = P.c;
/** The lit lens: the lamp's glow, brightest at its middle, and a gleam. */
function lit(bright: boolean): Pixels {
  const p = new Pixels(20, 20, 255);
  p.disc(LENS.x, LENS.y, LENS.r, c('glow', bright ? 2 : 1)).disc(LENS.x, LENS.y, LENS.r - 2, c('glow', 3));
  return p.set(LENS.x - 2, LENS.y - 2, c('paint', 3));
}

export function driverBlocks() {
  const book = makeBook('cbl');
  book.add('clear', new Pixels(20, 20, 255));
  book.add('lit0', lit(true));
  book.add('lit1', lit(false));
  return book;
}
const CB = driverBlocks();
export { CB as DRIVER_BLOCKS };

/** Pixels a frame walking, and the frames of a step (one block). */
const STEP = 5;
const f = (pose: string, pause = 1, x = 0): Frame => ({ ...emptyFrame(), x, y: 0, pic1: CHARBL, pic2: CB.n(pose), pause });

/** DRIVER.CHR: Left and Right change lanes, a block a tap. */
export function buildDriver(): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  // the lamp glows, a soft pulse
  set(S[SEQ.idle], [f('lit0', 12), f('lit1', 4)]);
  set(S[SEQ.die], [f('lit1', 30)], { jstkBut: 0 });
  set(S[SEQ.hurt], [f('lit0', 2)], { jstkBut: 0 });
  set(S[3], [f('lit0')], { key: 0 });
  set(S[4], [f('lit0')], { key: 0 });
  const step = (dx: number) => [0, 1, 2, 3].map(() => f('lit0', 1, dx));
  set(S[SEQ.left], step(-STEP), { key: KEY.left, jstkMov: 7, ground: 1, norepeat: 1 });
  set(S[SEQ.right], step(STEP), { key: KEY.right, jstkMov: 3, ground: 1, norepeat: 1 });
  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 20;
  ch.meter[1] = 3;
  for (const n of [MONEY, ...Object.values(CTR)]) ch.meter[n] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}
