// Kit seen from above, for the Starters with a top-down view (gravity-on-gravity-off, overhead): one 20x20 block a pose
// instead of two, drawn in four facing directions (down, up, right and left) with two walking steps each, in the same
// teal beanie and orange hoodie. The pictures are a game's second hero.cbl; its character file has Up and Down walk the
// way a person would, since nothing pulls him (the side-view Up and Down climb a ladder).
import { CHARBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from './book';
import { KEY, SEQ, SND } from './ids';
import { slimPose, type Step } from './kitSlim';
import type { Pal } from './palette';

/** Pixels a frame while walking (the same as the side view). */
const STEP = 4;

export type Facing = 'down' | 'up' | 'right' | 'left';

/** One pose, 20x20: `facing` and `step` (the slim Kit, kitSlim.ts). */
const pose = (pal: Pal, facing: Facing, step: Step): Pixels => slimPose(pal, facing, step);

/** The four facing directions' pictures, by name: `down.0`, `down.1`, `down.stand` and so on. */
export function buildTopHeroBlocks(pal: Pal): Book {
  const book = new Book('cbl');
  for (const f of ['down', 'up', 'right', 'left'] as Facing[]) {
    book.add(`${f}.0`, pose(pal, f, 0));
    book.add(`${f}.1`, pose(pal, f, 1));
    book.add(`${f}.stand`, pose(pal, f, 2));
  }
  return book;
}

/** A pose as a picture, for screens and previews. */
export const topPicture = (book: Book, name: string): Pixels => book.pics.get(name)!;

/**
 * The top-down hero's character file: the same keys as the side view's (arrows and WASD), but all four walk.
 * Space has nothing to do here: with no gravity there is nothing to jump over or fall back from.
 */
export function buildTopHero(cb: Book): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const f = (pic: string, o: { x?: number; y?: number; pause?: number } = {}): Frame => ({
    ...emptyFrame(),
    x: o.x ?? 0,
    y: o.y ?? 0,
    pic1: CHARBL,
    pic2: cb.n(pic),
    pause: o.pause ?? 1,
    orient: 0,
  });
  set(S[SEQ.idle], [f('down.stand', { pause: 40 }), f('down.stand', { pause: 20 })]);
  set(S[SEQ.die], [f('down.stand', { pause: 10 }), f('down.stand', { pause: 24 })], { sound: SND.die, jstkBut: 0 });
  set(S[SEQ.hurt], [f('down.stand', { pause: 2 }), f('down.stand')], { sound: SND.hurt, jstkBut: 0 });
  set(S[3], [f('down.stand')], { key: 0 });
  set(S[4], [f('down.stand')], { key: 0 });
  const walk = (face: Facing, dx: number, dy: number) => [
    f(`${face}.0`, { x: dx, y: dy }),
    f(`${face}.stand`, { x: dx, y: dy }),
    f(`${face}.1`, { x: dx, y: dy }),
    f(`${face}.stand`, { x: dx, y: dy }),
  ];
  set(S[SEQ.right], walk('right', STEP, 0), { key: KEY.right, jstkMov: 3 });
  set(S[SEQ.left], walk('left', -STEP, 0), { key: KEY.left, jstkMov: 7 });
  set(S[SEQ.up], walk('up', 0, -STEP), { key: KEY.up, jstkMov: 1 });
  set(S[SEQ.down], walk('down', 0, STEP), { key: KEY.down, jstkMov: 5 });
  set(S[SEQ.rightD], walk('right', STEP, 0), { key: KEY.d });
  set(S[SEQ.leftA], walk('left', -STEP, 0), { key: KEY.a });
  set(S[SEQ.upW], walk('up', 0, -STEP), { key: KEY.w });
  set(S[SEQ.downS], walk('down', 0, STEP), { key: KEY.s });
  // the sequences the side view's Space and animations used, kept empty so the numbers match hero.chr
  for (const n of [SEQ.jump, SEQ.dig, SEQ.throw, SEQ.cheer]) set(S[n], [f('down.stand')], { key: 0 });
  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100;
  ch.meter[1] = 3;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}
