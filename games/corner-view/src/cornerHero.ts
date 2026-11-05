// Lena in a corner view: one 20x20 block a pose, drawn only on the four diagonal facings (down-right, down-left,
// up-right, up-left), as a person seen from a corner of the room. He is never drawn facing the camera, which
// would be wider than he is tall in this view. He is about 10 pixels wide and 19 tall, a little under one cube's
// height, in the same teal beanie and orange hoodie as every Lena (colors from games/kit/starter/palette.ts).
// The pictures are this game's cbl; it has two character files made from them: square (levels 1 and 2: the arrows
// walk the square grid and he faces the nearest diagonal) and diagonal (level 3: each arrow walks a drawn diagonal).
import { CHARBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import { KEY, SEQ, SND } from '../../kit/starter/ids';
import { kitRamp } from '../../kit/starter/heroLook';
import type { Pal } from '../../kit/starter/palette';

const T = 255;

/** The four facings, named by where he is heading on the screen. */
export type Facing = 'dr' | 'dl' | 'ur' | 'ul';
/** A step: 0 and 1 are the two strides, 2 is standing. */
type Step = 0 | 1 | 2;

/**
 * One pose, 20x20. The right-hand facings are drawn; the left-hand ones are those mirrored. He is built from plain
 * rectangles so every part can be moved: a head and beanie of 7 rows (a third of his height), narrower than his
 * shoulders; one arm forward; the feet stepping along the diagonal he walks.
 */
function pose(pal: Pal, facing: Facing, step: Step): Pixels {
  if (facing === 'dl') return pose(pal, 'dr', step).flipX();
  if (facing === 'ul') return pose(pal, 'ur', step).flipX();
  const { c, r } = pal;
  const g = new Pixels(20, 20, T); // drawn with his head at the top; shifted down a row below, to leave room for the outline
  const skin = kitRamp(pal, 'skin');
  const teal = kitRamp(pal, 'hat');
  const white = r('white');
  const hair = kitRamp(pal, 'hair');
  const orange = kitRamp(pal, 'hood');
  const blue = kitRamp(pal, 'pants');
  const ink = c('ink', 0);
  const front = facing === 'dr';
  const fwd = step === 0 ? 1 : step === 1 ? -1 : 0; // how far the near leg is ahead of the far one
  // legs and shoes: the forward foot goes out along the diagonal, the back one trails and lifts
  const leg = (x: number, ahead: number, near: boolean) => {
    const lift = ahead < 0 ? 1 : 0;
    g.rect(x, 13, 3, 3 - lift, blue[near ? 3 : 2]);
    g.rect(x - 1 + (ahead > 0 ? 2 : ahead < 0 ? -1 : 0), 16 - lift, 4, 2, near ? white[3] : white[2]);
  };
  leg(7, -fwd, false);
  leg(10, fwd, true);
  // the arms: the far one hangs back, the near one swings forward with the near leg
  const farY = 9 - (fwd > 0 ? 0 : 0);
  g.rect(5, farY + (fwd > 0 ? 1 : 0), 1, 4, orange[1]).set(5, farY + 4 + (fwd > 0 ? 1 : 0), skin[1]);
  const nearUp = fwd < 0 ? 1 : 0;
  g.rect(14, 9 - nearUp, 1, 4, orange[3]).set(14 + (fwd > 0 ? 1 : 0), 13 - nearUp, skin[2]);
  // the hoodie: its far side darker, its near side lit, a hem
  g.rect(6, 8, 8, 5, orange[3]).rect(6, 8, 2, 5, orange[2]).rect(12, 8, 2, 5, orange[4]).rect(6, 12, 8, 1, orange[1]);
  if (front) {
    g.rect(10, 8, 1, 2, white[2]).rect(12, 8, 1, 2, white[2]); // the drawstrings, toward the way he faces
    g.rect(9, 11, 3, 1, orange[2]); // the pocket
  } else {
    g.rect(7, 8, 6, 1, orange[4]).rect(7, 9, 6, 1, orange[3]); // the back of the hood
  }
  // the head: 3 rows under the beanie's cuff
  if (front) {
    g.rect(7, 5, 6, 3, skin[3]).rect(7, 5, 2, 3, hair[1]); // hair behind, the face turned toward the right
    g.set(10, 6, ink).set(12, 6, ink).set(11, 7, ink);
  } else {
    g.rect(7, 5, 6, 3, hair[1]).rect(7, 5, 6, 1, hair[2]); // the back of his head
    g.rect(12, 6, 1, 2, skin[2]); // a little of the cheek on the side he is turned to
  }
  // the beanie: a dome, a cuff, and a pom-pom toward the facing side
  g.rect(8, 2, 5, 1, teal[3]).rect(7, 3, 7, 1, teal[3]).rect(8, 2, 3, 1, teal[4]);
  g.rect(6, 4, 8, 1, teal[2]);
  for (let x = 7; x < 14; x += 2) g.set(x, 4, teal[1]);
  g.rect(11, 1, 3, 2, white[3]).set(11, 1, white[2]).set(13, 2, white[2]);
  const p = new Pixels(20, 20, T);
  p.blit(g, 0, 1, T);
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
