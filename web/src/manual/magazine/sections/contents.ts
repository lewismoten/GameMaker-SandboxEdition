// The contents page: every section with its page, and the advertiser index. issue.ts fills it
// in once every page has its number (the section's own pages() is only a placeholder).
import { head, note, p, side } from '../blocks';
import type { MagPage, MagSection, TocEntry } from '../types';

export const CONTENTS: MagSection = {
  id: 'contents',
  title: 'Contents',
  toc: false,
  pages: () => [{ kind: 'contents', blocks: [] }],
};

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
        ads.map((a) => p(`[${a.title}](go:mag/${a.page}) · ${a.folio}`)),
        'cyan',
      ),
      note('Every advertiser’s page links to the real thing on this site, and all of it is free to play and read here.'),
    ],
  };
}
