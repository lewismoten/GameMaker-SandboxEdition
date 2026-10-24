// The game directory lists exactly the games the site lists (never a secret one), each once,
// with a screenshot, a line of its own and a link to play it.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cdCatalog } from '../../../../scripts/cdGames';
import { magContext, magGames } from '../games';
import type { Block, ListingRow } from '../types';
import { DIRECTORY, ONE_LINE } from './directory';

const ctx = magContext(magGames(cdCatalog(join(__dirname, '../../../../../cd'))));

function rowsIn(b: Block): ListingRow[] {
  if (b.t === 'rows') return b.rows;
  if (b.t === 'grid') return b.cells.flat().flatMap(rowsIn);
  if (b.t === 'cols' || b.t === 'side') return b.blocks.flatMap(rowsIn);
  return [];
}

describe('the game directory', async () => {
  const pages = await DIRECTORY.pages(ctx);
  const listed = pages.flatMap((pg) => pg.blocks.flatMap(rowsIn));

  it('lists every listable game once, and nothing else', () => {
    const ids = listed.map((r) => r.shot?.game);
    expect([...ids].sort()).toEqual(ctx.games.map((g) => g.id).sort());
  });

  it('gives each a screenshot, its own line and a play link', () => {
    for (const r of listed) {
      const id = r.shot!.game;
      expect(r.go, id).toBe(`go:play/${id}`);
      expect(r.more?.[0], id).toEqual(['Play it', `go:play/${id}`]);
      expect(ONE_LINE[id], id).toBeTruthy();
      expect(r.price, id).toBeTruthy();
    }
  });

  it('keeps to about six pages', () => {
    expect(pages.length).toBe(6);
  });
});
