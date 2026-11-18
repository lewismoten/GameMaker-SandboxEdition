// Shapes full catalog entries into the index, page, file-list and detail JSON payloads.
import type { CdCatalogEntry, OriginalExtras } from './cdGamesModel';

/**
 * The catalog without what only some pages read (games/catalog.json): a shareware notice,
 * an original game's manual and printables. Those are in games/details/<id>.json. The play
 * page needs only this (and, for shareware, its game's details); games/index.json has it all.
 */
export function slimCatalog(catalog: CdCatalogEntry[]): CdCatalogEntry[] {
  return catalog.map(({ notice: _notice, fileFacts: _fileFacts, original, ...e }, i) => ({
    ...e,
    ...(original ? { original: slimOriginal(original) } : {}),
    ...(catalogDetails(catalog[i]) ? { details: true } : {}),
  }));
}

/**
 * games/catalog.json: slimCatalog, and each Starter down to what the home page and dos.html
 * read at load (id, title, its pictures' flags, the manual's title). Its
 * blurb, label and box art go to games/details/<id>.json (withDetails), as do every original
 * game's controls and player look, so forty or more Starters do not weigh down every page that loads the catalog.
 */
export function pageCatalog(catalog: CdCatalogEntry[]): LeanEntry[] {
  return slimCatalog(catalog).map((e) => {
    // the file lists (games/catalog-files.json, pageFiles) only a play, a copy or a disk listing reads; `rec` (the .rec files) is the one thing the home page's preview asks of them
    const { files, sizes: _sizes, ...head } = e;
    const lean = { ...head, rec: files.filter((f) => f.endsWith('.rec')) };
    if (!lean.details) return lean;
    // every original game: its controls and player look (only a copy, a play or a walkthrough reads them)
    const { controls: _controls, player: _player, ...rest } = lean;
    if (e.series !== 'starter') return rest;
    const { blurb: _blurb, original, ...slim } = rest;
    return { ...slim, ...(original ? { original: { sound: original.sound, ...(original.manual ? { manual: original.manual } : {}) } } : {}) };
  });
}

/** An entry in games/catalog.json: no `files` or `sizes` (see pageFiles). */
export type LeanEntry = Omit<CdCatalogEntry, 'files' | 'sizes'> & { rec?: string[] };

/** games/catalog-files.json: each listed game's DOS files and their sizes, which games/catalog.json leaves out (a lazily fetched companion, withFiles in src/project/files.ts). */
export function pageFiles(catalog: CdCatalogEntry[]): Record<string, { files: string[]; sizes: number[] }> {
  return Object.fromEntries(catalog.map((e) => [e.id, { files: e.files, sizes: e.sizes }]));
}

/**
 * What the shelf, the disk box and the home page draw an original game with: its label, box and
 * sound card, the manual's title (pages: [] until withDetails fills them in) and the hero from
 * its paper (the disk label's portrait). The rest is in games/details/<id>.json.
 */
function slimOriginal(o: OriginalExtras): OriginalExtras {
  const p = o.printables;
  const stickers = p?.stickers?.filter((s) => s.hero);
  const items = p?.items?.filter((i) => i.kind === 'idcard' && i.portrait);
  const printables = stickers?.length || items?.length ? { ...(stickers?.length ? { stickers } : {}), ...(items?.length ? { items } : {}) } : undefined;
  return {
    label: o.label,
    box: o.box,
    sound: o.sound,
    ...(o.manual ? { manual: { title: o.manual.title, pages: [] } } : {}),
    ...(printables ? { printables } : {}),
  };
}

/**
 * games/index.json: every entry whole, except the Starters', which are as slim as in catalog.json
 * (a manual holding only its title, details: true). Forty of them carried 300 kB of "How do I…?"
 * questions and lessons that only the Starters tab and a manual open read (via withDetails), and
 * the Library, the desk and the magazine loaded all of it with the full catalog.
 */
export function indexCatalog(catalog: CdCatalogEntry[]): CdCatalogEntry[] {
  const slim = slimCatalog(catalog);
  return catalog.map((e, i) => (e.series === 'starter' && slim[i].details ? { ...e, original: slim[i].original, details: true } : e));
}

/** An entry's games/details/<id>.json, or undefined when it has nothing slimCatalog leaves out. */
export function catalogDetails(e: CdCatalogEntry): Details | undefined {
  const o = e.original;
  const original = o && (o.manual || o.printables) ? { manual: o.manual, printables: o.printables } : undefined;
  const more = { ...(e.controls ? { controls: e.controls } : {}), ...(e.player ? { player: e.player } : {}) };
  if (e.series !== 'starter') return e.notice || original || e.controls || e.player ? { notice: e.notice, original, ...more } : undefined;
  // a Starter's catalog.json entry also lacks these (pageCatalog)
  return {
    notice: e.notice,
    original: { ...original, label: o?.label, box: o?.box },
    ...(e.blurb ? { blurb: e.blurb } : {}),
    ...more,
  };
}

/** A games/details/<id>.json. */
interface Details {
  notice?: string;
  original?: OriginalExtras;
  blurb?: string;
  controls?: unknown;
  player?: unknown;
}
