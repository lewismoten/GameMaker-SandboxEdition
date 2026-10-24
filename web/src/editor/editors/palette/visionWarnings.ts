// The color vision check's warnings for one level: colors that touch on the map, or a monster
// and the scenery it usually stands in, that look clearly different in normal vision but alike
// in grayscale or with a color-vision difference (colorVision.ts); and shade ramps with steps
// too close to see. Each warning may come with a one-click fix that only changes palette
// colors, and only when no new warning appears in any level drawn with the palette.
import { BLEN, type Block } from '../../../formats/blocks';
import { LASTMON, type Monster } from '../../../formats/monster';
import { MLEN, MWID, type GameMap } from '../../../formats/map';
import type { Palette } from '../../../formats/palette';
import { contrastRatio, luminance, topColors } from '../../check/sceneData';
import { pictures } from '../../check/checks/monsterChecks';
import { VIEWS, deltaE, labs, relightColor, simulate, type View } from './colorVision';
import { luma, rampOf, spread } from './ramps';

/** What a level needs for the check (the Level check's SceneData fits). */
export interface VisionScene {
  map: GameMap;
  bbl: Block[];
  mbl: Block[];
  mon: Monster[];
}

/** Clearly different side by side (CIE76 ΔE)... */
export const DISTINCT = 20;
/** ...but alike in a view: hard to tell apart. */
export const ALIKE = 5;
/** A fix moves colors at least this far apart in every view. */
const SAFE = 12;
/** Ramp steps closer than this (about one just-noticeable difference) are lost. */
export const STEP = 2.3;
/** Pixel edges two colors must share on the map to matter (not a stray pixel or two). */
const MIN_TOUCH = 16;

const key = (a: number, b: number) => (a < b ? a * 256 + b : b * 256 + a);

/** The palette-independent facts of a level: which colors touch, how often, and where. */
export interface Analysis {
  scene: VisionScene;
  /** Pixel edges shared by each pair of colors on the map (key a*256+b, a < b). */
  touches: Map<number, number>;
  /** Pixels of each color on the map and its monsters. */
  uses: Float64Array;
  /** Each placed monster: its main colors, the scenery color it usually stands in, a cell. */
  monsters: { n: number; colors: number[]; behind: number; cell: number }[];
}

/** The pairs of different colors that touch inside one block (left-right and up-down). */
function blockTouches(px: Uint8Array): Map<number, number> {
  const m = new Map<number, number>();
  const add = (a: number, b: number) => a !== b && m.set(key(a, b), (m.get(key(a, b)) ?? 0) + 1);
  for (let y = 0; y < BLEN; y++)
    for (let x = 0; x < BLEN; x++) {
      if (x + 1 < BLEN) add(px[y * BLEN + x], px[y * BLEN + x + 1]);
      if (y + 1 < BLEN) add(px[y * BLEN + x], px[(y + 1) * BLEN + x]);
    }
  return m;
}

const blank = new Uint8Array(BLEN * BLEN);
const pixelsOf = (s: VisionScene, cell: number) => s.bbl[s.map.blocks[cell]]?.pixels ?? blank;

/** Pair touches inside the cell's block and across its right and bottom edges. */
function cellTouches(s: VisionScene, cell: number, own: Map<number, number>[], each: (k: number, n: number) => void): void {
  for (const [k, n] of own[s.map.blocks[cell]] ?? []) each(k, n);
  const px = pixelsOf(s, cell);
  const x = cell % MLEN;
  const y = Math.floor(cell / MLEN);
  if (x + 1 < MLEN) {
    const r = pixelsOf(s, cell + 1);
    for (let i = 0; i < BLEN; i++) if (px[i * BLEN + BLEN - 1] !== r[i * BLEN]) each(key(px[i * BLEN + BLEN - 1], r[i * BLEN]), 1);
  }
  if (y + 1 < MWID) {
    const d = pixelsOf(s, cell + MLEN);
    for (let i = 0; i < BLEN; i++) if (px[(BLEN - 1) * BLEN + i] !== d[i]) each(key(px[(BLEN - 1) * BLEN + i], d[i]), 1);
  }
}

const ownTouches = (s: VisionScene) => s.bbl.map((b) => blockTouches(b.pixels));

export function analyze(s: VisionScene): Analysis {
  const own = ownTouches(s);
  const touches = new Map<number, number>();
  const uses = new Float64Array(256);
  for (let cell = 0; cell < MLEN * MWID; cell++) {
    cellTouches(s, cell, own, (k, n) => touches.set(k, (touches.get(k) ?? 0) + n));
    for (const p of pixelsOf(s, cell)) uses[p]++;
  }
  const placed = s.map.monsters.filter((p) => p.monnum < LASTMON && !!s.mon[p.monnum]);
  const monsters: Analysis['monsters'] = [];
  for (const n of new Set(placed.map((p) => p.monnum))) {
    const pic = s.mbl[pictures(s.mon[n])[0]];
    if (!pic) continue;
    const colors = topColors(pic.pixels, 3);
    for (const c of colors) uses[c] += 400;
    // the scenery color it stands in most often, and the first place it does
    const at = placed.filter((p) => p.monnum === n).map((p) => ({ cell: p.cury * MLEN + p.curx, c: topColors(pixelsOf(s, p.cury * MLEN + p.curx), 1)[0] }));
    const count = new Map<number, number>();
    for (const a of at) if (a.c !== undefined) count.set(a.c, (count.get(a.c) ?? 0) + 1);
    const behind = [...count].sort((p, q) => q[1] - p[1])[0]?.[0];
    if (colors.length && behind !== undefined) monsters.push({ n, colors, behind, cell: at.find((a) => a.c === behind)!.cell });
  }
  return { scene: s, touches, uses, monsters };
}

/** The map cell where colors a and b touch the most (to show where). */
export function whereTouch(an: Analysis, a: number, b: number): number {
  const own = ownTouches(an.scene);
  const k = key(a, b);
  let best = 0;
  let most = -1;
  for (let cell = 0; cell < MLEN * MWID; cell++) {
    let n = 0;
    cellTouches(an.scene, cell, own, (q, m) => q === k && (n += m));
    if (n > most) [best, most] = [cell, n];
  }
  return best;
}

export type Warning =
  | { kind: 'pair'; id: string; a: number; b: number; views: View[]; count: number }
  | { kind: 'monster'; id: string; n: number; color: number; behind: number; views: View[]; ratio: number; cell: number }
  | { kind: 'ramp'; id: string; ramp: number[]; step: [number, number]; views: View[] };

const OTHER = VIEWS.filter((v) => v.id !== 'normal').map((v) => v.id);
/** Ramps are judged by hue too: a ramp that changes hue more than lightness still reads in color, so not in grayscale. */
const RAMP_VIEWS: View[] = ['normal', 'protan', 'deutan', 'tritan'];
const lookOf = (pal: Palette) => Object.fromEntries(VIEWS.map((v) => [v.id, labs(pal, v.id)])) as Record<View, Float64Array>;

/** Warnings for a level in this palette: lost pairs (most touches first), monsters, then ramps. */
export function warnings(pal: Palette, an: Analysis): Warning[] {
  const look = lookOf(pal);
  const out: Warning[] = [];
  const pairs: Warning[] = [];
  for (const [k, count] of an.touches) {
    if (count < MIN_TOUCH) continue;
    const [a, b] = [k >> 8, k & 255];
    if (deltaE(look.normal, a, b) < DISTINCT) continue;
    const views = OTHER.filter((v) => deltaE(look[v], a, b) < ALIKE);
    if (views.length) pairs.push({ kind: 'pair', id: `pair:${a}:${b}`, a, b, views, count });
  }
  out.push(...pairs.sort((p, q) => (q.kind === 'pair' && p.kind === 'pair' ? q.count - p.count : 0)));
  for (const m of an.monsters) {
    // one of its main colors standing out is enough to see it, as the Level check counts
    const best = (v: View) => Math.max(...m.colors.map((c) => deltaE(look[v], c, m.behind)));
    if (best('normal') < DISTINCT) continue;
    const views = OTHER.filter((v) => best(v) < ALIKE);
    if (!views.length) continue;
    const ratio = Math.min(
      ...views.map((v) => {
        const sim = simulate(pal, v);
        return Math.max(...m.colors.map((c) => contrastRatio(luminance(sim, c), luminance(sim, m.behind))));
      }),
    );
    const color = m.colors.reduce((p, c) => (deltaE(look.normal, c, m.behind) > deltaE(look.normal, p, m.behind) ? c : p));
    out.push({ kind: 'monster', id: `mon:${m.n}`, n: m.n, color, behind: m.behind, views, ratio, cell: m.cell });
  }
  out.push(...rampWarnings(pal, an.uses, look));
  return out;
}

/** The palette's shade ramps (3 or more steps) with a color the level uses. */
export function rampsUsed(pal: Palette, uses: Float64Array): number[][] {
  const seenAt = new Set<number>();
  const out: number[][] = [];
  for (let i = 0; i < 256; i++) {
    if (seenAt.has(i)) continue;
    const r = rampOf(pal, i);
    r.forEach((c) => seenAt.add(c));
    if (r.length >= 3 && r.some((c) => uses[c] > 0)) out.push(r);
  }
  return out;
}

function rampWarnings(pal: Palette, uses: Float64Array, look: Record<View, Float64Array>): Warning[] {
  const out: Warning[] = [];
  for (const r of rampsUsed(pal, uses)) {
    let worst: { step: [number, number]; d: number } | undefined;
    for (let k = 0; k + 1 < r.length; k++) {
      const d = Math.min(...RAMP_VIEWS.map((v) => deltaE(look[v], r[k], r[k + 1])));
      if (!worst || d < worst.d) worst = { step: [r[k], r[k + 1]], d };
    }
    if (!worst || worst.d >= STEP) continue;
    const [a, b] = worst.step;
    const views = RAMP_VIEWS.filter((v) => deltaE(look[v], a, b) < STEP);
    out.push({ kind: 'ramp', id: `ramp:${Math.min(...r)}`, ramp: r, step: worst.step, views });
  }
  return out;
}

/** A palette change offered for a warning. */
export interface Fix {
  label: string;
  /** The new palette (the old one is not changed). */
  pal: Palette;
}

/** True when the trial palette brings no warning, in any of the levels, that `pal` hadn't. */
function noNewWarnings(pal: Palette, all: Analysis[], fixed: string): (trial: Palette) => boolean {
  const before = all.map((an) => new Set(warnings(pal, an).map((w) => w.id)));
  return (trial) => all.every((an, i) => warnings(trial, an).every((w) => w.id === fixed || before[i].has(w.id)));
}

/** A ramp color must stay between its darker and lighter neighbors. */
function keepsRamp(pal: Palette, trial: Palette, c: number): boolean {
  const r = rampOf(pal, c);
  const k = r.indexOf(c);
  if (r.length < 2) return true;
  const l = luma(trial, c);
  return (k === 0 || luma(trial, r[k - 1]) < l) && (k === r.length - 1 || l < luma(trial, r[k + 1]));
}

/**
 * A safe fix for a warning: for two colors that look alike, the least-used one made lighter or
 * darker (the smallest change that parts them in every view); for a ramp, its steps evened out.
 * Undefined when no change is safe for every level drawn with the palette.
 */
export function fixFor(pal: Palette, w: Warning, an: Analysis, all: Analysis[] = [an]): Fix | undefined {
  const safe = noNewWarnings(pal, all, w.id);
  if (w.kind === 'ramp') {
    const [lo, hi] = [Math.min(...w.ramp), Math.max(...w.ramp)];
    const trial = pal.slice();
    spread(trial, lo, hi);
    if (rampOf(trial, lo).length !== w.ramp.length) return undefined;
    const look = lookOf(trial);
    const d = Math.min(...w.ramp.slice(1).flatMap((c, k) => RAMP_VIEWS.map((v) => deltaE(look[v], w.ramp[k], c))));
    if (d < STEP || !safe(trial)) return undefined;
    return { label: `Even out colors ${lo}–${hi}`, pal: trial };
  }
  const [a, b] = w.kind === 'pair' ? [w.a, w.b] : [w.color, w.behind];
  // the color used least first; color 0 (often the screen's black) last
  const order = [a, b].sort((p, q) => (p === 0 ? 1 : q === 0 ? -1 : an.uses[p] - an.uses[q]));
  for (const c of order) {
    const o = c === a ? b : a;
    const away = luma(pal, c) >= luma(pal, o) ? 1 : -1;
    for (let step = 2; step <= 40; step += 2)
      for (const dir of [away, -away]) {
        const to = relightColor(pal, c, step * dir);
        const trial = pal.slice();
        trial.set(to, c * 3);
        if (trial.every((v, i) => v === pal[i])) continue;
        const look = lookOf(trial);
        if (VIEWS.some((v) => deltaE(look[v.id], c, o) < SAFE)) continue;
        if (!keepsRamp(pal, trial, c) || !safe(trial)) continue;
        return { label: `Make color ${c} ${dir > 0 ? 'lighter' : 'darker'}`, pal: trial };
      }
  }
  return undefined;
}
