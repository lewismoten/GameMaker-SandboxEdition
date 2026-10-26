// The contents page: every section with its page, and the advertiser index. issue.ts fills it
// in once every page has its number (the section's own pages() is only a placeholder).
import { grid, head, note, p, side } from '../blocks';
import { plain } from '../inline';
import type { MagPage, MagSection, TocEntry } from '../types';

export const CONTENTS: MagSection = {
  id: 'contents',
  title: 'Contents',
  toc: false,
  pages: () => [{ kind: 'contents', blocks: [] }],
};

/** About how many characters fit on a line of an advertiser index column. */
const LINE = 33;

/**
 * A list in three columns, in order, cut where the tallest column is shortest: an entry too long
 * for one line takes two (or more), so the columns come out even in lines, not in entries.
 */
const thirds = (list: string[]): string[][] => {
  const lines = list.map((s) => Math.max(1, Math.ceil(plain(s).length / LINE)));
  const sum = (a: number, b: number) => lines.slice(a, b).reduce((n, x) => n + x, 0);
  let best: [number, number] = [0, 0];
  let tallest = Infinity;
  for (let i = 1; i < list.length; i++)
    for (let j = i; j < list.length; j++) {
      const t = Math.max(sum(0, i), sum(i, j), sum(j, list.length));
      if (t < tallest) [tallest, best] = [t, [i, j]];
    }
  return [list.slice(0, best[0]), list.slice(best[0], best[1]), list.slice(best[1])];
};

/** Each advertiser once, with every page it has an ad on (a real index's "· 32, 55"). */
const advertisers = (ads: TocEntry[]): [string, TocEntry[]][] => {
  const by = new Map<string, TocEntry[]>();
  for (const a of ads) by.set(a.title, [...(by.get(a.title) ?? []), a]);
  return [...by];
};

/** The name's last word joined to what follows, so its page numbers never wrap away from it. */
const keepTail = (title: string): string => title.replace(/ (\S+)$/, '\u00a0$1');

/** The page itself, from the issue's contents and advertisers. */
export function contentsPage(toc: TocEntry[], ads: TocEntry[]): MagPage {
  return {
    kind: 'contents',
    tone: 'white',
    blocks: [
      head('Contents', { kicker: 'In this issue', size: 'l', level: 1 }),
      { t: 'rows', rows: toc.map((e) => ({ title: e.title, go: `go:mag/${e.page}`, blurb: e.blurb, price: `p. ${e.folio}` })) },
      side(
        'Advertiser index',
        [
          grid(
            thirds(
              advertisers(ads).map(([title, at]) => `${keepTail(title)}\u00a0·\u00a0${at.map((a) => `[${a.folio}](go:mag/${a.page})`).join(',\u00a0')}`),
            ).map((col) => col.map((line) => p(line))),
            0.2,
          ),
          note('Every advertiser’s page links to the real thing on this site, and all of it is free to play and read here.'),
        ],
        'cyan',
        2,
      ),
    ],
  };
}
