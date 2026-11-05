// Kit in a corner view: one 20x20 block a pose, drawn only on the four diagonal facings (down-right, down-left,
// up-right, up-left), as a person seen from a corner of the room. He is never drawn facing the camera, which
// would be wider than he is tall in this view. He is about 11 pixels wide and 19 tall, a little under one cube's
// height, in the same teal beanie and orange hoodie as every Kit (colors from games/kit/starter/palette.ts).
// The pictures are this game's cbl; it has two character files made from them: square (levels 1 and 2: the arrows
// walk the square grid and he faces the nearest diagonal) and diagonal (level 3: each arrow walks a drawn diagonal).
import { CHARBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { Book } from '../../kit/starter/book';
import { KEY, SEQ, SND } from '../../kit/starter/ids';
import type { Pal } from '../../kit/starter/palette';

const T = 255;

/** The four facings, named by where he is heading on the screen. */
export type Facing = 'dr' | 'dl' | 'ur' | 'ul';
/** A step: 0 and 1 are the two strides, 2 is standing. */
type Step = 0 | 1 | 2;

/** One pose, 20x20. The right-hand facings are drawn; the left-hand ones are those mirrored. */
function pose(pal: Pal, facing: Facing, step: Step): Pixels {
  if (facing === 'dl') return pose(pal, 'dr', step).flipX();
  if (facing === 'ul') return pose(pal, 'ur', step).flipX();
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const skin = r('skin');
  const teal = r('teal');
  const white = r('white');
  const hair = r('hair');
  const orange = r('orange');
  const ink = c('ink', 0);
  const front = facing === 'dr';
  // feet: one forward and one back as he strides; the legs are two short dark-blue-free strokes under the hoodie
  const lift = step === 2 ? [0, 0] : step === 0 ? [0, 1] : [1, 0];
  const legX = [7, 10];
  const blue = r('blue');
  for (let k = 0; k < 2; k++) {
    const x = legX[k] + (step === 2 ? 0 : (k === 0 ? 1 : -1) * (step === 0 ? 1 : -1));
    p.rect(x, 14, 3, 3 - lift[k], blue[k === 0 ? 2 : 1]);
    p.rect(x - 1, 16 - lift[k], 4, 2, k === 0 ? white[3] : white[2]);
  }
  // the hoodie, a narrow body
  blob(p, 9.5, 12.5, 4.2, 3.2, orange, 0, 4);
  // arms: the far one behind (darker), the near one in front, swinging with the stride
  const sw = step === 2 ? [0, 0] : step === 0 ? [-1, 1] : [1, -1];
  p.rect(4, 10 + sw[0], 2, 4, orange[1]).disc(5, 14 + sw[0], 1.1, skin[1]);
  p.rect(13, 10 + sw[1], 2, 4, orange[2]).disc(14, 14 + sw[1], 1.1, skin[2]);
  if (front) p.rect(8, 13, 3, 1, orange[3]); // the hoodie's pocket line
  // the head: hair behind, the face turned toward the right, then the beanie
  if (front) {
    blob(p, 7.5, 7.5, 2.6, 2.6, hair, 0, 2);
    blob(p, 10.5, 7.5, 4.2, 3.2, skin, 0, 3);
  } else {
    blob(p, 9.5, 7.5, 4.6, 3.4, hair, 0, 2);
    blob(p, 13.5, 8, 1.2, 1.6, skin, 0, 3); // his ear, on the side he is turned to
  }
  const dome = new Pixels(20, 20, T);
  blob(dome, 9.5, 4.5, 5.2, 3.4, teal, 0, 4);
  for (let y = 0; y < 6; y++) for (let x = 0; x < 20; x++) if (dome.get(x, y) !== T) p.set(x, y, dome.get(x, y));
  p.rect(4, 5, 11, 2, teal[3]).rect(4, 5, 11, 1, teal[4]).rect(4, 6, 11, 1, teal[2]);
  for (let x = 5; x < 15; x += 2) p.set(x, 5, teal[2]);
  const pom = front ? 8 : 9;
  p.disc(pom + 0.5, 1.8, 1.9, teal[1]).disc(pom + 0.5, 1.8, 1.4, white[3]);
  if (front) {
    p.rect(11, 8, 1, 2, ink).rect(14, 8, 1, 2, ink);
    p.set(13, 10, c('pink', 2)).set(12, 10, ink);
  }
  return outline(p, ink, { transparent: T });
}

/** The four facings' pictures by name: `dr.0`, `dr.1`, `dr.stand`, `dl.0`, and so on. */
export function buildCornerHeroBlocks(pal: Pal): Book {
  const book = new Book('cbl');
  for (const f of ['dr', 'dl', 'ur', 'ul'] as Facing[]) {
    book.add(`${f}.0`, pose(pal, f, 0));
    book.add(`${f}.1`, pose(pal, f, 1));
    book.add(`${f}.stand`, pose(pal, f, 2));
  }
  return book;
}

/** A pose as a picture, for screens and previews. */
export const cornerPicture = (book: Book, name: string): Pixels => book.pics.get(name)!;

/**
 * Pixels per frame, across and down, of a diagonal step. The drawn floor's diamonds are twice as wide as high, so a
 * step along one of their edges goes two pixels across for every one down: 4 and 2 here (the square steps of the
 * first two levels are 4 across or 4 down).
 */
export const STEP = { across: 4, down: 2, square: 4 } as const;

/** The mapping the diagonal walk uses on its arrows, and the nearest facing the square walk gives them. */
export const ARROW_FACING: Record<'up' | 'right' | 'down' | 'left', Facing> = { up: 'ur', right: 'dr', down: 'dl', left: 'ul' };

/**
 * The hero's character file. With `diagonal` false the four arrows walk the square grid (up, right, down, left) and
 * he faces the nearest diagonal. With `diagonal` true each arrow walks one diagonal of the drawn floor, every frame
 * of its sequence moving him both across and down: Up is up-right, Right is down-right, Down is down-left and Left
 * is up-left. Space has nothing to do (nothing pulls him down).
 */
export function buildCornerHero(cb: Book, diagonal: boolean): Character {
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
  set(S[SEQ.idle], [f('dr.stand', { pause: 40 }), f('dr.stand', { pause: 20 })]);
  set(S[SEQ.die], [f('dr.stand', { pause: 10 }), f('dr.stand', { pause: 24 })], { sound: SND.die, jstkBut: 0 });
  set(S[SEQ.hurt], [f('dr.stand', { pause: 2 }), f('dr.stand')], { sound: SND.hurt, jstkBut: 0 });
  set(S[3], [f('dr.stand')], { key: 0 });
  set(S[4], [f('dr.stand')], { key: 0 });
  const walk = (face: Facing, dx: number, dy: number) => [
    f(`${face}.0`, { x: dx, y: dy }),
    f(`${face}.stand`, { x: dx, y: dy }),
    f(`${face}.1`, { x: dx, y: dy }),
    f(`${face}.stand`, { x: dx, y: dy }),
  ];
  const q = STEP.square;
  const a = STEP.across;
  const d = STEP.down;
  // [dx, dy] of each arrow
  const move = diagonal ? { up: [a, -d], right: [a, d], down: [-a, d], left: [-a, -d] } : { up: [0, -q], right: [q, 0], down: [0, q], left: [-q, 0] };
  const arrows: [keyof typeof move, number, number, number, number][] = [
    ['right', SEQ.right, SEQ.rightD, KEY.right, KEY.d],
    ['left', SEQ.left, SEQ.leftA, KEY.left, KEY.a],
    ['up', SEQ.up, SEQ.upW, KEY.up, KEY.w],
    ['down', SEQ.down, SEQ.downS, KEY.down, KEY.s],
  ];
  const jstk = { right: 3, left: 7, up: 1, down: 5 };
  for (const [name, seq, seqLetter, key, letter] of arrows) {
    const [dx, dy] = move[name];
    set(S[seq], walk(ARROW_FACING[name], dx, dy), { key, jstkMov: jstk[name] });
    set(S[seqLetter], walk(ARROW_FACING[name], dx, dy), { key: letter });
  }
  // the sequences the side view's Space and animations used, kept empty so the numbers match hero.chr
  for (const n of [SEQ.jump, SEQ.dig, SEQ.throw, SEQ.cheer]) set(S[n], [f('dr.stand')], { key: 0 });
  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100;
  ch.meter[1] = 3;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}
