// Guesses a terrain's edge and corner blocks from their art: which sides of each block look like the fill and which like the ground outside.
//
// Each block's four side strips and four corner patches are compared by color (a histogram,
// so a texture's offset doesn't matter) with the fill block and the outside block. A side
// that looks more like the fill is "in". The block whose eight in/out guesses match a slot's
// neighbors exactly, most clearly, fills that slot. Only blocks made mostly of the two
// blocks' colors are considered.
import { BLEN, type Block } from '../../../../formats/blocks';
import { E, N, NE, NW, S, SE, SLOTS, SW, W, type TerrainKind } from './autotile';

type Region = [x0: number, y0: number, x1: number, y1: number]; // inclusive

const L = BLEN - 1;
const M0 = 5;
const M1 = L - 5;
const D = 2; // strip and patch depth
const REGIONS: [number, Region][] = [
  [N, [M0, 0, M1, D]],
  [S, [M0, L - D, M1, L]],
  [W, [0, M0, D, M1]],
  [E, [L - D, M0, L, M1]],
  [NW, [0, 0, D, D]],
  [NE, [L - D, 0, L, D]],
  [SW, [0, L - D, D, L]],
  [SE, [L - D, L - D, L, L]],
];

function histogram(px: Uint8Array, r: Region = [0, 0, L, L]): Map<number, number> {
  const h = new Map<number, number>();
  let n = 0;
  for (let y = r[1]; y <= r[3]; y++)
    for (let x = r[0]; x <= r[2]; x++) {
      const c = px[y * BLEN + x];
      h.set(c, (h.get(c) ?? 0) + 1);
      n++;
    }
  for (const [c, v] of h) h.set(c, v / n);
  return h;
}

/** How much two color histograms share, 0 to 1. */
function overlap(a: Map<number, number>, b: Map<number, number>): number {
  let s = 0;
  for (const [c, v] of a) s += Math.min(v, b.get(c) ?? 0);
  return s;
}

/** A block's in/out guess per neighbor (bits as autotile's N…NW) and how sure it is (sum of margins). */
export function blockFeatures(b: Block, fill: Block, outside: Block): { mask: number; sure: number } {
  const hf = histogram(fill.pixels);
  const ho = histogram(outside.pixels);
  let mask = 0;
  let sure = 0;
  for (const [bit, r] of REGIONS) {
    const h = histogram(b.pixels, r);
    const f = overlap(h, hf);
    const o = overlap(h, ho);
    if (f > o) mask |= bit;
    sure += Math.abs(f - o);
  }
  return { mask, sure };
}

/** How much of a block is the fill's or the outside's colors, 0 to 1. */
function madeOf(b: Block, fill: Block, outside: Block): number {
  const colors = new Set([...fill.pixels, ...outside.pixels]);
  let n = 0;
  for (const c of b.pixels) if (colors.has(c)) n++;
  return n / b.pixels.length;
}

/**
 * Tiles for a terrain kind, guessed from the art: tiles[slot] = block, -1 where nothing
 * fits. The fill slot gets `fill`. Paths have no fill to compare with: all -1.
 */
export function autoDetect(blocks: Block[], kind: TerrainKind, fill: number, outside: number): number[] {
  const slots = SLOTS[kind];
  const tiles = slots.map(() => -1);
  if (kind === 'path' || !blocks[fill] || !blocks[outside] || fill === outside) return tiles;
  const fb = blocks[fill];
  const ob = blocks[outside];
  const seen = new Set<string>();
  const cands = blocks
    .map((b, i) => ({ i, b, key: b.pixels.join(',') }))
    .filter(({ i, b, key }) => i !== fill && i !== outside && !seen.has(key) && (seen.add(key), madeOf(b, fb, ob) > 0.8))
    .map(({ i, b }) => ({ i, ...blockFeatures(b, fb, ob) }));
  const used = new Set<number>();
  slots.forEach((s, slot) => {
    if (s.mask === 0xff) {
      tiles[slot] = fill;
      return;
    }
    const best = cands.filter((c) => c.mask === s.mask && !used.has(c.i)).sort((a, b) => b.sure - a.sure)[0];
    if (best) {
      tiles[slot] = best.i;
      used.add(best.i);
    }
  });
  return tiles;
}
