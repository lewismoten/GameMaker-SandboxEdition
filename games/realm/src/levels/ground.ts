// From painted corners to map blocks: each block takes the autotile of the layer its corners
// are in. A block may only mix the base ground with one layer (that is what the transition
// blocks are drawn for), so where two layers meet in one block the painter is told.
import type { BlockBook } from '../blocks/book';
import { tileName } from '../blocks/autotiles';
import { CornerMap, N } from '../art/corners';

interface GroundOptions {
  /** Layers in priority order (the first one wins a conflict). */
  layers: string[];
  /** The base block, or a picker for scattered variants of it. */
  base: (x: number, y: number) => string;
  /** How many extra full-block variants a layer has (`<layer>:full1`...), scattered by hash. */
  fullVariants?: Record<string, number>;
  /** Throw on blocks that mix two layers (else the first layer wins). */
  strict?: boolean;
}

export function resolveGround(cm: CornerMap, book: BlockBook, o: GroundOptions): { blocks: Uint8Array; conflicts: [number, number, string[]][] } {
  const blocks = new Uint8Array(N * N);
  const conflicts: [number, number, string[]][] = [];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const hit = o.layers.filter((l) => cm.mask(l, x, y));
      if (hit.length > 1) conflicts.push([x, y, hit]);
      if (!hit.length) {
        blocks[y * N + x] = book.n(o.base(x, y));
        continue;
      }
      const way = hit.find((l) => l === 'road' || l === 'street');
      if (hit.includes('water') && way) {
        blocks[y * N + x] = book.n(bridgeName(cm.mask('water', x, y), cm.mask(way, x, y)));
        continue;
      }
      const l = hit[0];
      const m = cm.mask(l, x, y);
      if (m === 15 && o.fullVariants?.[l]) {
        const h = cellHash(x, y, 7);
        const k = Math.floor(h * (o.fullVariants[l] + 1));
        blocks[y * N + x] = book.n(k ? `${l}:full${k}` : `${l}:full`);
        continue;
      }
      const diag = tileName(l, m, cm.variant(l, x, y));
      blocks[y * N + x] = book.n(book.has(diag) ? diag : tileName(l, m));
    }
  if (o.strict && conflicts.length) throw new Error(`Layers meet in ${conflicts.length} blocks, e.g. ${JSON.stringify(conflicts.slice(0, 5))}`);
  return { blocks, conflicts };
}

export const bridgeName = (wm: number, rm: number) => `bridge:${wm}:${rm}`;

/** The water and road corner masks of every block where a road crosses water. */
export function bridgeCombos(cm: CornerMap): [number, number][] {
  const seen = new Map<string, [number, number]>();
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const wm = cm.mask('water', x, y);
      const rm = cm.mask(cm.layers.has('road') ? 'road' : 'street', x, y);
      if (wm && rm) seen.set(bridgeName(wm, rm), [wm, rm]);
    }
  return [...seen.values()];
}

/** A stable per-block hash 0..1 for scattering decorations. */
export function cellHash(x: number, y: number, seed = 0): number {
  let h = (x * 73856093) ^ (y * 19349663) ^ (seed * 83492791);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
