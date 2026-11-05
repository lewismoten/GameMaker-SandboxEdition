// The magazine's plain text (plainText.ts, for the static magazine.html) holds every sentence
// the pages are built from, left as written; src/seo/magazineText.json is the current text
// (npx vite-node scripts/magazineText.ts rewrites it); and no secret game is in it.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cdCatalog, cdSecretCatalog } from '../../../scripts/cdGames';
import { staticPages } from '../../../scripts/seoStaticPages';
import MAGAZINE from '../../seo/magazineText.json';
import { magContext, magGames } from './games';
import { plain } from './inline';
import { buildIssue } from './issue';
import { ISSUES } from './masthead';
import { pageText } from './plainText';
import { magazineText } from './staticText';

const cd = join(__dirname, '../../../../cd');
const catalog = cdCatalog(cd);
const secret = cdSecretCatalog(cd);
const games = magGames(catalog);

/** Keys whose strings are not words a reader sees (ids, links, pictures' alt text, layout names). */
const NOT_DRAWN = new Set([
  't',
  'alt',
  'art',
  'go',
  'page',
  'game',
  'id',
  'tone',
  'look',
  'view',
  'slot',
  'dir',
  'float',
  'design',
  'section',
  'size',
  'kind',
  'min',
  'to',
]);

/** Every sentence-sized string a block holds under a key that is drawn (so a new block type's words are checked too). */
function drawnStrings(v: unknown, key: string, out: string[]): void {
  if (typeof v === 'string') {
    if (!NOT_DRAWN.has(key) && v.trim().split(/\s+/).length >= 3) out.push(plain(v).replace(/\s+/g, ' ').trim());
  } else if (Array.isArray(v)) for (const x of v) drawnStrings(x, key, out);
  else if (v && typeof v === 'object' && (v as { t?: string }).t === 'mugs')
    return; // the mugs' names are only alt text
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) drawnStrings(x, k, out);
}

describe('the magazine as plain text', () => {
  for (const n of [1, 2] as const) {
    it(`No. ${n}: every sentence a page's blocks hold is in its text, word for word`, async () => {
      const issue = await buildIssue(magContext(games, ISSUES[n]));
      const missing: string[] = [];
      for (const pg of issue.pages.filter((p) => p.kind !== 'contents')) {
        const words: string[] = [];
        drawnStrings(pg.blocks, '', words);
        const all = pageText(pg)
          .map((i) => i.text)
          .join('\n');
        for (const w of words) if (!all.includes(w)) missing.push(`${pg.id}: ${w.slice(0, 70)}`);
      }
      expect(missing).toEqual([]);
    });
  }

  it('is up to date in src/seo/magazineText.json (run: npx vite-node scripts/magazineText.ts)', async () => {
    expect(JSON.parse(JSON.stringify(await magazineText(catalog)))).toEqual(MAGAZINE);
  });

  it('is in magazine.html, and no secret game is in it', () => {
    const page = staticPages(catalog).find((p) => p.file === 'magazine.html')!;
    expect(page.html.length).toBeGreaterThan(20000);
    expect(page.html).toContain(ISSUES[1].issue);
    expect(page.html).toContain(ISSUES[2].issue);
    const lower = page.html.replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c))).toLowerCase();
    for (const g of secret) {
      expect(lower).not.toContain(g.title.toLowerCase());
      expect(lower).not.toContain(`"${g.id}"`);
      expect(lower).not.toContain(`play-${g.id}.html`);
    }
  });
});
