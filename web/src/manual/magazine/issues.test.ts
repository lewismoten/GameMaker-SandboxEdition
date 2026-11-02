// The two issues of TURBO BUTTON: Vol. 1, No. 4 (April 1993, a back issue with a free
// Snowbound floppy) and Vol. 3, No. 1 (January 1995, the one on the desk, with the free CD).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cdCatalog } from '../../../scripts/cdGames';
import { gameDisks } from '../../project/diskFacts';
import { magContext, magGames } from './games';
import { buildIssue } from './issue';
import { ISSUES, issueFor, MAG } from './masthead';
import type { Block, Issue } from './types';

const catalog = cdCatalog(join(__dirname, '../../../../cd'));
const games = magGames(catalog);

const blocks = (issue: Issue): Block[] => {
  const out: Block[] = [];
  const walk = (b: Block) => {
    out.push(b);
    if (b.t === 'cols' || b.t === 'side') b.blocks.forEach(walk);
    if (b.t === 'grid') b.cells.flat().forEach(walk);
  };
  issue.pages.forEach((pg) => pg.blocks.forEach(walk));
  return out;
};

describe('the two issues', async () => {
  const one = await buildIssue(magContext(games, ISSUES[1]));
  const two = await buildIssue(magContext(games, ISSUES[2]));

  it('are addressed by year and month: Vol. 1, No. 4 and Vol. 3, No. 1', () => {
    expect([ISSUES[1].vol, ISSUES[1].num]).toEqual([1, 4]);
    expect([ISSUES[2].vol, ISSUES[2].num]).toEqual([3, 1]);
    expect(issueFor(1, 4).which).toBe(1);
    expect(issueFor(3, 1).which).toBe(2);
    // an old address (before there were two) and a bare one open No. 2
    expect(issueFor(1, 1).which).toBe(2);
    expect(issueFor().which).toBe(2);
    expect(MAG.issue).toBe(ISSUES[2].issue);
  });

  it('print their own issue line in every folio', () => {
    expect(one.pages.every((pg) => pg.foot === ISSUES[1].issue)).toBe(true);
    expect(two.pages.every((pg) => pg.foot === ISSUES[2].issue)).toBe(true);
    expect(one.pages[0].blocks.find((b) => b.t === 'masthead')).toMatchObject({ issue: ISSUES[1].issue });
  });

  it('are whole folded sheets, No. 1 without house ads to fill it', () => {
    expect(one.pages.length % 4).toBe(0);
    expect(two.pages.length % 4).toBe(0);
    expect(one.pages.some((pg) => pg.section === 'house')).toBe(false);
  });

  it('mount a floppy on No. 1 and the CD on No. 2, and keep the 1992 ad a labeled reprint', () => {
    expect(blocks(one).some((b) => b.t === 'floppy')).toBe(true);
    expect(blocks(one).some((b) => b.t === 'disc')).toBe(false);
    expect(blocks(two).some((b) => b.t === 'disc')).toBe(true);
    expect(blocks(two).some((b) => b.t === 'floppy')).toBe(false);
    const reprint = one.pages.find((pg) => pg.id === 'ad-reprint')!;
    expect(JSON.stringify(reprint.blocks)).toMatch(/Reprinted/);
    expect(JSON.stringify(reprint.blocks)).toContain('$89');
  });

  it('keep the pieces of the other issue out: no 3.0 or CD in No. 1, no debut talk in No. 2', () => {
    const text = JSON.stringify(one.pages);
    expect(text).not.toMatch(/3\.00|Sound Blaster Pro|Pittsburgh/);
    expect(JSON.stringify(two.pages)).not.toMatch(/first issue|preview issue|debut issue/i);
  });

  it('keep a half-page ad off the interview’s second page, which has no room for one (checked by eye at 1500 and 700 wide)', () => {
    const page = one.pages.find((pg) => pg.id === 'lewis-2')!;
    expect(page.blocks.some((b) => b.t === 'halfad')).toBe(false);
  });

  it('put Snowbound on one 1.44 MB floppy, as the disk page says', () => {
    const snowbound = catalog.find((g) => g.id === 'snowbound')!;
    expect(gameDisks(snowbound)).toBe(1);
  });
});
