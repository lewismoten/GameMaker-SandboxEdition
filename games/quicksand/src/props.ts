// QUICKSAND's pictures: sand in four stages (smooth, a dimple, a wider dimple with grains sliding in, a
// swirl), the hole it becomes, the firm sand bed under it, and a flat stepping stone. Dry sand is gold;
// wet sand is darker and has a shine. A stage reads by its shape as well as its color: each one has a
// bigger ring in the middle of the top, so it reads in gray too.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** The game's own ramps: dry sand, wet sand (added after the shared ones, so no shared color moves). */
export function sandRamps(b: PaletteBuilder): void {
  b.ramp('sand', 6, [150, 104, 52], [255, 236, 170], [230, 186, 110]);
  b.ramp('wet', 5, [84, 58, 40], [214, 172, 120], [158, 116, 76]);
}

export type Kind = 'sand' | 'wet';
/** How many pictures a block of sand goes through before it gives way. */
export const STAGES = 4;

/** Scattered grains, the same in every stage so only the ring changes. */
const GRAINS: [number, number, number][] = [
  [3, 6, 1],
  [15, 5, 4],
  [8, 9, 1],
  [12, 13, 4],
  [4, 15, 1],
  [17, 11, 1],
  [9, 17, 4],
  [1, 11, 4],
  [14, 17, 1],
];

/** The plain body of a sand block: a light top edge, grains, a darker foot. */
function body(pal: Pal, kind: Kind): Pixels {
  const r = pal.r(kind);
  const top = kind === 'sand' ? 3 : 2;
  const p = new Pixels(20, 20, r[top]);
  p.rect(0, 0, 20, 1, r[top + 2] ?? r[r.length - 1]).rect(0, 1, 20, 1, r[top + 1]);
  p.rect(0, 18, 20, 2, r[top - 1]);
  for (const [x, y, s] of GRAINS) p.set(x, y, s === 1 ? r[top - 1] : r[Math.min(r.length - 1, top + 1)]);
  if (kind === 'wet')
    // the shine of wet sand: two short light streaks
    p.line(3, 4, 6, 4, r[4]).line(13, 8, 15, 8, r[4]);
  return p;
}

/** A filled ellipse. */
function oval(p: Pixels, cx: number, cy: number, rx: number, ry: number, c: number): void {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) p.set(cx + x, cy + y, c);
}

/** An ellipse's outline, the lower half (the top half is above the block). */
function ellipse(p: Pixels, cx: number, cy: number, rx: number, ry: number, c: number): void {
  for (let a = 0; a <= 180; a += 3) {
    const t = (a * Math.PI) / 180;
    p.set(Math.round(cx + Math.cos(t) * rx), Math.round(cy + Math.sin(t) * ry), c);
  }
}

/**
 * Sand at a stage, 0 (smooth) to STAGES - 1 (about to give way). From stage 1 a funnel opens in the top
 * middle, under the hero's feet, and grows: wider and deeper each stage, and at the last stage grains run
 * in from both sides in a swirl.
 */
export function sandAt(pal: Pal, kind: Kind, stage: number): Pixels {
  const r = pal.r(kind);
  const top = kind === 'sand' ? 3 : 2;
  const p = body(pal, kind);
  if (stage <= 0) return p;
  // ripples opening at the top: light and dark rings round the middle, more of them each stage, and at the
  // last stage grains running in on a swirl (rings, not a dark spot, so it reads as sand moving)
  const rings = [0, 1, 2, 3][stage];
  oval(p, 10, 0, 3 + rings * 2, 2 + rings * 3, r[top - 1]);
  for (let i = rings; i >= 1; i--) {
    ellipse(p, 10, 0, 1 + i * 2, i * 3, r[Math.max(0, top - 2)]);
    ellipse(p, 10, 0, 2 + i * 2, 1 + i * 3, r[top + 1]);
  }
  if (stage >= 2)
    // grains sliding in toward the middle
    p.line(0, 3, 2, 5, r[top + 1]).line(19, 3, 17, 5, r[top + 1]);
  if (stage >= 3) {
    // a swirl: two short curved strokes
    p.line(2, 7, 5, 10, r[top - 2])
      .line(5, 10, 8, 11, r[top - 2])
      .line(17, 7, 14, 10, r[top - 2])
      .line(14, 10, 12, 11, r[top - 2]);
  }
  return p;
}

/** The hole sand leaves when it gives way: you stand in it, on the firm bed. Sloped sand walls, a dark inside. */
export function hole(pal: Pal, kind: Kind): Pixels {
  const r = pal.r(kind);
  const top = kind === 'sand' ? 3 : 2;
  const p = new Pixels(20, 20, r[Math.max(0, top - 2)]);
  for (let y = 0; y < 20; y++) {
    const w = Math.max(1, 4 - Math.floor(y / 5));
    p.rect(0, y, w, 1, r[top]).rect(20 - w, y, w, 1, r[top]);
    p.set(w, y, r[top - 1]).set(19 - w, y, r[top - 1]);
  }
  p.rect(0, 0, 4, 1, r[top + 1]).rect(16, 0, 4, 1, r[top + 1]);
  p.rect(0, 17, 20, 3, r[top - 1]);
  return p;
}

/** The firm sand under the quicksand: packed in layers, never changes (solid). */
export function bed(pal: Pal): Pixels {
  const r = pal.r('sand');
  const p = new Pixels(20, 20, r[1]);
  for (const y of [4, 11, 17]) p.line(0, y, 19, y, r[0]);
  for (const [x, y] of [
    [4, 2],
    [13, 7],
    [7, 14],
    [16, 15],
  ] as const)
    p.set(x, y, r[2]);
  return p;
}

/** A flat stepping stone set in the sand: gray, rounded at the top corners, solid; it never sinks. */
export function stone(pal: Pal): Pixels {
  const s = pal.r('stone');
  const sand = pal.r('sand');
  const p = new Pixels(20, 20, sand[3]);
  p.rect(1, 0, 18, 16, s[2]).rect(0, 2, 20, 12, s[2]);
  p.rect(2, 0, 16, 1, s[4]).rect(1, 1, 18, 1, s[3]);
  p.rect(1, 14, 18, 2, s[1]).rect(0, 12, 20, 2, s[1]);
  p.set(5, 6, s[1]).set(6, 6, s[1]).set(13, 9, s[1]).set(14, 4, s[3]);
  p.rect(0, 16, 20, 4, sand[2]);
  return p;
}

/** A sky block with a little beach grass tuft on the bank (just scenery). */
export function tuft(pal: Pal): Pixels {
  const g = pal.r('grass');
  const p = new Pixels(20, 20, skyOf(pal));
  for (const [x, h] of [
    [6, 7],
    [9, 10],
    [12, 8],
    [14, 5],
  ] as const) {
    p.line(x, 19, x - 1, 19 - h, g[2]).line(x + 1, 19, x + 1, 20 - h, g[4]);
  }
  return p;
}
