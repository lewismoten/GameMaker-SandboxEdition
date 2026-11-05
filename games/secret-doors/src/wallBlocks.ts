// LOOKS LIKE A WALL's own blocks, added to the Starter block set after the signs. Every wall here is
// drawn exactly like the Starter brick, so the picture says nothing about what a wall does:
//   wall      solid on every side, a real wall
//   fake      the same picture, solid on no side: Kit walks into it and through it
//   loose     the same picture again, solid; touch it and it becomes `cracked`
//   cracked   the brick with a crack across it, open (Kit passes); touch it and it becomes `chips`
//   chips     a little pile of brick bits on the floor of the square, open, nothing more to turn into
//   hintCoin  an ordinary coin: it is only here to show through a wall
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** The ordinary brick picture of a wall, as drawn by the Starter blocks. */
const brickOf = (book: Book): Pixels => {
  const p = book.pics.get('brick');
  if (!p) throw new Error('The Starter blocks have no brick');
  return p;
};

/** The brick with a crack running down across its middle: dark, with a lit edge on one side. */
function cracked(brick: Pixels, pal: Pal): Pixels {
  const p = new Pixels(20, 20, 0).map((x, y) => brick.get(x, y));
  const dark = pal.c('ink', 0);
  const pts: [number, number][] = [
    [11, 0],
    [9, 4],
    [12, 8],
    [8, 12],
    [10, 15],
    [7, 19],
  ];
  for (let i = 0; i + 1 < pts.length; i++) p.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], dark);
  // a second, shorter crack branching off to the right
  p.line(12, 8, 16, 10, dark).line(16, 10, 17, 13, dark);
  return p;
}

/** What is left of a wall: chunky brick chips lying about the floor of the square, the rest open. */
function chips(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const b = pal.r('brick');
  const chip = (x: number, y: number, w: number, h: number) =>
    p.rect(x, y, w, h, b[2]).rect(x, y, w, 1, b[4]).rect(x, y + h - 1, w, 1, b[1]);
  chip(2, 15, 7, 4);
  chip(10, 16, 8, 3);
  chip(5, 11, 5, 4);
  chip(12, 12, 5, 3);
  chip(1, 7, 3, 3);
  chip(15, 7, 3, 3);
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** Adds the wall blocks to `book` (after addStarterBlocks and the signs). */
export function addWallBlocks(book: Book, pal: Pal): void {
  const brick = brickOf(book);
  const air = { grav: PULL.down };
  book.add('chips', chips(pal), air);
  book.add('cracked', cracked(brick, pal), { ...air, touch: 'chips' });
  book.add('wall', brick, { solid: SOLID });
  book.add('fake', brick, air);
  book.add('loose', brick, { solid: SOLID, touch: 'cracked' });
}
