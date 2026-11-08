// LIGHTNING's title picture: the Starters' title (kit/starter/screens.ts) with a storm cloud over the hills and a bolt
// from it down to the hilltop, drawn in the same colors as the level's bolt.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { titlePicture } from '../../kit/starter/screens';

/** The bolt's corners, top to bottom, in title pixels. */
const BOLT: [number, number][] = [
  [112, 96],
  [116, 104],
  [109, 112],
  [114, 119],
  [107, 126],
  [111, 133],
];

export function stormTitle(pal: Pal, book: Book, hero: Pixels, door: Pixels, name: string, tagline: string): Pixels {
  const { c } = pal;
  const p = titlePicture(pal, book, hero, door, name, tagline);
  for (let i = 1; i < BOLT.length; i++) {
    const [[x0, y0], [x1, y1]] = [BOLT[i - 1], BOLT[i]];
    for (const dx of [-2, -1, 1, 2]) p.line(x0 + dx, y0, x1 + dx, y1, c('flash', 1));
  }
  for (let i = 1; i < BOLT.length; i++) {
    const [[x0, y0], [x1, y1]] = [BOLT[i - 1], BOLT[i]];
    p.line(x0, y0, x1, y1, c('flash', 3)).line(x0 + 1, y0, x1 + 1, y1, c('flash', 2));
  }
  const puffs: [number, number, number][] = [
    [98, 92, 7],
    [110, 86, 10],
    [124, 90, 8],
    [134, 94, 5],
  ];
  for (const [x, y, r] of puffs) p.disc(x, y, r + 1, c('sky', 5));
  for (const [x, y, r] of puffs) p.disc(x, y + 1, r, c('sky', 4));
  return p;
}
