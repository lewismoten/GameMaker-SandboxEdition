// The strategy guide finds every hint it quotes in the games' own hint books, gives every
// Sandbox box its hint book ad and newsletter back issue, and never quotes a secret's hiding place.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cdCatalog } from '../../../../scripts/cdGames';
import { magContext, magGames } from '../games';
import type { Block } from '../types';
import { STRATEGY } from './strategy';

const ctx = magContext(magGames(cdCatalog(join(__dirname, '../../../../../cd'))));

function* blocks(list: Block[]): Generator<Block> {
  for (const b of list) {
    yield b;
    if (b.t === 'cols' || b.t === 'side' || b.t === 'adframe') yield* blocks(b.blocks);
    if (b.t === 'grid') yield* blocks(b.cells.flat());
  }
}

describe('the strategy guide', async () => {
  const pages = await STRATEGY.pages(ctx);
  const all = [...blocks(pages.flatMap((pg) => pg.blocks))];
  const boxed = ctx.games.filter((g) => g.kind === 'sandbox' && g.manual);

  it('quotes hint book hints for every Sandbox game, word for word', () => {
    for (const g of boxed) {
      const mine = all.filter((b) => b.t === 'hint' && b.game === g.id);
      expect(mine.length, g.id).toBeGreaterThan(0);
      const book = (g.hints ?? []).flatMap((s) => s.hints.map((h) => `${h.q.trim()}|${h.a.trim()}`));
      for (const b of mine) if (b.t === 'hint') expect(book, g.id).toContain(`${b.q}|${b.a}`);
    }
  });

  it('never quotes a felt egg, tin heart or secrets section', () => {
    const secret = boxed.flatMap((g) => (g.hints ?? []).filter((s) => /egg|secret|heart/i.test(s.head)).flatMap((s) => s.hints.map((h) => h.a.trim())));
    const text = JSON.stringify(pages);
    for (const a of secret) expect(text).not.toContain(a);
  });

  it('has a hint book ad and a back issue for every box', () => {
    const links = JSON.stringify(pages);
    for (const g of boxed) {
      expect(links, g.id).toContain(`go:newsletter/${g.id}`);
      if (g.hints?.length) expect(links, g.id).toContain(`go:hints/${g.id}`);
    }
  });

  it('lists the back issues in order, by volume and then number', () => {
    const page = pages.find((pg) => pg.id === 'back-issues')!;
    const by = [...blocks(page.blocks)].flatMap((b) => (b.t === 'rows' ? b.rows.map((r) => r.by ?? '') : []));
    const keys = by.map((s) => /Vol\. (\d+), No\. (\d+)/.exec(s)!.slice(1).map(Number));
    expect(keys.length).toBe(boxed.length);
    const sorted = [...keys].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    expect(keys).toEqual(sorted);
  });

  it('gives every Bard of Bizarre song-game a tip', () => {
    const text = JSON.stringify(pages);
    for (const g of ctx.games.filter((x) => x.kind === 'bizarre')) expect(text, g.id).toContain(`go:play/${g.id}`);
  });
});
