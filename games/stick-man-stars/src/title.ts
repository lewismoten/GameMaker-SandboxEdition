// STICK MAN STARS' title picture: night on Stargazing Hill. A deep sky full of stars and a full moon over the
// hill, Stick Man by his telescope looking up, and down the slope a few dark Repo Row houses, one of them lit.
// Drawn in the shared palette's indexes and saved with the night level's palette (a GIF carries its own).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel, gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { H, W } from '../../kit/starter/screens';

const GROUND = 160;

/** A small seeded hash (no Math.random: the same sky every build). */
function hash(a: number, b: number): number {
  let h = (Math.imul(a + 7, 374761393) + Math.imul(b + 3, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/** The night sky: the sky ramp from deep at the top to a pale glow at the hills, dots of stars and a full moon. */
function nightSky(p: Pixels, pal: Pal): void {
  const sky = pal.r('sky');
  gradient(p, 0, 0, W, GROUND, sky, 0, sky.length - 1, true);
  const dim = pal.c('white', 1);
  const bright = pal.c('white', 3);
  // single-pixel stars, with a few two-pixel ones (never a plus shape), thinning toward the horizon
  for (let i = 0; i < 150; i++) {
    const x = hash(i, 1) % W;
    const y = hash(i, 2) % 120;
    if (hash(i, 4) % 120 < y) continue;
    const c = hash(i, 3) % 5 === 0 ? bright : dim;
    p.set(x, y, c);
    if (hash(i, 5) % 9 === 0) p.set(x + 1, y, c);
  }
  // the full moon, with a few craters, low on the right, under the name
  const [mx, my] = [290, 90];
  p.disc(mx, my, 13, pal.c('white', 3));
  for (const [dx, dy, r] of [
    [-5, -3, 3],
    [5, 4, 3.6],
    [2, -7, 2],
    [-6, 6, 1.8],
  ] as const)
    p.disc(mx + dx, my + dy, r, pal.c('white', 2));
}

/** The near hill's top at `x`: flat where Stick Man stands, then down the slope to the street. */
const hillTop = (x: number) => GROUND - 6 - Math.round(Math.max(0, Math.min(1, 1.4 * Math.cos(Math.min(x / 80, Math.PI / 2)))) * 26);

/** Two rolling hills in the (moonlit) grass colors, the near one carrying Stick Man on the left. */
function hills(p: Pixels, pal: Pal, book: Book): void {
  const { c } = pal;
  for (let x = 0; x < W; x++) {
    const far = GROUND - 22 - Math.round(Math.sin(x / 40 + 1) * 10 + Math.sin(x / 13) * 2);
    const near = hillTop(x);
    p.rect(x, far, 1, GROUND - far, c('grass', 0));
    p.set(x, far, c('grass', 1));
    p.rect(x, near, 1, GROUND - near, c('grass', 2));
    p.set(x, near, c('grass', 4));
  }
  for (let y = GROUND; y < H; y += 20) for (let x = 0; x < W; x += 20) p.blit(book.pics.get(y === GROUND ? 'grass' : 'dirt')!, x, y, 255);
}

/** The title: the name, a ribbon, the night sky, Stick Man looking up beside his telescope, and Repo Row below. */
export function titlePicture(pal: Pal, book: Book, mb: Book, hero: Pixels, name: string, tagline: string): Pixels {
  const p = new Pixels(W, H);
  nightSky(p, pal);
  hills(p, pal, book);
  const s = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, s)) / 2), 14, name, pal.c('gold', 4), pal.c('ink', 0), s, pal.c('ink', 1));
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r('parch'), 3, 2);
  text(p, rx + 10, 54, tagline, pal.c('ink', 0));
  // Stick Man on the hilltop, looking up, and his telescope beside him (its sky made clear)
  const src = book.pics.get('telescope')!;
  const scope = new Pixels(src.w, src.h);
  scope.px.set(src.px);
  scope.map((_x, _y, k) => (k === skyOf(pal) ? 255 : k));
  scaleBlit(p, hero, 24, hillTop(0) - 80 + 2, 2);
  scaleBlit(p, scope, 80, hillTop(100) - 40 + 2, 2);
  // Repo Row down the slope: dark houses, and one with its window lit
  const row: [string, number][] = [
    ['shed0', 160],
    ['cottage0', 198],
    ['tower0', 236],
    ['litcottage0', 274],
  ];
  for (const [pic, x] of row) scaleBlit(p, mb.pics.get(pic)!, x, GROUND - 40, 2);
  return p;
}
