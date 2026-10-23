// The Bard of Bizarre's logo sting, for every Bard of Bizarre game's title slide show
// (`bard.fli 0` first in its title .LST): red stage curtains part on the logo (the rooster
// in spectacles, drawn with DeepAI, dithered into the reel's palette), stars twinkle round
// it, Doc Leo's photo pops in at stage left, a lute at stage right strums notes into the air,
// the tagline types itself out on the boards, and it all fades to black. About four seconds,
// drawn in code as an Autodesk Animator FLI that carries its own palette.
import { loadScan, medianCut, resample, ditherTo, type Scan } from './photo';
import { PaletteBuilder } from './palette';
import { Pixels } from './pixels';
import { Reel } from './reel';
import { outlined, textWidth } from '../snowbound/src/art/font';

/** The sting's file name on every disk. */
export const BARDLOGO = 'bard.fli';

const W = 320;
const H = 200;
/** 1/70 s per frame: 14 frames a second. */
const SPEED = 5;
/** Where the stage boards start. */
const FLOOR = 170;
/** The drapes left at each side when the curtains are open. */
const DRAPE = 18;

export interface BardIntroOptions {
  /** Typed out on the stage boards (default "presents"). */
  tagline?: string;
}

/** A photo given `count` palette entries of its own from `slots`, and dithered to them. */
function photoColors(s: Scan, pal: Uint8Array, slots: number[]): void {
  medianCut(s, slots.length).forEach((c, i) => pal.set(c, slots[i] * 3));
}

/**
 * The logo's own backdrop: the pixels joined to its border that stay near the corner's color
 * (a flood fill), so the stage shows through round the crest.
 */
function backdrop(s: Scan, tolerance = 40): Uint8Array {
  const out = new Uint8Array(s.w * s.h);
  const at = (i: number) => [s.rgb[i * 3], s.rgb[i * 3 + 1], s.rgb[i * 3 + 2]];
  const [r0, g0, b0] = at(0);
  const near = (i: number) => {
    const [r, g, b] = at(i);
    return Math.abs(r - r0) + Math.abs(g - g0) + Math.abs(b - b0) <= tolerance;
  };
  const todo: number[] = [];
  for (let x = 0; x < s.w; x++) todo.push(x, (s.h - 1) * s.w + x);
  for (let y = 0; y < s.h; y++) todo.push(y * s.w, y * s.w + s.w - 1);
  while (todo.length) {
    const i = todo.pop()!;
    if (out[i] || !near(i)) continue;
    out[i] = 1;
    const x = i % s.w;
    if (x > 0) todo.push(i - 1);
    if (x < s.w - 1) todo.push(i + 1);
    if (i >= s.w) todo.push(i - s.w);
    if (i < s.w * (s.h - 1)) todo.push(i + s.w);
  }
  return out;
}

export function bardIntroFli(o: BardIntroOptions = {}): Uint8Array {
  const tagline = o.tagline ?? 'presents';
  const b = new PaletteBuilder();
  b.designerColors();
  const stage = b.ramp('stage', 5, [30, 10, 44], [96, 52, 130]);
  const curtain = b.ramp('curtain', 6, [52, 4, 12], [226, 70, 70], [150, 20, 34]);
  const gold = b.ramp('gold', 4, [120, 72, 8], [255, 238, 120]);
  const ink = b.ramp('ink', 2, [14, 8, 18], [40, 28, 46]);
  const cloth = b.ramp('cloth', 3, [170, 160, 140], [255, 252, 240]);
  const wood = b.ramp('wood', 5, [44, 24, 12], [196, 140, 80]);
  const star = b.ramp('star', 3, [200, 190, 120], [255, 255, 255]);
  const pal = b.pal;

  // the logo, and Doc Leo, each with colors of their own
  const logo = resample(loadScan('bardlogo'), 160, 0, [0.04, 0.02, 0.96, 0.98]);
  const LX = 80;
  const LY = 26;
  const free = Array.from({ length: 255 - b.used }, (_, i) => b.used + i);
  const logoSlots = free.slice(0, 120);
  const leoSlots = free.slice(120, 180);
  photoColors(logo, pal, logoSlots);
  const logoPx = ditherTo(logo, pal, [...logoSlots, stage[0], stage[1], ink[0]]);
  const leoScan = loadScan('docleo');
  const leoCrop: [number, number, number, number] = [0.06, 0.04, 0.94, 0.96];
  photoColors(resample(leoScan, 44, 0, leoCrop), pal, leoSlots);
  const leoCache = new Map<number, { s: Scan; px: Uint8Array }>();
  const leoAt = (scale: number) => {
    const w = Math.max(6, Math.round(44 * scale));
    let got = leoCache.get(w);
    if (!got) {
      const s = resample(leoScan, w, 0, leoCrop);
      leoCache.set(w, (got = { s, px: ditherTo(s, pal, leoSlots) }));
    }
    return got;
  };

  // ---- the stage: a back wall with a spotlight pool, and the boards
  const back = new Pixels(W, H, stage[0]);
  for (let y = 0; y < FLOOR; y++)
    for (let x = 0; x < W; x++) {
      const d = Math.hypot((x - 160) / 150, (y - 96) / 110);
      const lv = d < 0.5 ? 2 : d < 0.75 ? 1 : 0;
      if (lv) back.set(x, y, stage[lv]);
    }
  for (let y = FLOOR; y < H; y++) for (let x = 0; x < W; x++) back.set(x, y, wood[y === FLOOR ? 3 : (y - FLOOR) % 8 === 0 ? 0 : 1 + ((x + (y > 185 ? 37 : 0)) % 61 === 0 ? 0 : 1)]);
  const behind = backdrop(logo);
  for (let y = 0; y < logo.h; y++) for (let x = 0; x < logo.w; x++) if (!behind[y * logo.w + x]) back.set(LX + x, LY + y, logoPx[y * logo.w + x]);

  // ---- the curtains: folds fixed to the screen, so parting them only redraws their edges
  // (wide folds in four shades: long runs keep the frames small)
  const fold = (x: number) => {
    const v = (Math.cos((x / 40) * Math.PI * 2) + 1) / 2;
    return curtain[1 + Math.min(3, Math.floor(v * 4))];
  };
  /** Curtains closed to `left` (left one's edge) and `right` (right one's edge). */
  const curtains = (p: Pixels, left: number, right: number) => {
    for (let y = 16; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (x >= left && x < right) continue;
        const edge = x === left - 1 || x === right;
        p.set(x, y, edge ? curtain[0] : y >= H - 6 ? (x % 4 < 2 ? gold[2] : gold[1]) : fold(x));
      }
    // the valance and its fringe, always in front
    for (let y = 0; y < 16; y++) for (let x = 0; x < W; x++) p.set(x, y, y > 12 ? ((x >> 1) % 2 ? gold[3] : gold[1]) : fold(x + 8));
    for (let x = 0; x < W; x += 40) for (let k = 0; k < 4; k++) p.set(x + 20, 16 + k, gold[3 - (k >> 1)]);
  };

  // ---- the lute at stage right, its strings at `wiggle`
  const lute = (p: Pixels, wiggle: number) => {
    const cx = 276;
    const cy = 132;
    for (let y = -22; y <= 22; y++)
      for (let x = -17; x <= 17; x++) {
        const r = Math.hypot(x / 17, (y + (y < 0 ? y * 0.15 : 0)) / 22);
        if (r <= 1) p.set(cx + x, cy + y, r > 0.9 ? wood[0] : wood[Math.min(4, 2 + Math.round((-x - y) / 14))]);
      }
    p.disc(cx, cy - 6, 4, ink[0]).ring(cx, cy - 6, 5, gold[1]);
    // the neck up and to the right, and the pegbox bent back
    for (let k = 0; k < 60; k++) {
      const x = cx + 3 + k * 0.32;
      const y = cy - 20 - k;
      p.rect(Math.round(x) - 2, Math.round(y), 5, 1, k > 54 ? wood[1] : wood[3]);
    }
    p.rect(cx + 20, cy - 86, 8, 4, wood[1]).rect(cx + 22, cy - 88, 4, 2, wood[0]);
    for (let k = 0; k < 3; k++) p.set(cx + 19, cy - 84 + k * 2, gold[3]).set(cx + 29, cy - 84 + k * 2, gold[3]);
    p.rect(cx - 6, cy + 10, 12, 2, wood[0]);
    // four strings from the bridge to the nut, shaking in the middle when strummed
    for (let s = 0; s < 4; s++)
      for (let k = 0; k <= 90; k++) {
        const t = k / 90;
        const x = cx - 3 + s * 2 + (cx + 21 - (cx - 3)) * t * 0.9;
        const y = cy + 10 - t * 89;
        const shake = wiggle && t > 0.15 && t < 0.75 ? Math.round(Math.sin(t * Math.PI * 3 + s) * wiggle) : 0;
        p.set(Math.round(x + shake), Math.round(y), cloth[s % 2]);
      }
  };

  /** An eighth note (♪) with its head at (x, y). */
  const note = (p: Pixels, x: number, y: number, double: boolean) => {
    for (const [dx, dy] of [
      [0, 0],
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [1, -1],
      [2, -1],
    ])
      p.set(x + dx, y + dy, gold[3]);
    p.rect(x + 3, y - 7, 1, 8, gold[3]).rect(x + 4, y - 7, 2, 1, gold[2]).rect(x + 5, y - 6, 1, 2, gold[2]);
    if (double) p.rect(x + 3 + 5, y - 7, 1, 7, gold[3]).rect(x + 4, y - 7, 5, 1, gold[3]).rect(x + 5, y, 3, 2, gold[3]);
  };

  /** A four-point twinkle of size 0..3. */
  const twinkle = (p: Pixels, x: number, y: number, size: number) => {
    if (size <= 0) return;
    p.set(x, y, star[2]);
    for (let k = 1; k <= size; k++) {
      const c = star[Math.max(0, 2 - k)];
      p.set(x + k, y, c).set(x - k, y, c).set(x, y + k, c).set(x, y - k, c);
    }
    if (size >= 2) p.set(x + 1, y + 1, star[0]).set(x - 1, y - 1, star[0]).set(x + 1, y - 1, star[0]).set(x - 1, y + 1, star[0]);
  };
  const SPARKS: [number, number][] = [
    [86, 34],
    [236, 40],
    [72, 120],
    [248, 112],
    [120, 22],
    [200, 160],
    [104, 156],
    [222, 18],
  ];

  /** Doc Leo's instant print, its middle at (cx, cy), at `scale`. */
  const leo = (p: Pixels, scale: number) => {
    if (scale <= 0) return;
    const { s, px } = leoAt(scale);
    const x = Math.round(48 - s.w / 2);
    const y = Math.round(92 - s.h / 2);
    const m = Math.max(1, Math.round(4 * scale));
    const bottom = Math.max(2, Math.round(12 * scale));
    p.rect(x - m + 2, y - m + 2, s.w + m * 2, s.h + m + bottom, ink[0]);
    p.rect(x - m, y - m, s.w + m * 2, s.h + m + bottom, cloth[2]).frame(x - m, y - m, s.w + m * 2, s.h + m + bottom, cloth[0]);
    for (let yy = 0; yy < s.h; yy++) for (let xx = 0; xx < s.w; xx++) p.set(x + xx, y + yy, px[yy * s.w + xx]);
  };

  const r = new Reel(pal);
  const scene = (p: Pixels, f: number, o: { leo?: number; strum?: number; typed?: number; notes?: number }) => {
    lute(p, o.strum ?? 0);
    leo(p, o.leo ?? 0);
    for (let k = 0; k < SPARKS.length; k++) {
      const [x, y] = SPARKS[k];
      twinkle(p, x, y, [0, 1, 2, 3, 2, 1, 0, 0][(f + k * 3) % 8]);
    }
    // notes float up from the lute and drift
    for (let n = 0; n < (o.notes ?? 0); n++) {
      const age = n * 3;
      const t = f - 20 - age;
      if (t < 0 || t > 24) continue;
      note(p, 262 + Math.round(Math.sin((t + n) / 3) * 5) - (n % 2) * 14, 112 - t * 4, n % 3 === 1);
    }
    const typed = tagline.slice(0, o.typed ?? 0);
    if (typed) outlined(p, 160 - textWidth(tagline) / 2, 182, typed, cloth[2], ink[0]);
  };
  let f = 0;
  const closed = new Pixels(W, H);
  closed.px.set(back.px);
  curtains(closed, 160, 160);
  r.fadeIn(closed, 4);
  r.add(closed, 3);
  // the curtains part, slowly, then quickly, then slowly
  const edges = [158, 154, 146, 134, 118, 100, 82, 64, 48, 36, 27, 21, DRAPE];
  for (const e of edges) r.frame(back, (p) => (scene(p, f++, {}), curtains(p, e, W - e)));
  const open = (p: Pixels, o: Parameters<typeof scene>[2]) => (scene(p, f++, o), curtains(p, DRAPE, W - DRAPE));
  // Doc Leo pops in
  for (const s of [0.2, 0.5, 0.85, 1.14, 0.95, 1]) r.frame(back, (p) => open(p, { leo: s }));
  // the strum, and the tagline typing itself out
  for (let k = 0; k <= tagline.length + 4; k++) r.frame(back, (p) => open(p, { leo: 1, strum: k < 6 ? 2 - (k % 2) * 3 : k < 10 ? (k % 2 ? 1 : -1) : 0, typed: k, notes: 6 }));
  for (let k = 0; k < 14; k++) r.frame(back, (p) => open(p, { leo: 1, typed: tagline.length, notes: 6 }));
  r.fadeOut(6);
  return r.fli(SPEED);
}
