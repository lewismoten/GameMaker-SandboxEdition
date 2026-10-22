// The paper in a Sandbox Software game's box (manual/printables, read only): the context its
// renderers need, built the way the manual viewer builds it (manual/gameManual.ts).
import { isSandboxGame, loadCatalog, withDetails, type CatalogEntry } from '../../project/files';
import { shotCache, type PrintContext } from '../../manual/printables/kit';
import { CATALOG_CHANGED } from '../../project/catalogWatch';

const cache = new Map<string, Promise<PrintContext | undefined>>();
// a secret game revealed or hidden again: the family of games changes
if (typeof window !== 'undefined') window.addEventListener(CATALOG_CHANGED, () => cache.clear());

/** Undefined for games without a manual (only the originals have printed paper). */
export function printContext(listed: CatalogEntry): Promise<PrintContext | undefined> {
  let p = cache.get(listed.id);
  if (!p) {
    p = (async () => {
      const entry = await withDetails(listed); // a listed entry holds only the manual's title
      const manual = entry.original?.manual;
      if (!manual) return undefined;
      const family = (await loadCatalog().catch(() => [] as CatalogEntry[])).filter(isSandboxGame);
      return { entry, family, printables: entry.original?.printables ?? {}, manual, shot: shotCache(entry) };
    })();
    cache.set(listed.id, p);
  }
  return p;
}
