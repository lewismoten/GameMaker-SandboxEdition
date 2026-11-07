// THE MOUNTAIN MOVED NEXT DOOR's full-screen pictures: the big friendly mountain drawn whole (its face, its snow,
// the garden gates caught on it, its little cloud), the street of little houses beside it, the title, and the
// story pages that open a level (a note on paper over the scene, Tess below it).
import { centered, outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { W, scene } from '../../kit/starter/screens';
import { gate, type GateColor } from './art/land';
import { wisp } from './art/folk';

export interface Peak {
  /** The peak's middle and the ground under it. */
  cx: number;
  ground: number;
  /** Half the width at the ground, and the height. */
  half: number;
  height: number;
  eyes: 'open' | 'shut';
  gates: boolean;
  /** Draw the little cloud on top (it is missing for most of the story). */
  cloud: boolean;
}

/** The mountain, drawn whole: rock with moss and early snow, a face, gates caught on it, maybe its cloud. */
export function bigMountain(p: Pixels, pal: Pal, k: Peak): void {
  const r = pal.r('rock');
  const m = pal.r('moss');
  const w = pal.r('white');
  const ink = pal.c('ink', 0);
  const top = k.ground - k.height;
  for (let y = top; y < k.ground; y++) {
    const f = (y - top) / k.height;
    const half = Math.round(k.half * Math.sqrt(f) * (0.9 + 0.1 * f));
    for (let x = k.cx - half; x <= k.cx + half; x++) {
      const shade = x < k.cx - half * 0.3 ? 4 : x > k.cx + half * 0.4 ? 2 : 3;
      p.set(x, y, (x * 3 + y * 5) % 23 === 0 ? r[1] : r[shade]);
    }
    p.set(k.cx - half, y, ink).set(k.cx + half, y, ink);
    if (f < 0.22) for (let x = k.cx - half + 1; x < k.cx + half; x++) if (y - top < k.height * 0.16 + Math.sin(x * 0.4) * 3) p.set(x, y, w[x < k.cx ? 3 : 2]);
  }
  // moss tufts low down
  for (let i = 0; i < 14; i++) {
    const x = k.cx - k.half + 12 + ((i * 37) % (k.half * 2 - 24));
    const y = k.ground - 6 - ((i * 13) % 26);
    p.rect(x, y, 6, 2, m[2]).rect(x + 1, y - 1, 4, 1, m[3]);
  }
  // the face
  const ey = top + Math.round(k.height * 0.5);
  for (const dx of [-22, 22]) {
    if (k.eyes === 'open')
      p.disc(k.cx + dx, ey, 7, r[5])
        .disc(k.cx + dx, ey + 1, 5, ink)
        .set(k.cx + dx - 2, ey - 2, r[5])
        .set(k.cx + dx - 1, ey - 3, r[5]);
    else
      for (let x = -7; x <= 7; x++) p.set(k.cx + dx + x, ey + Math.round((x / 7) ** 2 * 3), ink).set(k.cx + dx + x, ey + 1 + Math.round((x / 7) ** 2 * 3), ink);
    // a soft blush: solid in the middle, dithered out to the edge
    const bx = k.cx + dx + (dx < 0 ? -4 : 4);
    for (let y = -4; y <= 4; y++)
      for (let x = -4; x <= 4; x++) {
        const d = Math.hypot(x, y);
        if (d <= 2.3 || (d <= 4.3 && (x + y) % 2 === 0)) p.set(bx + x, ey + 12 + y, pal.c('pink', 1));
      }
  }
  for (let x = -12; x <= 12; x++)
    p.set(k.cx + x, ey + 16 + Math.round((1 - (x / 12) ** 2) * 5), ink).set(k.cx + x, ey + 17 + Math.round((1 - (x / 12) ** 2) * 5), ink);
  if (k.gates) {
    const spots: [number, number, GateColor][] = [
      [-40, 0.62, 'white'],
      [30, 0.75, 'blue'],
      [-8, 0.32, 'green'],
      [50, 0.88, 'red'],
    ];
    for (const [dx, f, c] of spots) p.blit(gate(pal, c, 0.6), k.cx + dx - 10, top + Math.round(k.height * f) - 10, 255);
  }
  if (k.cloud) scaleBlit(p, wisp(pal, 0, 'happy'), k.cx - 20, top - 34, 2);
}

/** Little houses in a row on `ground`, from x0 to x1. */
export function street(p: Pixels, pal: Pal, ground: number, x0: number, x1: number): void {
  const { c } = pal;
  const looks: [string, number][] = [
    ['parch', 3],
    ['teal', 2],
    ['brick', 3],
    ['blue', 3],
  ];
  for (let x = x0, i = 0; x + 40 <= x1; x += 52, i++) {
    const [ramp, shade] = looks[i % looks.length];
    const h = 30 + (i % 2) * 6;
    p.rect(x, ground - h, 44, h, c(ramp, shade)).frame(x, ground - h, 44, h, c('ink', 0));
    for (let k = 0; k < 22; k++) p.rect(x - 2 + k, ground - h - k, 48 - k * 2, 1, c('brick', k % 4 ? 2 : 1));
    p.rect(x + 6, ground - h + 8, 9, 9, c('gold', 4)).frame(x + 6, ground - h + 8, 9, 9, c('ink', 0));
    p.rect(x + 27, ground - 16, 9, 16, c('wood', 2)).frame(x + 27, ground - 16, 9, 16, c('ink', 0));
    for (let f = x - 4; f < x + 48; f += 5) p.rect(f, ground - 7, 2, 7, c('white', 3));
  }
}

/** The title: the name, a ribbon, the mountain sitting in the lot next door, Tess beside her house. */
export function titlePicture(pal: Pal, book: Book, tess: Pixels, name: [string, number][], tagline: string): Pixels {
  const { c } = pal;
  const p = scene(pal, book, 170, 21);
  bigMountain(p, pal, { cx: 222, ground: 170, half: 96, height: 104, eyes: 'open', gates: true, cloud: false });
  street(p, pal, 170, 2, 120);
  let y = 6;
  for (const [line, size] of name) {
    outlined(p, Math.round((W - textWidth(line, size)) / 2), y, line, c('gold', 4), c('ink', 0), size, c('ink', 1));
    y += size * 8 + 4;
  }
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, y + 2, ribbon, 14, pal.r('parch'), 3, 2);
  text(p, rx + 10, y + 6, tagline, c('ink', 0));
  scaleBlit(p, tess, 96, 170 - 80, 2);
  return p;
}

/** A story page: a note of up to four lines on paper over the scene, Tess under it, the mountain behind (if `peak`). */
export function storyCard(pal: Pal, book: Book, tess: Pixels, lines: string[], seed: number, peak?: Partial<Peak>): Pixels {
  const { c } = pal;
  const p = scene(pal, book, 160, seed);
  if (peak) bigMountain(p, pal, { cx: 220, ground: 160, half: 90, height: 96, eyes: 'open', gates: true, cloud: false, ...peak });
  const h = 16 + lines.length * 13;
  bevel(p, 14, 10, 292, h, pal.r('parch'), 3, 2);
  p.rect(18, 14, 284, h - 8, c('parch', 3));
  lines.forEach((l, i) => centered(p, 20 + i * 13, l, c('ink', 0)));
  scaleBlit(p, tess, 48, 160 - 80, 2);
  return p;
}
