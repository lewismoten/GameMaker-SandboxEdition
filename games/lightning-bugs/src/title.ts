// LIGHTNING BUGS' title picture: the meadow itself, drawn from the first level's blocks (the dusk's bands, the tree line, grass and
// turf), the name in pale glow over the deep sky, Mara standing in the grass and fireflies at every frame of their blink.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { fireflyFrame, type Frame } from './bugs';
import { GROUND, skyAt, treeAt } from './dusk';

/** The first level row the picture shows: ten rows of blocks fill its 200 pixels. */
const ROW0 = 2;

/** The meadow as a 16x10 picture of blocks: sky bands, trees, the grass row and the earth. */
export function meadowPicture(book: Book, col0 = 0): Pixels {
  const p = new Pixels(320, 200);
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 16; c++) {
      const row = ROW0 + r;
      const name = row < GROUND ? (treeAt((col0 + c) % 8, row) ?? skyAt(col0 + c, row)) : row === GROUND ? 'grass' : `turf${Math.min(2, row - GROUND - 1)}`;
      p.blit(book.pics.get(name)!, c * 20, r * 20);
    }
  return p;
}

/** Where each firefly is on the title, its frame and how big it is drawn. */
const BUGS: [number, number, Frame, number][] = [
  [196, 116, 'bright', 3],
  [254, 92, 'dim', 2],
  [276, 140, 'bright', 2],
  [128, 100, 'ember', 2],
  [150, 146, 'dark', 2],
  [228, 152, 'ember', 1],
  [100, 84, 'dim', 1],
  [300, 80, 'ember', 1],
];

/** `hero` is the standing hero (two blocks tall). */
export function titlePicture(pal: Pal, book: Book, hero: Pixels, name: string, tagline: string): Pixels {
  const p = meadowPicture(book, 3);
  const size = name.length > 13 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, size)) / 2), 12, name, pal.c('glow', 4), pal.c('far', 0), size, pal.c('ink', 0));
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r('parch'), 3, 2);
  text(p, rx + 10, 54, tagline, pal.c('ink', 0));
  const ground = (GROUND - ROW0) * 20;
  p.rect(42, ground - 2, 30, 2, pal.c('grass', 0)); // the hero's shadow on the grass
  scaleBlit(p, hero, 36, ground - 80, 2);
  for (const [x, y, f, s] of BUGS) scaleBlit(p, fireflyFrame(pal, f), x - 10 * s, y - 10 * s, s);
  return p;
}
