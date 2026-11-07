// THE NOODLE OBSERVATORY's full-screen pictures: the title (Nell beside the telescope, the tin monkey, the giant
// pasta ring framing a suspicious round light in the window), the level cards and story pages (a note on paper over
// the place, Nell below it), and the ending (the bakery's lit round window over the set table).
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { centered, outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Pal } from '../../kit/starter/palette';
import { backdrop, bricks, floor, icon, type Place } from './art';
import { ringPicture } from './nell';

export const W = 320;
export const H = 200;

/** A place filling the screen: its backdrop tiled down to `ground`, its floor below. */
export function placePicture(pal: Pal, place: Place, ground = 160): Pixels {
  const p = new Pixels(W, H);
  for (let y = 0; y < ground; y += 20) for (let x = 0; x < W; x += 20) p.blit(backdrop(pal, place, (x / 20 + y / 10) % 4), x, y);
  const f = floor(pal, place === 'lens' ? 'mat' : place === 'loft' ? 'boards' : place === 'roof' ? 'slate' : 'counter');
  for (let y = ground; y < H; y += 20) for (let x = 0; x < W; x += 20) p.blit(f, x, y);
  return p;
}

/** A big window on the dusk (the sky ramp: the look colors it), its frame and sill. */
function bigWindow(p: Pixels, pal: Pal, x0: number, y0: number, w: number, h: number): void {
  const k = pal.r('cab');
  const s = pal.r('sky');
  p.rect(x0 - 6, y0 - 6, w + 12, h + 12, k[1]).rect(x0 - 6, y0 - 6, w + 12, 2, k[3]);
  for (let y = 0; y < h; y++) p.rect(x0, y0 + y, w, 1, s[Math.min(s.length - 1, Math.floor((y / h) * s.length))]);
  p.rect(x0 - 10, y0 + h + 6, w + 20, 5, k[2]).rect(x0 - 10, y0 + h + 6, w + 20, 1, k[4]);
}

/** The round light, the "moon": warm, with darker cheese spots (or, `sill`, the window it really is). */
export function moonDisc(p: Pixels, pal: Pal, cx: number, cy: number, r: number, sill = false): void {
  const w = pal.r('warm');
  p.disc(cx, cy, r, w[1]).disc(cx, cy, r * 0.9, w[2]).disc(cx - r * 0.15, cy - r * 0.15, r * 0.66, w[3]);
  if (!sill) for (const [dx, dy, rr] of [[0.35, -0.2, 0.14], [-0.3, 0.35, 0.12], [0.2, 0.45, 0.1]] as const) p.disc(cx + dx * r, cy + dy * r, rr * r, w[2]);
  else {
    p.ring(cx, cy, r + 1, pal.c('stone', 3)).ring(cx, cy, r + 2, pal.c('stone', 2));
    p.rect(cx - 1, cy - r, 3, r * 2, pal.c('cab', 1));
    p.rect(cx - r - 6, cy + r + 3, r * 2 + 12, 4, pal.c('stone', 4)).rect(cx - r - 6, cy + r + 7, r * 2 + 12, 2, pal.c('stone', 1));
  }
}

/** A telescope on its tripod, about 50 pixels tall, eyepiece at the left, pointing up to the right. */
function telescope(p: Pixels, pal: Pal, x: number, ground: number): void {
  const st = pal.r('steel');
  const b = pal.r('blue');
  p.line(x + 20, ground - 30, x + 6, ground, st[1]).line(x + 20, ground - 30, x + 34, ground, st[1]).line(x + 20, ground - 30, x + 21, ground, st[0]);
  for (let k = 0; k < 7; k++) p.line(x + 2, ground - 32 + k, x + 44, ground - 54 + k, k === 0 ? b[4] : k === 6 ? b[0] : b[2]);
  p.rect(x + 42, ground - 58, 6, 10, b[1]).rect(x + 43, ground - 57, 4, 8, pal.c('glass', 3));
  p.rect(x - 2, ground - 32, 6, 6, st[2]);
}

/** The title: the name, a ribbon, the kitchen at dusk with the ring and the moon in the window, Nell, the scope and the toy. */
export function titlePicture(pal: Pal, nell: Pixels, toy: Pixels, name: [string, number][], tagline: string): Pixels {
  const { c } = pal;
  const p = placePicture(pal, 'cupboard', 170);
  bigWindow(p, pal, 170, 62, 130, 90);
  moonDisc(p, pal, 252, 98, 15);
  const ring = new Pixels(20, 20, 255).blit(ringPicture(pal, 0), 0, 0);
  scaleBlit(p, ring, 222, 68, 3);
  let y = 6;
  for (const [line, size] of name) {
    outlined(p, Math.round((W - textWidth(line, size)) / 2), y, line, c('gold', 4), c('ink', 0), size, c('ink', 1));
    y += size * 8 + 4;
  }
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, y + 2, ribbon, 14, pal.r('parch'), 3, 2);
  text(p, rx + 10, y + 6, tagline, c('ink', 0));
  telescope(p, pal, 90, 170);
  scaleBlit(p, nell, 40, 170 - 80, 2);
  scaleBlit(p, toy, 140, 170 - 40, 2);
  return p;
}

/** A level card or story page: a note of up to four lines on paper over the place, Nell under it. */
export function notePicture(pal: Pal, place: Place, nell: Pixels, lines: string[], heading?: string): Pixels {
  const { c } = pal;
  const p = placePicture(pal, place, 160);
  if (place === 'roof') moonDisc(p, pal, 262, 120, 12);
  const h = 16 + lines.length * 13 + (heading ? 22 : 0);
  bevel(p, 14, 10, 292, h, pal.r('parch'), 3, 2);
  p.rect(18, 14, 284, h - 8, c('parch', 3));
  let y = 20;
  if (heading) {
    centered(p, y, heading, c('ink', 0), heading.length * 16 <= 272 ? 2 : 1);
    y += 22;
  }
  lines.forEach((l, i) => centered(p, y + i * 13, l, i === 0 && heading ? c('wood', 1) : c('ink', 0)));
  scaleBlit(p, nell, 48, 160 - 80, 2);
  return p;
}

/** The ending: night on the roof, the bakery's lit round window with its sill, the set table, Nell, the toy and the colander. */
export function endingPicture(pal: Pal, nell: Pixels, toy: Pixels, colander: Pixels, head: string, line: string): Pixels {
  const { c } = pal;
  const p = placePicture(pal, 'roof', 166);
  const br = bricks(pal, true);
  for (let y = 40; y < 166; y += 20) for (let x = 190; x < W; x += 20) p.blit(br, x, y);
  moonDisc(p, pal, 252, 92, 22, true);
  // the table: a cloth-less top, plates and a cup
  p.rect(110, 140, 76, 5, c('wood', 3)).rect(110, 140, 76, 1, c('wood', 4)).rect(114, 145, 4, 21, c('wood', 2)).rect(178, 145, 4, 21, c('wood', 2));
  for (const x of [124, 152]) icon(pal, p, 'plate', x, 134, 'thing');
  icon(pal, p, 'cup', 172, 133, 'thing');
  scaleBlit(p, nell, 60, 166 - 80, 2);
  scaleBlit(p, toy, 196, 166 - 20, 1);
  scaleBlit(p, colander, 220, 166 - 20, 1);
  outlined(p, Math.round((W - textWidth(head, 2)) / 2), 8, head, c('gold', 4), c('ink', 0), 2, c('ink', 1));
  bevel(p, 20, 30, 280, 22, pal.r('parch'), 3, 2);
  centered(p, 37, line, c('ink', 0));
  return p;
}
