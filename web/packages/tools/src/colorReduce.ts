// Color reduction for blocks: remap the pixels a block draws with colors outside the range it is
// allowed (its reserved range plus the colors nobody reserved) to the nearest allowed color, and say
// how big the change is. Distance is CIELAB delta E 1976 on the palette's colors (VGA 6-bit values).
// A block is flagged when its mean change passes 6 or any pixel's passes 20 (thresholds are a
// guess: tunable). Index 0 and 255 never move. Pure: no DOM, no files.
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';

export const FLAG_MEAN = 6;
export const FLAG_WORST = 20;

type Lab = [number, number, number];

/** CIELAB of palette color `i` (palette bytes are 6-bit VGA values). */
export function labOf(palette: Uint8Array, i: number): Lab {
  const lin = (v: number) => {
    const c = Math.min(63, v) / 63;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = [lin(palette[i * 3]), lin(palette[i * 3 + 1]), lin(palette[i * 3 + 2])];
  const xyz = [(0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, 0.2126 * r + 0.7152 * g + 0.0722 * b, (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883];
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  const [x, y, z] = xyz.map(f);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

const dist = (a: Lab, b: Lab) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export interface ReduceScore {
  /** Mean delta E over the pixels that changed color, and over every pixel of the changed blocks. */
  mean: number;
  worst: number;
  /** Blocks that passed a threshold. */
  flagged: number[];
}

export interface ReduceResult {
  /** Block number to its new pixels, only for blocks that changed. */
  changed: Map<number, Uint8Array>;
  /** Each color index that moved and where it went. */
  moves: Map<number, number>;
  score: ReduceScore;
}

/** The blocks `which` with every pixel outside `allowed` (and not 0 or 255) moved to the nearest allowed color in `palettes[0]`; scored under every palette. */
export function reduceBlocks(blocks: Block[], which: Iterable<number>, palettes: Uint8Array[], allowed: ReadonlySet<number>): ReduceResult {
  const ok = (v: number) => v === 0 || v === 255 || allowed.has(v);
  const targets = [...allowed].filter((v) => v !== 0 && v !== 255);
  const moves = new Map<number, number>();
  const nearest = (v: number): number | undefined => {
    if (moves.has(v)) return moves.get(v);
    const from = labOf(palettes[0], v);
    let best: number | undefined;
    let bd = Infinity;
    for (const t of targets) {
      const d = dist(from, labOf(palettes[0], t));
      if (d < bd) ((bd = d), (best = t));
    }
    if (best !== undefined) moves.set(v, best);
    return best;
  };
  const changed = new Map<number, Uint8Array>();
  const flagged: number[] = [];
  let sum = 0;
  let count = 0;
  let worst = 0;
  for (const n of which) {
    const px = blocks[n]?.pixels;
    if (!px || px.every(ok)) continue;
    const out = px.slice();
    for (let i = 0; i < out.length; i++) if (!ok(out[i])) out[i] = nearest(out[i]) ?? out[i];
    changed.set(n, out);
    let bsum = 0;
    let bworst = 0;
    let bn = 0;
    for (const pal of palettes)
      for (let i = 0; i < px.length; i++) {
        if (px[i] === out[i]) continue;
        const d = dist(labOf(pal, px[i]), labOf(pal, out[i]));
        bsum += d;
        bn++;
        bworst = Math.max(bworst, d);
      }
    if (bn && (bsum / bn > FLAG_MEAN || bworst > FLAG_WORST)) flagged.push(n);
    sum += bsum;
    count += bn;
    worst = Math.max(worst, bworst);
  }
  return { changed, moves, score: { mean: count ? sum / count : 0, worst, flagged } };
}
