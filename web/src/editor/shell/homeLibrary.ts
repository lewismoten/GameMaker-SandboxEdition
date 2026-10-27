// What the home page's library holds: the catalog's games and your own (My games and Imported),
// which collection each is in, in the order shown, and one HomeGame per game for the page's life
// (so its files load once). No DOM: home.ts draws it.
import { isSandboxGame, type CatalogEntry } from '../../project/files';
import { byCollection, hasBizarreTab, isBizarreGame } from '../../project/bizarre';
import type { listProjects } from '../../project/storage';
import { catalogGame, projectGame, type GameKind, type HomeGame } from './homeCards';
import { CATEGORIES, type Category } from './homeCategories';
import { findOriginal, isImported } from './homeOrigin';

export const SORT_KEY = 'gm-home-sort';
/** 'rating' groups Imported by stars (My games keep the edited order). */
export type MySort = 'edited' | 'name' | 'rating';

function savedSort(): MySort {
  try {
    const v = localStorage.getItem(SORT_KEY);
    return v === 'name' || v === 'rating' ? v : 'edited';
  } catch {
    return 'edited';
  }
}

type Projects = Awaited<ReturnType<typeof listProjects>>;

/** Your own collections: My games and Imported. */
export const isOwn = (c: Category) => c === 'mine' || c === 'imported';

/** Gameware and Shareware: their games under who made them (homeAuthors.ts). */
export const isByMaker = (c: Category) => c === 'gameware' || c === 'shareware';

/** The collection a game is listed in. */
export const categoryOf = (g: HomeGame): Category => (g.project && isImported(g.project.id) ? 'imported' : g.kind);

export function homeLibrary() {
  // one HomeGame per game for the page's life, so files load once
  const games = new Map<string, HomeGame>();
  const remember = (g: HomeGame) => games.get(g.key) ?? (games.set(g.key, g), g);
  // every list A to Z by title (the maker and collection groups keep their own order, each A to Z inside)
  const byTitle = (list: CatalogEntry[]) => [...list].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));

  const lib = {
    catalog: [] as CatalogEntry[],
    catalogError: '',
    projects: [] as Projects,
    /** My games in the order you like: the one edited last first, or by name. */
    sort: savedSort(),
    /** The collections this catalog has: Bizarre only with enough of the Bard's games. */
    shownCats: () => CATEGORIES.filter((c) => c.id !== 'bizarre' || hasBizarreTab(lib.catalog)),
    entriesOf: (c: Category): CatalogEntry[] => byTitle(entriesIn(c)),
    mine: (p: Projects[number]) => remember(projectGame(p, findOriginal(p, lib.catalog))),
    /** Your games made here (My games) or imported. */
    own: (c: Category) => (isOwn(c) ? lib.projects.filter((p) => isImported(p.id) === (c === 'imported')) : []),
    gamesOf: (c: Category): HomeGame[] =>
      isOwn(c)
        ? sorted()
            .filter((p) => isImported(p.id) === (c === 'imported'))
            .map(lib.mine)
        : lib.entriesOf(c).map((e) => remember(catalogGame(e, c as GameKind))),
    findGame: (key: string): HomeGame | undefined => {
      for (const c of CATEGORIES) {
        const g = lib.gamesOf(c.id).find((x) => x.key === key);
        if (g) return g;
      }
      return undefined;
    },
    /** Your games renamed or saved since: made afresh. */
    forgetOwn: () => {
      for (const k of [...games.keys()]) if (k.startsWith('my:')) games.delete(k);
    },
    /** Catalog games no longer listed (a secret game hidden again). */
    forgetUnlisted: () => {
      for (const k of [...games.keys()]) if (k.startsWith('cd:') && !lib.catalog.some((g) => `cd:${g.id}` === k)) games.delete(k);
    },
  };
  const gameware = () => lib.catalog.filter((g) => g.kind !== 'shareware' && !g.original);
  const entriesIn = (c: Category): CatalogEntry[] => {
    const { catalog } = lib;
    return c === 'gameware'
      ? gameware()
      : c === 'sandbox'
        ? catalog.filter((g) => isSandboxGame(g) && g.gam)
        : c === 'shareware'
          ? catalog.filter((g) => g.kind === 'shareware' && !isSandboxGame(g) && g.gam && !(isBizarreGame(g) && hasBizarreTab(catalog)))
          : c === 'bizarre' && hasBizarreTab(catalog)
            ? byCollection(catalog.filter((g) => isBizarreGame(g) && g.gam)).flatMap((s) => s.games)
            : [];
  };
  const sorted = () =>
    lib.sort === 'name'
      ? [...lib.projects].sort((a, b) => a.name.trim().localeCompare(b.name.trim(), undefined, { numeric: true, sensitivity: 'base' }))
      : lib.projects;
  return lib;
}

export type HomeLibrary = ReturnType<typeof homeLibrary>;
