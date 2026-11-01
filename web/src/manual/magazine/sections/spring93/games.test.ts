// No. 1 (April 1993) names no game that came out after it. It lists exactly one game, Snowbound
// (March 1993, the free disk); it has no game list, directory or shelf. If one is ever added, the
// rule is No. 2's: a title dated after the issue goes under "Coming soon", never among the games
// out so far (the archive dates titles by year only: a 1993 title is out so far, 1994 on is not).
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cdCatalog } from '../../../../../scripts/cdGames';
import { BARD_MONTHS } from '../../../../retro/bbs/bardMonths';
import { SCOOP_MONTHS } from '../../../printables/scoopIssues';
import ARCHIVE from '../../data/gameMakerArchive.json';
import { magContext, magGames } from '../../games';
import { SECTIONS_1 } from '../../issue';
import { ISSUES } from '../../masthead';

const catalog = cdCatalog(join(__dirname, '../../../../../../cd'));
const ctx = magContext(magGames(catalog), ISSUES[1]);

describe('TURBO BUTTON No. 1 and the games out by April 1993', () => {
  it('names only Snowbound among the Sandbox, Bard, CD and archive games', async () => {
    const text = JSON.stringify(SECTIONS_1.flatMap((s) => s.pages(ctx) as unknown[])).toLowerCase();
    const titles = [...ARCHIVE.games.map((g) => g.title), ...catalog.map((c) => c.title)].filter((t) => t.includes(' '));
    const named = new Set(titles.filter((t) => text.includes(t.toLowerCase())).map((t) => t.toLowerCase()));
    expect([...named].filter((t) => !t.startsWith('snowbound'))).toEqual([]);
  });

  it('Snowbound is dated before the issue; every other Sandbox and Bard game after it', () => {
    expect(SCOOP_MONTHS.snowbound <= '1993-04').toBe(true);
    const others = [...Object.entries(SCOOP_MONTHS), ...Object.entries(BARD_MONTHS)].filter(([id]) => id !== 'snowbound');
    for (const [id, month] of others) expect(month > '1993-04', id).toBe(true);
  });
});
