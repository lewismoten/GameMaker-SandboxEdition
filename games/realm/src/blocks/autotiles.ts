// Adding a whole autotile family to a block book: the 14 partial corner configs (round), the
// 8 diagonal cuts where asked for, and the full block, all painted by one shader so they join.
import { Canvas } from '../art/rgb';
import { DIAG_MASKS, MASKS, paintTile, type Shader, type Variant } from '../art/terrain';
import type { Attrs, BlockBook } from './book';

export interface Family {
  layer: string;
  shader: Shader;
  diag?: boolean;
  rough?: number;
  seed?: number;
  /** Attributes by how much of the block the material covers (solid water, walkable road...). */
  attrs?: (mask: number) => Attrs;
}

export const tileName = (layer: string, mask: number, v: Variant = 'round') => (mask === 15 ? `${layer}:full` : `${layer}:${mask}${v === 'diag' ? ':d' : ''}`);

export function addFamily(book: BlockBook, f: Family): void {
  const at = (m: number) => f.attrs?.(m) ?? {};
  for (const m of MASKS) {
    book.add(tileName(f.layer, m), paintTile(m, f.shader, 'round', f.rough ?? 1.2, f.seed ?? 5), at(m));
    if (f.diag && DIAG_MASKS.includes(m)) book.add(tileName(f.layer, m, 'diag'), paintTile(m, f.shader, 'diag', f.rough ?? 1.2, f.seed ?? 5), at(m));
  }
  book.add(tileName(f.layer, 15), paintTile(15, f.shader, 'round', f.rough ?? 1.2, f.seed ?? 5), at(15));
}

/** A plain painted block from a per-pixel color function. */
export function plain(fn: (x: number, y: number) => [number, number, number], ss = 2): Canvas {
  return new Canvas(20, 20).shade(fn, ss);
}
