// THE THANK-YOU PARADE's own title picture: a sunny town street under bunting, the name in gold, Penny the drum major
// (plumed hat, baton raised) leading the band: the tuba, the drum and the flute, and a waving flag at the end.
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { W, scene } from '../../kit/starter/screens';

/** A baton: a thin white rod with a gold ball at each end, from (x0, y0) to (x1, y1). */
export function baton(p: Pixels, pal: Pal, x0: number, y0: number, x1: number, y1: number): void {
  p.line(x0, y0, x1, y1, pal.c('ink', 0)).line(x0 + 1, y0, x1 + 1, y1, pal.c('white', 3));
  p.disc(x1, y1, 2.6, pal.c('ink', 0)).disc(x1, y1, 1.6, pal.c('gold', 5));
  p.disc(x0, y0, 2.2, pal.c('ink', 0)).disc(x0, y0, 1.2, pal.c('gold', 4));
}

/** Bunting from (x0, y) to (x1, y), drooping between its ends, flags in red, white and blue. */
export function bunt(p: Pixels, pal: Pal, x0: number, x1: number, y: number, sag = 8): void {
  const ink = pal.c('ink', 0);
  const cols = [pal.c('red', 3), pal.c('white', 3), pal.c('blue', 2)];
  let k = 0;
  let lastX = x0;
  let lastY = y;
  for (let x = x0; x <= x1; x++) {
    const t = (x - x0) / (x1 - x0);
    const yy = Math.round(y + Math.sin(t * Math.PI) * sag);
    p.line(lastX, lastY, x, yy, ink);
    lastX = x;
    lastY = yy;
    if ((x - x0) % 14 === 7) {
      const c = cols[k++ % 3];
      for (let i = 0; i < 7; i++) p.rect(x - 3 + Math.floor(i / 2), yy + 1 + i, 7 - i, 1, c);
      p.rect(x - 3, yy + 1, 7, 1, pal.c('ink', 1));
    }
  }
}

/** The street: sky, hills, shop fronts with awnings, the road, and bunting across the top. */
export function streetBackdrop(pal: Pal, book: Book): Pixels {
  const { c } = pal;
  const p = scene(pal, book, 164, 11);
  // shop fronts across the back
  const rand = rng(4);
  let x = -6;
  while (x < W) {
    const w = 36 + Math.floor(rand() * 22);
    const h = 36 + Math.floor(rand() * 20);
    const tone = rand() < 0.5 ? 'parch' : 'teal';
    p.rect(x, 164 - h, w, h, c(tone, 2)).rect(x, 164 - h, w, 3, c('brick', 3)).rect(x, 164 - h, 1, h, c(tone, 3));
    for (let wx = x + 6; wx + 10 < x + w; wx += 16) p.rect(wx, 164 - h + 12, 10, 12, c('ink', 0)).rect(wx + 1, 164 - h + 13, 8, 10, c('sky', 2));
    p.rect(x + 3, 164 - h + 26, w - 6, 5, c('red', 3)).rect(x + 3, 164 - h + 26, w - 6, 1, c('red', 4));
    x += w + 3;
  }
  p.rect(0, 164, W, 36, c('stone', 2)).rect(0, 164, W, 3, c('stone', 4)).rect(0, 178, W, 1, c('stone', 1));
  for (let rx = 10; rx < W; rx += 40) p.rect(rx, 190, 22, 3, c('gold', 3));
  bunt(p, pal, -4, 330, 6, 9);
  return p;
}

/** The title: the name, a ribbon, Penny with her baton and the band behind her, the flag at the end. */
export function titlePicture(pal: Pal, book: Book, penny: Pixels, name1: string, name2: string, tagline: string): Pixels {
  const { c } = pal;
  const p = streetBackdrop(pal, book);
  // the name
  const size1 = textWidth(name1, 3) <= 300 ? 3 : 2;
  outlined(p, Math.round((W - textWidth(name1, size1)) / 2), 22, name1, c('gold', 5), c('ink', 0), size1, c('ink', 1));
  outlined(p, Math.round((W - textWidth(name2, 4)) / 2), 46, name2, c('red', 3), c('ink', 0), 4, c('ink', 1));
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 80, ribbon, 14, pal.r('blue'), 3, 2);
  text(p, rx + 10, 84, tagline, c('white', 3));
  // the band, left to right: the flute, the drum, the tuba (small, behind), then Penny big in front
  const kids: [string, number][] = [['kid.flute.happy', 150], ['kid.drum.happy', 188], ['kid.tuba.happy', 226]];
  for (const [n, kx] of kids) scaleBlit(p, book.pics.get(n)!, kx, 120, 2, false, c('sky', 3));
  const flagL = book.pics.get('flagA0')!;
  const flagR = book.pics.get('flagA1')!;
  p.rect(285, 104, 3, 62, c('stone', 3)).rect(285, 104, 1, 62, c('white', 3)).disc(286, 102, 2.6, c('gold', 4));
  scaleBlit(p, flagL, 288, 104, 2, false, c('sky', 3));
  scaleBlit(p, flagR, 328 - 40, 104, 1, false, c('sky', 3));
  p.rect(60, 163, 52, 3, c('ink', 1));
  scaleBlit(p, penny, 62, 164 - 120, 3, false, 255);
  baton(p, pal, 62 + 47, 164 - 120 + 76, 62 + 74, 164 - 120 + 24);
  return p;
}
