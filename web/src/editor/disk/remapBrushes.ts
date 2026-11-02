// The map editor's terrains, stamps and buildings name background blocks by number (kept in the
// companion under the .bbl, editors/map/tools/brushStore.ts). When blocks fold or a set joins another,
// their numbers follow: a block that went to another number is renumbered, one that went nowhere
// becomes "none" (-1; a terrain's outside block falls back to block 0), and a dropped set's brushes
// move to the set that took its blocks. Same data shapes as brushStore.ts; unknown keys are kept.
import type { BlockMove } from './types';

interface Store {
  extras<T>(file: string, section: string, fallback: T): T;
  setExtras(file: string, section: string, value: unknown): void;
}
const KINDS = ['terrains', 'stamps', 'buildings'] as const;
type Item = Record<string, unknown> & { id?: unknown };

export function remapBrushes(store: Store, moves: readonly BlockMove[]): number {
  let changed = 0;
  for (const m of moves) {
    const same = m.file === m.into;
    const to = (c: unknown, fallback: number): unknown => (typeof c === 'number' && c >= 0 ? (m.at.get(c) ?? (same ? c : fallback)) : c);
    for (const kind of KINDS) {
      const mine = store.extras<unknown>(m.file, kind, undefined);
      if (!Array.isArray(mine) || !mine.length) continue;
      const moved = (mine as Item[]).map((x): Item => {
        if (!x || typeof x !== 'object') return x;
        const out: Item = { ...x };
        if (Array.isArray(x.tiles)) out.tiles = x.tiles.map((c) => to(c, -1));
        if ('outside' in x) out.outside = to(x.outside, 0);
        if (Array.isArray(x.cells)) out.cells = x.cells.map((c) => to(c, -1));
        if (x.parts && typeof x.parts === 'object') out.parts = Object.fromEntries(Object.entries(x.parts).map(([k, c]) => [k, to(c, -1)]));
        return out;
      });
      changed += moved.length;
      if (same) store.setExtras(m.file, kind, moved);
      else {
        const have = store.extras<unknown>(m.into, kind, []);
        const keep = Array.isArray(have) ? (have as Item[]) : [];
        const ids = new Set(keep.map((x) => x?.id));
        store.setExtras(m.into, kind, [...keep, ...moved.filter((x) => !ids.has(x?.id))]);
        store.setExtras(m.file, kind, undefined);
      }
    }
  }
  return changed;
}
