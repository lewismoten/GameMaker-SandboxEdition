// The block set both levels use (top.bbl), seen from above: lawn, a hedge you can't walk through, the road
// (packed earth), three "seam" roads that mark the edge of the map (its top row and its left column), a
// flower, the coin, the entrance mat and the finish doors. No block pulls (Gravity "none", Book's default).
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { Book, SOLID } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';

/** One lawn block: grass with a few lighter and darker blades, the same in every cell. */
function lawnTile(pal: Pal): Pixels {
  const g = pal.r('grass');
  const p = new Pixels(20, 20, g[2]);
  const rand = rng(77);
  for (let i = 0; i < 16; i++) {
    const x = Math.floor(rand() * 19);
    const y = Math.floor(rand() * 18);
    p.set(x, y + 1, g[1]).set(x, y, i % 3 ? g[3] : g[4]);
  }
  return p;
}

/** `pic` with its sky colored pixels showing the lawn instead. */
const onLawn = (pic: Pixels, pal: Pal, lawn: Pixels): Pixels =>
  pic.crop(0, 0, pic.w, pic.h).map((x, y, c) => (c === skyOf(pal) ? lawn.get(x % 20, y % 20) : c));

/** A sign for the top-down book: the side view's wooden board and posts, standing on the lawn. */
export function addTopSign(book: Book, pal: Pal, lawn: Pixels, name: string, text: string, w: number, h: number): Sign {
  const scratch = new Book('bbl');
  const sign = addSign(scratch, pal, name, text, w, h);
  for (const [n, pic] of scratch.pics) if (!book.has(n)) book.add(n, onLawn(pic, pal, lawn));
  return sign;
}

/** The road tile, drawn once: the signs stand on it too. */
function roadTile(pal: Pal): Pixels {
  const { c, r } = pal;
  const d = r('dirt');
  const p = new Pixels(20, 20, d[3]);
  const rand = rng(12);
  for (let i = 0; i < 14; i++) p.set(Math.floor(rand() * 20), Math.floor(rand() * 20), d[i % 2 ? 2 : 4]);
  for (let i = 0; i < 5; i++) {
    const x = 2 + Math.floor(rand() * 15);
    const y = 2 + Math.floor(rand() * 15);
    p.rect(x, y, 3, 2, c('stone', 3)).rect(x, y, 3, 1, c('stone', 4));
  }
  return p;
}

/** The road with a dashed white line along its top edge and/or its left edge: the edge of the map. */
function seamTile(pal: Pal, road: Pixels, top: boolean, left: boolean): Pixels {
  const p = road.crop(0, 0, 20, 20);
  const white = pal.c('white', 4);
  const shade = pal.c('ink', 0);
  for (let i = 0; i < 20; i++) {
    if (i % 6 > 3) continue;
    if (top) p.set(i, 0, white).set(i, 1, white).set(i, 2, shade);
    if (left) p.set(0, i, white).set(1, i, white).set(2, i, shade);
  }
  return p;
}

/** The block set, with `side`'s hedge and coin pictures borrowed. Returns the road tile (the signs stand on it). */
export function addTopBlocks(book: Book, pal: Pal, side: Book): Pixels {
  const { c, r } = pal;
  const lawn = lawnTile(pal);
  const ink = c('ink', 0);
  book.add('lawn', lawn);
  book.add('hedge', side.pics.get('edge')!, { solid: SOLID });
  const road = roadTile(pal);
  book.add('path', road);
  book.add('seamTop', seamTile(pal, road, true, false));
  book.add('seamLeft', seamTile(pal, road, false, true));
  book.add('seamCorner', seamTile(pal, road, true, true));
  {
    const p = lawn.crop(0, 0, 20, 20);
    for (const [x, y, col] of [
      [6, 6, c('pink', 2)],
      [13, 8, c('gold', 4)],
      [8, 13, c('white', 3)],
      [14, 14, c('pink', 2)],
    ] as const) {
      p.disc(x, y, 2.4, col).set(x, y, c('gold', 5));
      p.rect(x, y + 3, 1, 2, r('green')[2]);
    }
    book.add('flower', p);
  }
  book.add('coin', onLawn(side.pics.get('coin')!, pal, road), { score: 10, touch: 'path' });
  {
    // the entrance: a green welcome mat, 2 blocks tall (a stand-in for the doorway)
    const q = new Pixels(20, 40);
    q.px.set(road.px);
    q.px.set(road.px, 400);
    const w = r('white');
    bevel(q, 3, 3, 14, 34, r('green'), 2, 2);
    q.frame(3, 3, 14, 34, w[3]);
    q.rect(6, 8, 8, 1, w[3]).rect(6, 31, 8, 1, w[3]);
    book.add('startTop', q.crop(0, 0, 20, 20));
    book.add('startBottom', q.crop(0, 20, 20, 20));
  }
  {
    // the exit: a stone step with a gold glow in a door-shaped frame
    const q = new Pixels(20, 40);
    q.px.set(road.px);
    q.px.set(road.px, 400);
    bevel(q, 2, 2, 16, 36, r('stone'), 2, 2);
    const gold = r('gold');
    for (let y = 6; y < 34; y++) q.rect(5, y, 10, 1, gold[y < 14 ? 5 : y < 26 ? 4 : 3]);
    q.frame(5, 6, 10, 28, ink);
    book.add('exitTop', q.crop(0, 0, 20, 20));
    book.add('exitBottom', q.crop(0, 20, 20, 20));
  }
  return road;
}
