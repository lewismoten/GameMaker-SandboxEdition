// Every game's look-up code sheet (printables.json, kind codesheet) holds together: a square for every row
// and column of each grid, no heading twice (so a row and column name one square), a picture for every
// glyph named, and puzzles that point at a square the sheet has.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CodeSheetItem } from './types';

const GAMES = join(__dirname, '../../../../games');

function codeSheets(): [string, CodeSheetItem][] {
  const out: [string, CodeSheetItem][] = [];
  for (const id of readdirSync(GAMES)) {
    const file = join(GAMES, id, 'printables.json');
    if (!existsSync(file)) continue;
    const items = (JSON.parse(readFileSync(file, 'utf8')) as { items?: { kind: string }[] }).items ?? [];
    for (const it of items) if (it.kind === 'codesheet') out.push([id, it as CodeSheetItem]);
  }
  return out;
}

describe('code sheets', () => {
  const all = codeSheets();
  if (!all.length) it.todo('no game ships a code sheet yet');
  else
    it.each(all)('%s: grids, glyphs and puzzles fit together', (_id, it) => {
      expect(it.grids.length).toBeGreaterThan(0);
      for (const g of it.grids) {
        expect(new Set(g.rows).size, g.title).toBe(g.rows.length);
        expect(new Set(g.cols).size, g.title).toBe(g.cols.length);
        expect(g.cells, g.title).toHaveLength(g.rows.length);
        for (const r of g.cells) expect(r, g.title).toHaveLength(g.cols.length);
      }
      for (const [name, rows] of Object.entries(it.glyphs ?? {})) {
        expect(rows.length, name).toBeGreaterThan(0);
        for (const r of rows) expect(r, name).toMatch(new RegExp(`^[#.]{${rows[0].length}}$`));
      }
      for (const p of it.puzzles ?? []) {
        const g = it.grids[p.grid];
        expect(g, p.ask).toBeDefined();
        expect(g.rows, p.ask).toContain(p.row);
        expect(g.cols, p.ask).toContain(p.col);
        expect(p.scenes.length, p.ask).toBeGreaterThan(0);
      }
    });
});
