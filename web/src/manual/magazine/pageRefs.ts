// What pages say about each other, settled once the issue has its page order (issue.ts): a
// jumped story's "Continued on page N" and "Continued from page N" lines, and `{page:<id>}` in
// any text, both numbered from the pages' final folios; and the small ads on editorial pages,
// for the advertiser index. No DOM.
import type { Block, HalfAd, PlacedPage } from './types';

/** The folio of each page, by id; an id that isn't in the issue is a mistake in a section. */
function folioOf(pages: PlacedPage[]): (id: string) => number {
  const by = new Map(pages.map((pg) => [pg.id, pg.folio]));
  return (id) => {
    const n = by.get(id);
    if (n === undefined) throw new Error(`TURBO BUTTON: no page "${id}" to number`);
    return n;
  };
}

/** Every string in a value with its `{page:<id>}` numbered, and every jump block given its folio. */
function settle<T>(v: T, folio: (id: string) => number): T {
  if (typeof v === 'string') return v.replace(/\{page:([a-z0-9-]+)\}/g, (_, id: string) => String(folio(id))) as T;
  if (Array.isArray(v)) return v.map((x: unknown) => settle(x, folio)) as T;
  if (v && typeof v === 'object') {
    const out = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, settle(x, folio)])) as T;
    const b = out as Block;
    return (b.t === 'jump' ? { ...b, folio: folio(b.page) } : out) as T;
  }
  return v;
}

/** The pages with the numbers they give each other filled in. */
export function numberRefs(pages: PlacedPage[]): PlacedPage[] {
  const folio = folioOf(pages);
  return pages.map((pg) => ({ ...pg, blocks: settle(pg.blocks, folio) }));
}

/** The small ads on a page, top level or standing beside its editorial. */
export function halfAds(blocks: Block[]): HalfAd[] {
  return blocks.flatMap((b) => (b.t === 'halfad' ? [b] : b.t === 'beside' ? [b.ad] : []));
}
