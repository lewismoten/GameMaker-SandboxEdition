// Kit seen from above, for the Starters with a top-down view (gravity-on-gravity-off, overhead): one 20x20 block a pose
// instead of two, drawn in four facing directions (down, up, right and left) with two walking steps each, in the same
// teal beanie and orange hoodie. The pictures are a game's second hero.cbl; its character file has Up and Down walk the
// way a person would, since nothing pulls him (the side-view Up and Down climb a ladder).
import { CHARBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { Book } from './book';
import { KEY, SEQ, SND } from './ids';
import type { Pal } from './palette';

const T = 255;
/** Pixels a frame while walking (the same as the side view). */
const STEP = 4;

export type Facing = 'down' | 'up' | 'right' | 'left';
/** A step: 0 and 1 are the two strides, 2 is standing. */
type Step = 0 | 1 | 2;

/** One pose, 20x20: `facing` and `step`. Right is drawn; left is the right mirrored. */
function pose(pal: Pal, facing: Facing, step: Step): Pixels {
  if (facing === 'left') return pose(pal, 'right', step).flipX();
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const skin = r('skin');
  const teal = r('teal');
  const white = r('white');
  const hair = r('hair');
  const orange = r('orange');
  const ink = c('ink', 0);
  const side = facing === 'right';
  const x0 = side ? 9.5 : 10;
  // shoes first, so the body covers their tops: a foot forward and one back
  const lift = step === 2 ? [0, 0] : step === 0 ? [0, 1] : [1, 0];
  if (side) {
    const fx = step === 2 ? [6, 9] : step === 0 ? [3, 12] : [12, 3];
    p.rect(fx[0], 16, 4, 2, white[3]).rect(fx[1], 16, 4, 2, white[2]);
  } else {
    p.rect(5, 16 + lift[0], 4, 2, white[3]).rect(11, 16 + lift[1], 4, 2, white[3]);
    p.rect(5, 17 + lift[0], 4, 1, white[1]).rect(11, 17 + lift[1], 4, 1, white[1]);
  }
  // the hoodie
  blob(p, x0, 14, side ? 5.2 : 6.6, 4.2, orange, 0, 4);
  if (!side) {
    // arms at his sides, swinging with the stride
    const sw = step === 2 ? [0, 0] : step === 0 ? [-1, 1] : [1, -1];
    p.rect(2, 12 + sw[0], 3, 5, orange[2]).rect(15, 12 + sw[1], 3, 5, orange[2]);
    p.rect(2, 12 + sw[0], 1, 5, orange[3]).rect(17, 12 + sw[1], 1, 5, orange[1]);
    p.disc(3.5, 17 + sw[0], 1.6, skin[2]).disc(16.5, 17 + sw[1], 1.6, skin[2]);
    p.rect(8, 13, 4, 1, orange[3]); // the hoodie's front pocket line
    if (facing === 'down') p.rect(9, 11, 1, 3, white[2]).rect(11, 11, 1, 3, white[2]); // the drawstrings
  } else {
    // one arm swinging, seen edge on
    const a = step === 2 ? 0 : step === 0 ? 3 : -3;
    p.rect(8 + a, 12, 4, 4, orange[2])
      .rect(8 + a, 12, 4, 1, orange[3])
      .disc(10 + a, 16.5, 1.5, skin[2]);
  }
  // the head: hair at the back, the round face, then the knit beanie over the top
  if (facing === 'up') blob(p, 10, 8.5, 6.4, 5.4, hair, 0, 2);
  else if (side) {
    blob(p, 7, 8.5, 3.2, 4.2, hair, 0, 2);
    blob(p, 11, 8.5, 5.2, 5.2, skin, 0, 3);
  } else blob(p, 10, 8.5, 6, 5.4, skin, 0, 3);
  const dome = new Pixels(20, 20, T);
  blob(dome, side ? 9 : 10, 6, side ? 6.4 : 7, 5.2, teal, 0, 4);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 20; x++) if (dome.get(x, y) !== T) p.set(x, y, dome.get(x, y));
  const cx = side ? 3 : 3;
  const cw = side ? 12 : 14;
  p.rect(cx, 6, cw, 3, teal[3]).rect(cx, 6, cw, 1, teal[4]).rect(cx, 8, cw, 1, teal[2]);
  for (let x = cx + 1; x < cx + cw; x += 2) p.set(x, 7, teal[2]);
  const pom = side ? 8 : 10;
  p.disc(pom + 0.5, 3.5, 3.3, teal[1])
    .disc(pom + 0.5, 3.5, 2.7, white[3])
    .set(pom + 2, 5, white[2])
    .set(pom + 1, 5, white[2]);
  // the face, when it shows
  if (facing === 'down') {
    for (const x of [7, 12]) p.rect(x, 10, 2, 2, ink).set(x + 1, 10, white[3]);
    p.set(5, 12, c('pink', 2)).set(15, 12, c('pink', 2));
    p.set(8, 13, ink).set(9, 14, ink).set(10, 14, ink).set(11, 13, ink);
  } else if (side) {
    p.rect(13, 10, 2, 2, ink).set(14, 10, white[3]);
    p.set(16, 11, skin[1]).set(11, 13, c('pink', 2)).set(14, 13, ink).set(15, 13, ink);
  }
  return outline(p, ink, { transparent: T });
}

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
