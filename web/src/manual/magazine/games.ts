// The games the magazine may name: the catalog's games sorted into Sandbox Software's, The
// Bard of Bizarre's song-games and the CD's gameware and shareware. A secret game is never
// among them: the magazine reads the catalog as served (which leaves them out) and also drops
// any an older dev server still lists (secretGames.ts isOldSecret), even once they are found.
import type { CatalogEntry } from '../../project/files';
import { isOldSecret } from '../../project/secretGames';
import type { MagContext, MagGame } from './types';

type Entry = Pick<CatalogEntry, 'id' | 'title' | 'kind' | 'author' | 'company' | 'year' | 'price' | 'blurb' | 'series' | 'gam' | 'original'>;

const kindOf = (g: Entry): MagGame['kind'] =>
  g.original ? (g.series === 'bizarre' ? 'bizarre' : (g.company ?? 'Sandbox Software') === 'Sandbox Software' ? 'sandbox' : 'bizarre') : g.kind;

interface HintBookItem {
  kind: 'hintbook';
  title?: string;
  sections?: { head: string; hints: { q: string; a: string }[] }[];
}

export function magGames(entries: readonly Entry[]): MagGame[] {
  return entries
    .filter((g) => g.gam && !isOldSecret(g.id))
    .map((g) => {
      const book = g.original?.printables?.items?.find((i) => i.kind === 'hintbook') as HintBookItem | undefined;
      return {
        id: g.id,
        title: g.title,
        kind: kindOf(g),
        author: g.author,
        company: g.company,
        year: g.year,
        price: g.price,
        blurb: g.blurb,
        manual: !!g.original?.manual,
        hintBook: book?.title,
        hints: book?.sections?.map((s) => ({ head: s.head, hints: s.hints.map(({ q, a }) => ({ q, a })) })),
        tagline: g.original?.box?.tagline,
        features: g.original?.box?.features,
        news: g.original?.printables?.news?.map((n) => n.head),
      };
    });
}

export function magContext(games: MagGame[]): MagContext {
  const by = new Map(games.map((g) => [g.id, g]));
  return { games, game: (id) => by.get(id) };
}
