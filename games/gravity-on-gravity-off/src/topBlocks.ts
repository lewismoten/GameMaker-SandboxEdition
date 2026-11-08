// Level 2's block set (top.bbl): the same scene as level 1, seen from above. Every block here has Gravity
// "none" (Book's default), where level 1's sky has Gravity "down". That one setting is the whole difference
// between the side-scroller and the walk-around room; the pictures are only drawn from above to match.
//
//   lawn (the sky's place), hedge (the room's edge), wall (the side view's brick wall, capped from above),
//   path, deck (the plank ledge), shrub (the side view's bush, now solid), flower, coin, the entrance and exit pads
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

/** The block set, with `side`'s hedge and coin pictures borrowed. */
export function addTopBlocks(book: Book, pal: Pal, side: Book): Pixels {
  const { c, r } = pal;
  const lawn = lawnTile(pal);
  const ink = c('ink', 0);
  book.add('lawn', lawn);
  book.add('hedge', side.pics.get('edge')!, { solid: SOLID });
  {
    // the path: packed earth with pebbles
    const d = r('dirt');
    const p = new Pixels(20, 20, d[3]);
    const rand = rng(12);
    for (let i = 0; i < 14; i++) p.set(Math.floor(rand() * 20), Math.floor(rand() * 20), d[i % 2 ? 2 : 4]);
    for (let i = 0; i < 5; i++) {
      const x = 2 + Math.floor(rand() * 15);
      const y = 2 + Math.floor(rand() * 15);
      p.rect(x, y, 3, 2, c('stone', 3)).rect(x, y, 3, 1, c('stone', 4));
    }
    book.add('path', p);
  }
  {
    // the wall from above: the capstones along its top, one block wide
    const s = r('stone');
    const p = new Pixels(20, 20, s[2]);
    p.rect(0, 0, 20, 1, s[4]).rect(0, 19, 20, 1, s[0]).rect(0, 0, 1, 20, s[3]).rect(19, 0, 1, 20, s[1]);
    for (const y of [6, 13]) p.rect(1, y, 18, 1, s[1]);
    for (const [x, y] of [
      [9, 1],
      [4, 7],
      [14, 7],
      [9, 14],
    ] as const)
      p.rect(x, y, 1, 5, s[1]);
    p.rect(2, 2, 6, 1, s[3]).rect(11, 2, 7, 1, s[3]).rect(2, 8, 1, 1, s[3]).rect(6, 15, 8, 1, s[3]);
    book.add('wall', p, { solid: SOLID });
  }
  {
    // the deck: boards laid across
    const w = r('wood');
    const p = new Pixels(20, 20, w[2]);
    for (const y of [0, 5, 10, 15])
      p.rect(0, y, 20, 1, w[4])
        .rect(0, y + 4, 20, 1, w[0])
        .rect(0, y + 1, 20, 3, w[y % 10 ? 3 : 2]);
    p.set(2, 2, w[0]).set(17, 2, w[0]).set(2, 12, w[0]).set(17, 12, w[0]);
    book.add('deck', p);
  }
  {
    // the shrub: a round bush from above, solid, so there is something to walk around
    const g = r('grass');
    const p = lawn.crop(0, 0, 20, 20);
    p.disc(10.5, 10.5, 8.5, ink).disc(10, 10, 8, g[1]).disc(10, 9.5, 7, g[2]).disc(9, 8, 5.2, g[3]);
    for (const [x, y] of [
      [6, 6],
      [11, 5],
      [13, 11],
      [8, 12],
      [10, 9],
    ] as const)
      p.rect(x, y, 2, 1, g[5]).set(x, y + 1, g[4]);
    book.add('shrub', p, { solid: SOLID });
  }
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
  book.add('coin', onLawn(side.pics.get('coin')!, pal, lawn), { score: 10, touch: 'lawn' });
  {
    // the entrance: a green welcome mat, 2 blocks tall (a stand-in for the doorway)
    const q = new Pixels(20, 40);
    q.px.set(lawn.px);
    q.px.set(lawn.px, 400);
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
    q.px.set(lawn.px);
    q.px.set(lawn.px, 400);
    bevel(q, 2, 2, 16, 36, r('stone'), 2, 2);
    const gold = r('gold');
    for (let y = 6; y < 34; y++) q.rect(5, y, 10, 1, gold[y < 14 ? 5 : y < 26 ? 4 : 3]);
    q.frame(5, 6, 10, 28, ink);
    book.add('exitTop', q.crop(0, 0, 20, 20));
    book.add('exitBottom', q.crop(0, 20, 20, 20));
  }
  return lawn;
}
