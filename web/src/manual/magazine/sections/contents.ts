// The contents page: every section with its page, and the advertiser index. issue.ts fills it
// in once every page has its number (the section's own pages() is only a placeholder).
import { grid, head, note, p, side } from '../blocks';
import type { MagPage, MagSection, TocEntry } from '../types';

export const CONTENTS: MagSection = {
  id: 'contents',
  title: 'Contents',
  toc: false,
  pages: () => [{ kind: 'contents', blocks: [] }],
};

/** A list in three columns, the first ones the longer. */
const thirds = <T>(list: T[]): T[][] => {
  const n = Math.ceil(list.length / 3);
  return [list.slice(0, n), list.slice(n, 2 * n), list.slice(2 * n)];
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
              advertisers(ads).map(([title, at]) => p(`${keepTail(title)}\u00a0·\u00a0${at.map((a) => `[${a.folio}](go:mag/${a.page})`).join(',\u00a0')}`)),
            ),
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
