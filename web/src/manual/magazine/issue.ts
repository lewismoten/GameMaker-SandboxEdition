// The issue: its name and number, its sections in running order, and putting them together
// (page numbers, the contents page, the advertiser index, house ads to fill out whole
// folded sheets, and the page numbers pages give each other: pageRefs.ts). Jumped stories'
// back halves (the *_JUMP sections) run at the back of the book. No DOM, so tests build the
// whole issue in Node.
import type { Issue, MagContext, MagPage, MagSection, PlacedPage, TocEntry } from './types';
import { COVER } from './sections/cover';
import { SANDBOX_EDITION_AD, SEND_AWAY_AD, ULTIMATE_AD, CATALOGS_AD } from './sections/ads';
import { CONTENTS, contentsPage } from './sections/contents';
import { LETTER } from './sections/letter';
import { MAIL_BAG } from './sections/mailBag';
import { NEWS } from './sections/news';
import { FREE_CD } from './sections/freeCd';
import { LEWIS, LEWIS_JUMP } from './sections/lewis';
import { CLAUDE, CLAUDE_JUMP } from './sections/claude';
import { WEB_EDITION, WEB_EDITION_JUMP } from './sections/webEdition';
import { DOS_BUGS } from './sections/dosBugs';
import { STRATEGY } from './sections/strategy';
import { DIRECTORY } from './sections/directory';
import { REVIEWS } from './sections/reviews';
import { MAXIMUS } from './sections/maximus';
import { SPOTLIGHT } from './sections/spotlight';
import { BBS_LISTINGS } from './sections/bbsListings';
import { SHAREWARE_SHELF } from './sections/shelf';
import { STORE } from './sections/store';
import { MUG_AD } from './sections/mugAd';
import { HARDWARE } from './sections/hardware';
import { SOUND_CARD_AD } from './sections/soundCardAd';
import { READER_SERVICE } from './sections/readerService';
import { BACK_COVER } from './sections/backCover';
import { houseAd } from './sections/houseAd';
import { halfAds, numberRefs } from './pageRefs';

/** The running order. The contents page is filled in once every page has its number. */
export const SECTIONS: MagSection[] = [
  COVER,
  SANDBOX_EDITION_AD,
  CONTENTS,
  LETTER,
  MAIL_BAG,
  NEWS,
  FREE_CD,
  SEND_AWAY_AD,
  LEWIS,
  ULTIMATE_AD,
  CLAUDE,
  WEB_EDITION,
  DOS_BUGS,
  CATALOGS_AD,
  STRATEGY,
  DIRECTORY,
  REVIEWS,
  MAXIMUS,
  SPOTLIGHT,
  BBS_LISTINGS,
  SHAREWARE_SHELF,
  // the back of the book: where the jumped stories pick up
  LEWIS_JUMP,
  CLAUDE_JUMP,
  WEB_EDITION_JUMP,
  STORE,
  MUG_AD,
  HARDWARE,
  SOUND_CARD_AD,
  READER_SERVICE,
  BACK_COVER,
];

/** Every section's pages, numbered, with the contents page filled in and house ads to a multiple of four. */
export async function buildIssue(ctx: MagContext, sections: MagSection[] = SECTIONS): Promise<Issue> {
  const made = await Promise.all(sections.map(async (s) => ({ s, pages: await s.pages(ctx) })));
  // whole folded sheets: house ads go in just before the reader service card and back cover
  const total = made.reduce((n, m) => n + m.pages.length, 0);
  const fill = (4 - (total % 4)) % 4;
  if (fill) {
    const at = Math.max(
      0,
      made.findIndex((m) => m.s.id === READER_SERVICE.id),
    );
    made.splice(at, 0, { s: { id: 'house', title: 'House ads', toc: false, pages: () => [] }, pages: Array.from({ length: fill }, (_, i) => houseAd(i)) });
  }
  const pages: PlacedPage[] = [];
  const toc: TocEntry[] = [];
  const ads: TocEntry[] = [];
  for (const { s, pages: list } of made)
    list.forEach((pg: MagPage, i) => {
      const folio = pages.length + 1;
      const placed: PlacedPage = {
        ...pg,
        id: pg.id ?? (i === 0 ? s.id : `${s.id}-${i + 1}`),
        folio,
        section: s.id,
        head: pg.head ?? (pg.kind === 'article' || pg.kind === 'dept' ? (s.dept ?? s.title) : undefined),
      };
      if (i === 0 && s.toc !== false) toc.push({ section: s.id, page: placed.id, title: s.title, blurb: s.blurb, folio });
      if ((pg.kind === 'ad' || pg.kind === 'back') && pg.title) ads.push({ section: s.id, page: placed.id, title: pg.title, folio });
      for (const ad of halfAds(pg.blocks)) ads.push({ section: s.id, page: placed.id, title: ad.advertiser, folio });
      pages.push(placed);
    });
  const at = pages.findIndex((pg) => pg.section === CONTENTS.id);
  if (at >= 0) pages[at] = { ...pages[at], ...contentsPage(toc, ads), folio: pages[at].folio, section: CONTENTS.id, id: CONTENTS.id };
  return { pages: numberRefs(pages), toc, ads };
}
