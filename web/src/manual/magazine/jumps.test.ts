// Jumped stories and the small ads beside them: every "Continued on page N" lands on the page
// that says "Continued from" it, and back; the numbers come from the final page order (so they
// move with the pages); the back halves run later in the issue; and each small ad is framed,
// in the advertiser index, and inside the story's rules (555-01xx numbers, P.O. Box 000).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cdCatalog } from '../../../scripts/cdGames';
import { magContext, magGames } from './games';
import { buildIssue, SECTIONS } from './issue';
import { halfAds, numberRefs } from './pageRefs';
import type { Block, PlacedPage } from './types';

const repo = join(__dirname, '../../../..');
const ctx = magContext(magGames(cdCatalog(join(repo, 'cd'))));

type Jump = Extract<Block, { t: 'jump' }>;

/** Every jump block on a page, inside columns and beside an ad too. */
function jumps(blocks: Block[]): Jump[] {
  return blocks.flatMap((b): Jump[] => (b.t === 'jump' ? [b] : b.t === 'beside' ? jumps(b.blocks) : b.t === 'cols' ? jumps(b.blocks) : []));
}

describe('TURBO BUTTON jumps', async () => {
  const issue = await buildIssue(ctx);
  const byId = new Map(issue.pages.map((pg) => [pg.id, pg]));
  const ons = issue.pages.flatMap((pg) =>
    jumps(pg.blocks)
      .filter((j) => j.dir === 'on')
      .map((j) => ({ pg, j })),
  );

  it('jumps two or three stories', () => {
    expect(ons.length).toBeGreaterThanOrEqual(2);
    expect(ons.length).toBeLessThanOrEqual(3);
  });

  it('sends every "Continued on page N" to the page that continues from it, and back', () => {
    for (const { pg, j } of ons) {
      const to = issue.pages[j.folio! - 1];
      expect(to.id, pg.id).toBe(j.page);
      const back = jumps(to.blocks).filter((x) => x.dir === 'from');
      expect(back, to.id).toHaveLength(1);
      expect(back[0].page, to.id).toBe(pg.id);
      expect(back[0].folio, to.id).toBe(pg.folio);
      expect(back[0].title, to.id).toBeTruthy();
    }
    // and no "Continued from" without a page that jumps to it
    const froms = issue.pages.flatMap((pg) => jumps(pg.blocks).filter((j) => j.dir === 'from'));
    expect(froms).toHaveLength(ons.length);
  });

  it('picks the story up at the back of the book, after its own section, keeping its opening spread', () => {
    for (const { pg, j } of ons) {
      expect(j.folio!, pg.id).toBeGreaterThan(pg.folio);
      expect(byId.get(j.page)!.section, pg.id).not.toBe(pg.section);
      const first = issue.pages.find((x) => x.section === pg.section)!;
      expect(pg.folio - first.folio, pg.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('numbers jumps from the final page order, so they move with the pages', () => {
    const at = (pages: PlacedPage[]) => numberRefs(pages.map((pg, i) => ({ ...pg, folio: i + 1 })));
    const moved = [...issue.pages];
    moved.splice(1, 0, { ...issue.pages[1], id: 'extra' });
    const renumbered = at(moved);
    for (const { pg } of ons) {
      const p2 = renumbered.find((x) => x.id === pg.id)!;
      const j = jumps(p2.blocks).find((x) => x.dir === 'on')!;
      expect(j.folio, pg.id).toBe(renumbered.find((x) => x.id === j.page)!.folio);
    }
    expect(() => at([{ ...issue.pages[0], blocks: [{ t: 'jump', dir: 'on', page: 'nowhere' }] }])).toThrow(/nowhere/);
  });

  it('numbers {page:<id>} in text, and leaves none unnumbered', () => {
    const text = JSON.stringify(issue.pages);
    expect(text).not.toContain('{page:');
    const send = issue.pages.find((pg) => pg.id === 'ad-send-away')!;
    expect(text).toContain(`the order form is on page ${send.folio}`);
  });

  it('frames each small ad as an ad, lists it in the advertiser index, and keeps to the story’s numbers and addresses', () => {
    const small = issue.pages.flatMap((pg) => halfAds(pg.blocks).map((ad) => ({ pg, ad })));
    expect(small.length).toBeGreaterThanOrEqual(4);
    for (const { pg, ad } of small) {
      expect(pg.kind, ad.advertiser).toBe('article');
      expect(
        issue.ads.some((e) => e.title === ad.advertiser && e.folio === pg.folio),
        ad.advertiser,
      ).toBe(true);
      const words = JSON.stringify(ad);
      for (const n of words.match(/\b\d{3}-\d{4}\b/g) ?? []) expect(n, ad.advertiser).toMatch(/^555-01\d\d$/);
      for (const box of words.match(/P\.O\. Box \d+/g) ?? []) expect(box, ad.advertiser).toBe('P.O. Box 000');
      expect(words, ad.advertiser).not.toMatch(/™/);
    }
    // every jumped page shares its page with a small ad, as the space it gave up
    for (const { pg, j } of ons) {
      expect(halfAds(pg.blocks).length, pg.id).toBe(1);
      expect(halfAds(byId.get(j.page)!.blocks).length, j.page).toBe(1);
    }
  });

  it('runs the back halves in the issue’s running order, off the contents page', () => {
    const jumped = SECTIONS.filter((s) => s.id.endsWith('-jump'));
    expect(jumped.length).toBe(ons.length);
    for (const s of jumped) expect(s.toc, s.id).toBe(false);
  });
});
