// Stick Man is a pencil drawing, so getting hurt makes his lines shaky, and losing a life rubs him out:
// three more pictures in his .CBL (top and bottom each) show his lines going gray, breaking up, and leaving
// only a light eraser smudge. hero.ts plays them in his Die sequence, in the same time the kit's took.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';

const T = 255;
/** The poses the Die sequence steps through after the hurt one: [top block, bottom block]. */
export const ERASE = [
  ['erase1.top', 'erase1'],
  ['erase2.top', 'erase2'],
  ['smudge.top', 'smudge'],
] as const;

const hash = (x: number, y: number) => (Math.imul(x * 73 + y * 151 + 11, 2654435761) >>> 0) % 97;

/** The pose as one 20 by 40 picture. */
function whole(book: Book, top: string, bottom: string): Pixels {
  return new Pixels(20, 40, T).blit(book.pics.get(top)!, 0, 0, T).blit(book.pics.get(bottom)!, 0, 20, T);
}

function put(book: Book, top: string, bottom: string, p: Pixels): void {
  const [t, b] = [p.crop(0, 0, 20, 20), p.crop(0, 20, 20, 20)];
  if (book.has(top)) book.redraw(top, t);
  else book.add(top, t);
  if (book.has(bottom)) book.redraw(bottom, b);
  else book.add(bottom, b);
}

/** A light gray smudge, wider than tall, rubbed side to side low down where he stood. */
function smudge(p: Pixels, pal: Pal, cy: number, rx: number, ry: number): void {
  for (let y = 0; y < 40; y++)
    for (let x = 0; x < 20; x++) {
      const d = ((x - 10) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d > 1) continue;
      const h = hash(x, y);
      if (d > 0.6 && h % 3 === 0) continue;
      // the eraser rubs side to side: streaks of paper show between the strokes
      if (y % 3 === 0 && h % 2) continue;
      p.set(x, y, h % 4 === 0 ? pal.c('stone', 3) : pal.c('stone', 4));
    }
}

/** Redraws the hurt pose with shaky lines, then adds the three erase poses. */
export function addPaperPoses(book: Book, pal: Pal): void {
  const hurt = whole(book, 'hurt.top', 'hurt');
  // shaky: each row of the pencil line slips a pixel left or right
  const shaky = new Pixels(20, 40, T);
  const slip = [0, 1, 1, 0, -1, -1, 0, 1, 0, -1];
  for (let y = 0; y < 40; y++)
    for (let x = 0; x < 20; x++) shaky.set(x, y, hurt.get(x - slip[y % slip.length], y) === -1 ? T : hurt.get(x - slip[y % slip.length], y));
  put(book, 'hurt.top', 'hurt', shaky);
  const ink = new Set(pal.r('ink'));
  const halo = pal.c('white', 3);
  // half rubbed out: the lines go gray, the halo thins
  const e1 = new Pixels(20, 40, T).blit(shaky, 0, 0, T);
  e1.map((x, y, k) => (ink.has(k) ? (hash(x, y) % 3 ? pal.c('stone', 1) : pal.c('stone', 2)) : k === halo && hash(x, y) % 3 === 0 ? T : k));
  put(book, ...ERASE[0], e1);
  // nearly gone: pale broken lines in a smudge
  const e2 = new Pixels(20, 40, T);
  smudge(e2, pal, 31, 9, 6);
  shaky.px.forEach((k, i) => {
    const x = i % 20;
    const y = Math.floor(i / 20);
    if (ink.has(k) && hash(x, y) % 2) e2.set(x, y, pal.c('stone', 2));
  });
  put(book, ...ERASE[1], e2);
  // only the smudge and a few crumbs
  const e3 = new Pixels(20, 40, T);
  smudge(e3, pal, 30, 9, 7);
  for (const [x, y] of [
    [3, 37],
    [16, 38],
    [6, 39],
    [14, 36],
  ] as const)
    e3.set(x, y, pal.c('stone', 2));
  put(book, ...ERASE[2], e3);
}
