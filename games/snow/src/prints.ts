// Level 3's prints: boot soles that face the way the hero walked and fade away, all in the files DOS Game-Maker
// already has. A map cell can only change to one picture (and every cell of a block changes together), so the
// prints are monsters: a walking frame of the hero's character file "gives birth" to one at the hero's feet
// (a frame whose bottom block is MONBL), each monster has its own clock, its picture list steps through four
// fainter pictures, and its lifetime (Monster.end) takes it away, leaving smooth snow.
//
//   8 monsters: facing (down, up, right, left) x foot (a, b); 4 monster blocks each, fresh to faint.
import { CHARBL, MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, emptyFrame, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { newMonsterSet, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon, set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import { KEY, SEQ } from '../../kit/starter/ids';
import type { Pal } from '../../kit/starter/palette';
import { buildTopHero, type Facing } from '../../kit/starter/topHero';

export const FACINGS: Facing[] = ['down', 'up', 'right', 'left'];
/** Ticks (1/18.2 s) each of the four pictures shows: about 6 seconds from fresh to gone. */
export const STAGE_TICKS = [30, 28, 28, 28];
export const PRINT_LIFE = STAGE_TICKS.reduce((a, b) => a + b, 0);
const T = 255;

/** The monster number of a print: two a facing (the left foot, then the right). */
export const printMonster = (face: Facing, foot: 0 | 1): number => FACINGS.indexOf(face) * 2 + foot;

/** One sole, toe forward, `stage` 0 (fresh and dark) to 3 (barely there). */
function sole(pal: Pal, face: Facing, foot: 0 | 1, stage: number): Pixels {
  const dirt = pal.r('dirt');
  const grass = pal.r('grass');
  const body = [dirt[1], dirt[3], dirt[5], grass[3]][stage];
  const tread = [dirt[3], dirt[4], grass[2], grass[3]][stage];
  const p = new Pixels(20, 20, T);
  // (u, v): u is along the way he walked (the toe is positive), v across (left of the walker is negative)
  const at = (u: number, v: number): [number, number] => {
    const side = foot ? 3 : -3;
    const w = v + side;
    // the walker's own left is on the screen's right when he walks down, so v flips for down and left
    if (face === 'up') return [10 + w, 13 - u];
    if (face === 'down') return [10 - w, 13 + u];
    if (face === 'right') return [10 + u, 13 + w];
    return [10 - u, 13 - w];
  };
  const dot = (u: number, v: number, c: number) => p.set(...at(u, v), c);
  // forefoot: a rounded toe, wide across the ball
  for (let u = 0; u <= 3; u++) {
    const half = u === 3 ? 1 : 2;
    for (let v = -half; v <= half; v++) dot(u, v, body);
  }
  // heel, narrower, with a gap before it
  for (let u = -4; u <= -2; u++) for (let v = -1; v <= 1; v++) dot(u, v, body);
  // two tread marks on the ball
  dot(1, -1, tread);
  dot(1, 1, tread);
  return p;
}

/** The prints' pictures (.MBL): `<facing>.<foot>.<stage>`. */
export function buildPrintBlocks(pal: Pal): Book {
  const book = new Book('mbl');
  for (const face of FACINGS) for (const foot of [0, 1] as const) for (let s = 0; s < 4; s++) book.add(`${face}.${foot}.${s}`, sole(pal, face, foot, s));
  return book;
}

/** What each print does (.MON): shows its four pictures once each, stays put and is gone after PRINT_LIFE ticks. */
export function buildPrints(mb: Book): Monster[] {
  const set = newMonsterSet();
  for (const face of FACINGS)
    for (const foot of [0, 1] as const)
      set[printMonster(face, foot)] = mon(
        STAGE_TICKS.map((t, s) => [mb.n(`${face}.${foot}.${s}`), t] as [number, number]),
        { power: 150, thru: 0, end: PRINT_LIFE },
      );
  return set;
}

/** The top-down hero (the kit's), whose every walking cycle gives birth to a print under each foot. */
export function buildPrintHero(cb: Book): Character {
  const ch = buildTopHero(cb);
  const S = ch.sequences;
  const f = (pic: string, dx: number, dy: number): Frame => ({ ...emptyFrame(), x: dx, y: dy, pic1: CHARBL, pic2: cb.n(pic), pause: 1, orient: 0 });
  // a birth frame: bottom block MONBL, top block the monster; its y (one block) puts the print on his own cell
  const birth = (face: Facing, foot: 0 | 1): Frame => ({ ...emptyFrame(), x: 0, y: 20, pic1: printMonster(face, foot), pic2: MONBL, pause: 0, orient: 0 });
  const walk = (face: Facing, dx: number, dy: number) => [
    f(`${face}.0`, dx, dy),
    birth(face, 0),
    f(`${face}.stand`, dx, dy),
    f(`${face}.1`, dx, dy),
    birth(face, 1),
    f(`${face}.stand`, dx, dy),
  ];
  const STEP = 4;
  const run: [Facing, number, number, number, number][] = [
    ['right', STEP, 0, SEQ.right, KEY.right],
    ['left', -STEP, 0, SEQ.left, KEY.left],
    ['up', 0, -STEP, SEQ.up, KEY.up],
    ['down', 0, STEP, SEQ.down, KEY.down],
  ];
  const twin = { right: [SEQ.rightD, KEY.d], left: [SEQ.leftA, KEY.a], up: [SEQ.upW, KEY.w], down: [SEQ.downS, KEY.s] } as const;
  const jstk = { right: 3, left: 7, up: 1, down: 5 } as const;
  for (const [face, dx, dy, seq, key] of run) {
    set(S[seq], walk(face, dx, dy), { key, jstkMov: jstk[face] });
    set(S[twin[face][0]], walk(face, dx, dy), { key: twin[face][1] });
  }
  ch.meter[20] = INF_REPEAT; // no keys or locked doors
  return ch;
}
