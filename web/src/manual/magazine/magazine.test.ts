// TURBO BUTTON, the whole issue built from the games as the site lists them: the contents
// page matches the pages, every link leads somewhere real, every screenshot is of a listed
// game, and the secret game is nowhere in it.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cdCatalog, cdSecretCatalog } from '../../../scripts/cdGames';
import { CHAPTERS } from '../ultimate/plan';
import { buildIssue, SECTIONS } from './issue';
import { magContext, magGames } from './games';
import { GUIDE_SECTIONS, goProblem, type GoKnown } from './go';
import { linksIn, plain } from './inline';
import type { Block, Issue } from './types';

const repo = join(__dirname, '../../../..');
const catalog = cdCatalog(join(repo, 'cd'));
const secret = cdSecretCatalog(join(repo, 'cd'));
const ctx = magContext(magGames(catalog));

/** Every piece of inline text in a block, and every link target it holds. */
function walk(b: Block, text: string[], links: string[]): void {
  const t = (s?: string) => s !== undefined && (text.push(plain(s)), links.push(...linksIn(s)));
  switch (b.t) {
    case 'head':
      text.push(b.text, b.kicker ?? '');
      t(b.deck);
      break;
    case 'p':
    case 'note':
      t(b.text);
      break;
    case 'qa':
      text.push(b.who ?? '');
      t(b.text);
      break;
    case 'pull':
      t(b.text);
      text.push(b.by ?? '');
      break;
    case 'list':
      b.items.forEach(t);
      break;
    case 'cols':
      b.blocks.forEach((c) => walk(c, text, links));
      break;
    case 'grid':
      b.cells.flat().forEach((c) => walk(c, text, links));
      break;
    case 'side':
      text.push(b.title);
      b.blocks.forEach((c) => walk(c, text, links));
      break;
    case 'shot':
      text.push(b.game, b.alt);
      t(b.caption);
      links.push(`go:game/${b.game}`);
      break;
    case 'art':
    case 'cast':
      text.push(b.alt);
      t(b.caption);
      break;
    case 'rows':
      for (const r of b.rows) {
        text.push(r.title, r.by ?? '', r.kind ?? '', r.price ?? '');
        t(r.blurb);
        if (r.go) links.push(r.go);
        for (const [label, go] of r.more ?? []) (text.push(label), links.push(go));
        if (r.shot) (text.push(r.shot.game, r.shot.alt), links.push(`go:game/${r.shot.game}`));
      }
      break;
    case 'hint':
      t(b.q);
      text.push(b.a, b.game ?? '');
      if (b.game) links.push(`go:game/${b.game}`);
      break;
    case 'card':
      text.push(b.title, b.button ?? '', ...(b.fields ?? []));
      b.lines.forEach(t);
      if (b.go) links.push(b.go);
      break;
    case 'adframe':
      text.push(b.head, b.burst ?? '');
      t(b.sub);
      t(b.small);
      b.blocks.forEach((c) => walk(c, text, links));
      break;
    case 'button':
      text.push(b.label);
      links.push(b.go);
      break;
    case 'masthead':
      text.push(b.name, b.tagline, b.issue, b.price);
      break;
    case 'rule':
      break;
  }
}

function read(issue: Issue): { text: string[]; links: string[] } {
  const text: string[] = [];
  const links: string[] = [];
  for (const pg of issue.pages) {
    text.push(pg.title ?? '', pg.head ?? '', pg.id);
    for (const b of pg.blocks) walk(b, text, links);
  }
  return { text, links };
}

describe('TURBO BUTTON', async () => {
  const issue = await buildIssue(ctx);

  it('comes out to whole folded sheets, cover first and back cover last', () => {
    expect(issue.pages.length % 4).toBe(0);
    expect(issue.pages[0].kind).toBe('cover');
    expect(issue.pages.at(-1)!.kind).toBe('back');
    issue.pages.forEach((pg, i) => expect(pg.folio).toBe(i + 1));
    expect(new Set(issue.pages.map((pg) => pg.id)).size).toBe(issue.pages.length);
  });

  it('lists every section on the contents page at the page it starts on', () => {
    const listed = SECTIONS.filter((s) => s.toc !== false).map((s) => s.id);
    expect(issue.toc.map((e) => e.section)).toEqual(listed);
    for (const e of [...issue.toc, ...issue.ads]) {
      const pg = issue.pages[e.folio - 1];
      expect(pg.section, e.title).toBe(e.section);
      expect(pg.id, e.title).toBe(e.page);
    }
    for (const e of issue.toc) expect(issue.pages.find((pg) => pg.section === e.section)!.folio, e.title).toBe(e.folio);
    // the contents page's own rows say the same
    const contents = issue.pages.find((pg) => pg.kind === 'contents')!;
    const rows = contents.blocks.find((b) => b.t === 'rows');
    expect(rows?.t === 'rows' && rows.rows.map((r) => [r.title, r.price])).toEqual(issue.toc.map((e) => [e.title, `p. ${e.folio}`]));
    // and every full-page ad is in the advertiser index
    expect(issue.ads.map((a) => a.folio)).toEqual(issue.pages.filter((pg) => pg.kind === 'ad' || (pg.kind === 'back' && pg.title)).map((pg) => pg.folio));
  });

  it('links only to games, pages and openers that are there', () => {
    const hintbook = (g: (typeof catalog)[number]) => g.original?.printables?.items?.some((i) => i.kind === 'hintbook');
    const known: GoKnown = {
      games: new Set(ctx.games.map((g) => g.id)),
      boxed: new Set(catalog.filter((g) => g.original?.manual).map((g) => g.id)),
      hinted: new Set(catalog.filter(hintbook).map((g) => g.id)),
      pages: new Set(issue.pages.map((pg) => pg.id)),
      chapters: new Set(CHAPTERS.map((c) => c.id)),
    };
    const { links } = read(issue);
    expect(links.length).toBeGreaterThan(50);
    expect(links.map((l) => goProblem(l, known)).filter(Boolean)).toEqual([]);
  });

  it('knows the Guide’s sections', () => {
    const src = readFileSync(join(__dirname, '../webManual.ts'), 'utf8');
    const ids = [...src.matchAll(/^ {2}\[\s*'([a-z-]+)',/gm)].map((m) => m[1]);
    expect([...ids].sort()).toEqual([...GUIDE_SECTIONS].sort());
  });

  it('never names the secret game, even when it is handed one', async () => {
    expect(secret.length).toBeGreaterThan(0);
    const handed = magContext(magGames([...catalog, ...secret]));
    for (const s of secret) expect(handed.game(s.id), s.id).toBeUndefined();
    const all = await buildIssue(handed);
    const { text, links } = read(all);
    const words = `${text.join('\n')}\n${links.join('\n')}\n${JSON.stringify(all)}`.toLowerCase().replace(/’/g, "'");
    for (const s of secret) {
      expect(words, s.id).not.toMatch(new RegExp(`\\b${s.id.toLowerCase()}\\b`));
      expect(words, s.id).not.toContain(s.title.toLowerCase().replace(/’/g, "'"));
    }
  });
});
