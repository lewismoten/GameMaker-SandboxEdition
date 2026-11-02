// Palette reservations, planned and synced. Pure: no DOM, no files.
//  - planRanges: for a game with no reservations, where a range of colors for each kind of sprite
//    (monsters, characters) would go, sized by how many different colors their blocks draw and placed
//    where the fewest other blocks already use those color numbers.
//  - syncRange: make one role's reserved range identical in every palette its files are shown with.
//    The colors the role's blocks use move into the range (the blocks' pixels are renumbered, and the
//    palettes get the range's colors), or, when more colors are drawn than the range holds, the least
//    used colors become the nearest kept one. Each change is scored in CIELAB delta E (colorReduce).
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { FLAG_MEAN, FLAG_WORST, labOf, type ReduceScore } from './colorReduce';

/** Color numbers 1-15 hold the engine's own interface colors (an inference from PLAYGAME's Box calls), so a proposed range starts at 16. */
export const FIRST_FREE = 16;
export const LAST_FREE = 254;
/** A sprite range never grows past this many colors; blocks with more get reduced. */
export const RANGE_CAP = 48;

export interface RoleDemand {
  role: 'monster' | 'character';
  /** Different colors (by RGB) the role's shown blocks draw. */
  distinct: number;
  /** How many pixels of the role's blocks use each color number, as drawn in their first palette. */
  usage: number[];
}

export interface Proposed {
  first: number;
  last: number;
  role: 'monster' | 'character';
  /** Pixels of other blocks that already use a color number in this range (the sync must move or reduce them first). */
  conflicts: number;
}

/** Windows for each sprite role, biggest first. `others[i]` counts pixels of other (background) blocks using color i. */
export function planRanges(demands: readonly RoleDemand[], others: readonly number[]): Proposed[] {
  const out: Proposed[] = [];
  const taken = new Set<number>();
  const sorted = demands.filter((d) => d.distinct > 0).sort((a, b) => b.distinct - a.distinct);
  for (const d of sorted) {
    const n = Math.min(d.distinct, RANGE_CAP);
    let best: { start: number; cost: number } | undefined;
    for (let s = FIRST_FREE; s + n - 1 <= LAST_FREE; s++) {
      let cost = 0;
      let clash = false;
      for (let i = s; i < s + n; i++) {
        if (taken.has(i)) {
          clash = true;
          break;
        }
        cost += (others[i] ?? 0) + sorted.reduce((a, o) => (o === d ? a : a + (o.usage[i] ?? 0)), 0) - (d.usage[i] ?? 0) * 0.5;
      }
      if (!clash && (!best || cost < best.cost)) best = { start: s, cost };
    }
    if (!best) continue;
    let conflicts = 0;
    for (let i = best.start; i < best.start + n; i++) {
      taken.add(i);
      conflicts += (others[i] ?? 0) + sorted.reduce((a, o) => (o === d ? a : a + (o.usage[i] ?? 0)), 0);
    }
    out.push({ first: best.start, last: best.start + n - 1, role: d.role, conflicts });
  }
  return out.sort((a, b) => a.first - b.first);
}

export interface SyncFile {
  blocks: Block[];
  /** The block numbers scenes show. */
  shown: ReadonlySet<number>;
  /** Keys of the palettes the file is shown with; the first is its reference. */
  palettes: string[];
}

export interface SyncResult {
  ok: true;
  /** Per file, the blocks whose pixels were renumbered. */
  pixels: Map<number, Map<number, Uint8Array>>;
  /** Per palette key, the new 768 bytes (only palettes that changed). */
  palettes: Map<string, Uint8Array>;
  score: ReduceScore;
  /** Blocks (file index, number) whose picture changes, worst first. */
  changed: { file: number; n: number; mean: number }[];
  /** Colors the range holds, and colors that were more than it holds. */
  used: number;
  reduced: number;
}

const rgbKey = (p: Uint8Array, i: number) => (p[i * 3] << 12) | (p[i * 3 + 1] << 6) | p[i * 3 + 2];

/** Makes `first..last` the same in every palette: the role's colors move in, scored. `blocked` is per palette the color numbers other files draw with. */
export function syncRange(
  files: readonly SyncFile[],
  palettes: ReadonlyMap<string, Uint8Array>,
  first: number,
  last: number,
  blocked: ReadonlyMap<string, ReadonlySet<number>>,
): SyncResult | { ok: false; why: string } {
  const n = last - first + 1;
  const keys = new Set(files.flatMap((f) => f.palettes));
  for (const k of keys) {
    if (!palettes.has(k)) return { ok: false, why: `palette ${k} is missing` };
    const b = blocked.get(k);
    if (b)
      for (let i = first; i <= last; i++) if (b.has(i)) return { ok: false, why: `${k} has other blocks drawing with color ${i}; reduce those colors first` };
  }
  // the colors the role draws, by RGB in each file's reference palette
  const count = new Map<number, number>();
  const sample = new Map<number, { pal: Uint8Array; index: number }>();
  const pref = new Map<number, number>();
  files.forEach((f) => {
    const ref = palettes.get(f.palettes[0])!;
    for (const b of f.shown) {
      for (const v of f.blocks[b]?.pixels ?? []) {
        if (v === 0 || v === 255) continue;
        const k = rgbKey(ref, v);
        count.set(k, (count.get(k) ?? 0) + 1);
        if (!sample.has(k)) sample.set(k, { pal: ref, index: v });
        if (v >= first && v <= last && !pref.has(k)) pref.set(k, v);
      }
    }
  });
  const ranked = [...count.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const kept = ranked.slice(0, n).map(([k]) => k);
  const slot = new Map<number, number>();
  const used = new Set<number>();
  for (const k of kept) {
    const p = pref.get(k);
    if (p !== undefined && !used.has(p)) (slot.set(k, p), used.add(p));
  }
  let next = first;
  for (const k of kept) {
    if (slot.has(k)) continue;
    while (used.has(next)) next++;
    slot.set(k, next);
    used.add(next);
  }
  // colors beyond what the range holds become the nearest kept one
  const lab = (k: number) => labOf(sample.get(k)!.pal, sample.get(k)!.index);
  const target = new Map<number, number>(slot);
  for (const [k] of ranked.slice(n)) {
    const from = lab(k);
    let best = kept[0];
    let bd = Infinity;
    for (const t of kept) {
      const to = lab(t);
      const d = Math.hypot(from[0] - to[0], from[1] - to[1], from[2] - to[2]);
      if (d < bd) ((bd = d), (best = t));
    }
    target.set(k, slot.get(best)!);
  }
  // the range's colors, identical everywhere; slots nothing uses keep the first palette's colors
  const base = palettes.get(files[0].palettes[0])!;
  const range = new Uint8Array(n * 3);
  range.set(base.subarray(first * 3, (last + 1) * 3));
  for (const k of kept) range.set([(k >> 12) & 63, (k >> 6) & 63, k & 63], (slot.get(k)! - first) * 3);
  const outPal = new Map<string, Uint8Array>();
  for (const k of keys) {
    const p = palettes.get(k)!;
    if (p.subarray(first * 3, (last + 1) * 3).every((v, i) => v === range[i])) continue;
    const q = p.slice();
    q.set(range, first * 3);
    outPal.set(k, q);
  }
  // renumber pixels and score what looks different in any palette
  const pixels = new Map<number, Map<number, Uint8Array>>();
  const changed: SyncResult['changed'] = [];
  const flagged: number[] = [];
  let sum = 0;
  let cnt = 0;
  let worst = 0;
  files.forEach((f, fi) => {
    const ref = palettes.get(f.palettes[0])!;
    const per = new Map<number, Uint8Array>();
    const move = (v: number) => (v === 0 || v === 255 ? v : (target.get(rgbKey(ref, v)) ?? v));
    for (let bi = 0; bi < f.blocks.length; bi++) {
      const px = f.blocks[bi].pixels;
      const shown = f.shown.has(bi);
      const out = shown ? px.map(move) : px;
      if (!shown) continue;
      const moved = out.some((v, i) => v !== px[i]);
      if (moved) per.set(bi, out);
      let bsum = 0;
      let bn = 0;
      let bworst = 0;
      for (const key of f.palettes) {
        const was = palettes.get(key)!;
        const now = outPal.get(key) ?? was;
        for (let i = 0; i < px.length; i++) {
          const [a, b] = [px[i], out[i]];
          if (a === 255 || a === 0) continue;
          if (was[a * 3] === now[b * 3] && was[a * 3 + 1] === now[b * 3 + 1] && was[a * 3 + 2] === now[b * 3 + 2]) continue;
          const [x, y] = [labOf(was, a), labOf(now, b)];
          const d = Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
          bsum += d;
          bn++;
          bworst = Math.max(bworst, d);
        }
      }
      if (!moved && !bn) continue;
      changed.push({ file: fi, n: bi, mean: bn ? bsum / bn : 0 });
      if (bn && (bsum / bn > FLAG_MEAN || bworst > FLAG_WORST)) flagged.push(bi);
      sum += bsum;
      cnt += bn;
      worst = Math.max(worst, bworst);
    }
    pixels.set(fi, per);
  });
  changed.sort((a, b) => b.mean - a.mean);
  return {
    ok: true,
    pixels,
    palettes: outPal,
    score: { mean: cnt ? sum / cnt : 0, worst, flagged },
    changed,
    used: kept.length,
    reduced: Math.max(0, ranked.length - n),
  };
}
