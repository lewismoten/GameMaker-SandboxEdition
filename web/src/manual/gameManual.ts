// The printed manual of an original game (games/<id>/manual.json) and the paper that came
// in its box (games/<id>/printables.json plus generated extras; see printables/README.md):
// the stapled booklet with the box front as its cover, and a "What's in the box" tray.
import './booklet.css';
import { h } from '../editor/core/ui';
import type { CatalogEntry } from '../project/files';
import { loadCatalog } from '../project/files';
import { drawBox } from '../desk/boxes/gameBox';
import { buildBooklet } from './printables/manualPages';
import { openBox } from './printables/viewer';
import { boxItems } from './printables/items';
import { shotCache, type PrintContext } from './printables/kit';

export async function openGameManual(entry: CatalogEntry, coverImage?: string): Promise<void> {
  const manual = entry.original?.manual;
  if (!manual) return;
  const title = manual.title || `${entry.title} Manual`;
  const cover = coverImage ?? (await drawBox(entry).catch(() => undefined))?.front;
  const host = h('div', { class: 'gmb-measure gmb-pages', 'aria-hidden': 'true' });
  document.body.append(host);
  try {
    const pages = await buildBooklet(entry, cover, host);
    const family = (await loadCatalog().catch(() => [] as CatalogEntry[])).filter((g) => g.original);
    const ctx: PrintContext = { entry, family, printables: entry.original?.printables ?? {}, manual, shot: shotCache(entry) };
    await openBox(title, pages, boxItems(ctx));
  } finally {
    host.remove();
  }
}
