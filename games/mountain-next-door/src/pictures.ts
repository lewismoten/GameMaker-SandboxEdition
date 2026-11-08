// THE MOUNTAIN MOVED NEXT DOOR's full-screen pictures: the big friendly mountain drawn whole (its face, its snow,
// the garden gates caught on it, its little cloud), the street of little houses beside it, the title, and the
// story pages that open a level (a note on paper over the scene, Tess below it).
import { centered, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { W } from '../../kit/starter/screens';
import { vista as scene } from './art/vista';
import { gate, type GateColor } from './art/land';
import { wisp } from './art/folk';
import { carved, printFrame, tornStrip } from './art/print';

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
  // cut in the woodcut: a lit side, a middle and a hatched shadow side, carved contours that bow down at the
  // flanks, a heavy inked outline, and a flat cap of snow with an inked hem
  const halfAt = (y: number) => {
    const f = (y - top) / k.height;
    return Math.round(k.half * Math.sqrt(f) * (0.9 + 0.1 * f));
  };
  for (let y = top; y < k.ground; y++) {
    const f = (y - top) / k.height;
    const half = halfAt(y);
    for (let x = k.cx - half; x <= k.cx + half; x++) {
      const side = (x - k.cx) / Math.max(half, 1);
      let c = side < -0.3 ? r[3] : side > 0.4 ? r[1] : r[2];
      if (side > 0.4 && (x + y) % 3 === 0) c = r[0];
      const contour = (y - top - Math.round(side * side * 7)) % 9;
      if (contour === 0 && f > 0.2) c = r[0];
      else if (contour === 8 && f > 0.2 && side < 0.2 && (x * 3 + y) % 7 < 5) c = r[5];
      p.set(x, y, c);
    }
    for (const t of [0, 1]) p.set(k.cx - half - t, y, ink).set(k.cx + half + t, y, ink);
    if (f < 0.24) {
      for (let x = k.cx - half + 1; x < k.cx + half; x++) {
        const hem = k.height * 0.17 + Math.sin(x * 0.35) * 3;
        if (y - top < hem) p.set(x, y, x > k.cx + half * 0.4 && (x + y) % 4 === 0 ? pal.c('blue', 4) : w[3]);
        else if (y - top < hem + 1.5) p.set(x, y, ink);
      }
    }
  }
  p.rect(k.cx - 1, top - 1, 3, 1, ink);
  // moss tufts low down
  for (let i = 0; i < 14; i++) {
    const x = k.cx - k.half + 12 + ((i * 37) % (k.half * 2 - 24));
    const y = k.ground - 6 - ((i * 13) % 26);
    p.rect(x, y, 6, 2, m[2]).rect(x + 1, y - 1, 4, 1, m[3]);
  }
  // the face: big, round, friendly eyes (whites, a dark pupil looking at Tess, a glint), heavy mossy brows, blush, a smile
  const ey = top + Math.round(k.height * 0.5);
  const er = Math.max(7, Math.round(k.half * 0.1));
  const gap = Math.round(k.half * 0.24);
  for (const dx of [-gap, gap]) {
    const ex = k.cx + dx;
    if (k.eyes === 'open') {
      p.disc(ex, ey, er + 2, ink).disc(ex, ey, er, w[3]);
      p.disc(ex - Math.round(er * 0.3), ey + Math.round(er * 0.2), Math.round(er * 0.55), ink);
      p.rect(ex - Math.round(er * 0.5), ey - Math.round(er * 0.2), 2, 2, w[3]);
    } else for (let x = -er; x <= er; x++) for (const t of [0, 1, 2]) p.set(ex + x, ey + t + Math.round((x / er) ** 2 * -3) + 3, ink);
    // a mossy brow over each eye
    for (let x = -er - 2; x <= er + 2; x++) {
      const by = ey - er - 5 + Math.round((x / (er + 2)) ** 2 * 3) + (dx < 0 ? Math.round(x / 6) : -Math.round(x / 6));
      p.rect(ex + x, by, 1, 3, m[2])
        .set(ex + x, by - 1, ink)
        .set(ex + x, by + 3, ink);
    }
    // a soft blush: solid in the middle, dithered out to the edge
    const bx = ex + (dx < 0 ? -er : er);
    for (let y = -4; y <= 4; y++)
      for (let x = -5; x <= 5; x++) {
        const d = Math.hypot(x, y);
        if (d <= 2.3 || (d <= 4.6 && (x + y) % 2 === 0)) p.set(bx + x, ey + er + 6 + y, pal.c('pink', 1));
      }
  }
  const sm = Math.round(gap * 0.6);
  for (let x = -sm; x <= sm; x++) for (const t of [0, 1]) p.set(k.cx + x, ey + er + 8 + t + Math.round((1 - (x / sm) ** 2) * 6), ink);
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

/** The title, printed as a poster: the name cut by hand, a torn ribbon, Old Mossback filling the lot next door, Tess beside her house. */
export function titlePicture(pal: Pal, book: Book, tess: Pixels, name: [string, number][], tagline: string): Pixels {
  const { c } = pal;
  const p = scene(pal, book, 170, 21);
  bigMountain(p, pal, { cx: 214, ground: 170, half: 118, height: 128, eyes: 'open', gates: true, cloud: false });
  street(p, pal, 170, 2, 100);
  let y = 12;
  name.forEach(([line, size], i) => {
    y += carved(p, pal, W / 2, y, line, size, c('parch', 4), c('brick', 2), 5 + i) + 2;
  });
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  tornStrip(p, pal, rx, y + 1, rx + ribbon, y + 14, 4);
  text(p, rx + 10, y + 5, tagline, c('ink', 0));
  scaleBlit(p, tess, 76, 170 - 80, 2);
  printFrame(p, pal);
  return p;
}

/** A level's card, printed: its number on a torn strip, its name cut by hand, the hint on paper below, Tess ready. */
export function levelCard(pal: Pal, book: Book, tess: Pixels, n: number, of: number, title: string, hint: string): Pixels {
  const { c } = pal;
  const p = scene(pal, book, 160, 20 + n);
  const head = `LEVEL ${n} OF ${of}`;
  const hw = textWidth(head) + 16;
  tornStrip(p, pal, (W - hw) / 2, 14, (W + hw) / 2, 26, n);
  centered(p, 17, head, c('wood', 0));
  const name = title.toUpperCase();
  const size = textWidth(name, 3) <= 280 ? 3 : textWidth(name, 2) <= 290 ? 2 : 1;
  const h = carved(p, pal, W / 2, 36, name, size, c('parch', 4), c('brick', 2), n);
  // a hint too long for one line breaks at the space nearest its middle
  let lines = [hint];
  if (textWidth(hint) > 270) {
    const mid = hint.length / 2;
    const at = [...hint].reduce((best, ch, i) => (ch === ' ' && Math.abs(i - mid) < Math.abs(best - mid) ? i : best), 0);
    lines = [hint.slice(0, at), hint.slice(at + 1)];
  }
  const ww = Math.max(...lines.map((l) => textWidth(l))) + 16;
  tornStrip(p, pal, (W - ww) / 2, 40 + h, (W + ww) / 2, 45 + h + lines.length * 12, n + 40);
  lines.forEach((l, i) => centered(p, 44 + h + i * 12, l, c('ink', 0)));
  scaleBlit(p, tess, 44, 160 - 80, 2);
  printFrame(p, pal);
  return p;
}

/** A story page: a note of up to four lines on paper over the scene, Tess under it, the mountain behind (if `peak`). */
export function storyCard(pal: Pal, book: Book, tess: Pixels, lines: string[], seed: number, peak?: Partial<Peak>): Pixels {
  const { c } = pal;
  const p = scene(pal, book, 160, seed);
  if (peak) bigMountain(p, pal, { cx: 220, ground: 160, half: 90, height: 96, eyes: 'open', gates: true, cloud: false, ...peak });
  const h = 16 + lines.length * 13;
  tornStrip(p, pal, 14, 12, 305, 10 + h, seed);
  lines.forEach((l, i) => centered(p, 20 + i * 13, l, c('ink', 0)));
  scaleBlit(p, tess, 48, 160 - 80, 2);
  printFrame(p, pal);
  return p;
}
