// The small blocks both levels share: the pier's planks, the entrance mat and exit doors (drawn on whatever ground they
// stand on), the signs (their board is a picture, set on the ground they stand on), and a ring of blocks that turn into
// each other over time. Water and shore tiles are in water.ts and shoreTiles.ts.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { Book, SOLID } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { skyOf } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';

/** A block that turns into another after some ticks (the engine's only clock). */
export interface Timed {
  name: string;
  next: string;
  ticks: number;
}

/**
 * Adds a ring of `pics`: block `${base}.0` shows the first picture, then turns into `${base}.1`, and so on round to
 * `${base}.0` again. Each stays on screen `ticks[i]` ticks. The ring's blocks are also its starting points. Returns the names.
 */
export function addRing(book: Book, timed: Timed[], base: string, pics: Pixels[], ticks: readonly number[], rules = {}): string[] {
  const names = pics.map((_p, i) => `${base}.${i}`);
  pics.forEach((p, i) => {
    book.add(names[i], p, rules);
    timed.push({ name: names[i], next: names[(i + 1) % pics.length], ticks: ticks[i] });
  });
  return names;
}

/** Wooden planks, laid along the way Nova walks. */
export function plankTile(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('wood', 2));
  for (let row = 0; row < 4; row++) {
    const y = row * 5;
    p.rect(0, y, 20, 1, c('wood', 4)).rect(0, y + 4, 20, 1, c('wood', 0));
    p.set(2, y + 2, c('wood', 0)).set(17, y + 2, c('wood', 0));
    if (row % 2) p.rect(10, y + 1, 1, 3, c('wood', 1));
  }
  return p;
}

/** The entrance mat (2 blocks tall) on `ground`. */
export function addEntrance(book: Book, pal: Pal, ground: Pixels): void {
  const q = new Pixels(20, 40);
  q.px.set(ground.px);
  q.px.set(ground.px, 400);
  bevel(q, 3, 3, 14, 34, pal.r('green'), 2, 2);
  q.frame(3, 3, 14, 34, pal.c('white', 3));
  q.rect(6, 8, 8, 1, pal.c('white', 3)).rect(6, 31, 8, 1, pal.c('white', 3));
  book.add('startTop', q.crop(0, 0, 20, 20));
  book.add('startBottom', q.crop(0, 20, 20, 20));
}

/** The exit door (2 blocks tall): a stone frame with a gold glow, on `ground`. */
export function addExit(book: Book, pal: Pal, ground: Pixels): void {
  const q = new Pixels(20, 40);
  q.px.set(ground.px);
  q.px.set(ground.px, 400);
  bevel(q, 2, 2, 16, 36, pal.r('stone'), 2, 2);
  const gold = pal.r('gold');
  for (let y = 6; y < 34; y++) q.rect(5, y, 10, 1, gold[y < 14 ? 5 : y < 26 ? 4 : 3]);
  q.frame(5, 6, 10, 28, pal.c('ink', 0));
  book.add('exitTop', q.crop(0, 0, 20, 20));
  book.add('exitBottom', q.crop(0, 20, 20, 20));
}

/** A sign standing on `ground`: its board is solid (Nova walks round it), its posts are not. */
export function addSignOn(book: Book, pal: Pal, ground: Pixels, name: string, text: string, w: number, h: number): Sign {
  const scratch = new Book('bbl');
  const sign = addSign(scratch, pal, name, text, w, h);
  const sky = skyOf(pal);
  const board = new Set(sign.board.flat());
  for (const [n, pic] of scratch.pics) {
    if (book.has(n)) continue;
    book.add(
      n,
      pic.crop(0, 0, 20, 20).map((x, y, col) => (col === sky ? ground.get(x, y) : col)),
      board.has(n) ? { solid: SOLID } : {},
    );
  }
  return sign;
}

/** A level's finished blocks: the book's, with each timed block given its next block and its ticks. */
export function finishBlocks(l: { book: Book; timed: Timed[] }): Block[] {
  const blocks = l.book.finish();
  for (const t of l.timed) {
    const b = blocks[l.book.n(t.name)];
    b.nextBl = l.book.n(t.next);
    b.ntime = t.ticks;
  }
  return blocks;
}
