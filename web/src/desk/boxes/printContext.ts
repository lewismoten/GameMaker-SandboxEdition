// The paper in a Sandbox Software game's box (manual/printables, read only): the context its
// renderers need, built the way the manual viewer builds it (manual/gameManual.ts).
import { loadCatalog, type CatalogEntry } from '../../project/files';
import { shotCache, type PrintContext } from '../../manual/printables/kit';

const cache = new Map<string, Promise<PrintContext | undefined>>();

/** Undefined for games without a manual (only the originals have printed paper). */
export function printContext(entry: CatalogEntry): Promise<PrintContext | undefined> {
  let p = cache.get(entry.id);
  if (!p) {
    p = (async () => {
      const manual = entry.original?.manual;
      if (!manual) return undefined;
      const family = (await loadCatalog().catch(() => [] as CatalogEntry[])).filter((g) => g.original);
      return { entry, family, printables: entry.original?.printables ?? {}, manual, shot: shotCache(entry) };
    })();
    cache.set(entry.id, p);
  }
  return p;
}
