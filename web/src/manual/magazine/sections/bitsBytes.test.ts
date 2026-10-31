// The Bits & Bytes spread faces itself: its left page is an even folio, so the book opens
// to the two together (viewer.ts), and both pages are in the advertiser index.
import { describe, expect, it } from 'vitest';
import { buildIssue } from '../issue';
import { join } from 'node:path';
import { cdCatalog } from '../../../../scripts/cdGames';
import { magContext, magGames } from '../games';

const ctx = magContext(magGames(cdCatalog(join(__dirname, '../../../../../cd'))));

describe('Bits & Bytes spread', () => {
  it('is a facing pair, left page even', async () => {
    const issue = await buildIssue(ctx);
    const left = issue.pages.find((pg) => pg.id === 'bnb-ad')!;
    const right = issue.pages.find((pg) => pg.id === 'bnb-ad-2')!;
    expect(left.folio % 2).toBe(0);
    expect(right.folio).toBe(left.folio + 1);
    expect(issue.ads.filter((a) => a.title === 'Bits & Bytes Software')).toHaveLength(2);
  });
});
