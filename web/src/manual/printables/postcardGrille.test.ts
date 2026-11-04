// Every game's postcard-and-grille decoder (printables.json, kind postcardgrille) holds together, and for each one the
// test lays the grille on the card in every place, turn and flip: the places whose two marks meet their pictures are
// exactly the answer and a few red herrings, only the answer reads what the game asks for, and no other place reads it.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PostcardGrilleItem } from './types';
import { bare, holeCells, places, reading, turn, valid } from './postcardMath';

const GAMES = join(__dirname, '../../../../games');

function cards(): [string, PostcardGrilleItem][] {
  const out: [string, PostcardGrilleItem][] = [];
  for (const id of readdirSync(GAMES)) {
    const file = join(GAMES, id, 'printables.json');
    if (!existsSync(file)) continue;
    const items = (JSON.parse(readFileSync(file, 'utf8')) as { items?: { kind: string }[] }).items ?? [];
    for (const it of items) if (it.kind === 'postcardgrille') out.push([id, it as PostcardGrilleItem]);
  }
  return out;
}

describe('postcard and grille', () => {
  it.each(cards())('%s: every placement reads as designed', (_id, it) => {
    const g = it.grille;
    const R = it.rows.length;
    const C = it.rows[0].length;
    expect(C % 3).toBe(0);
    for (const r of it.rows) expect(r).toHaveLength(C);
    expect([it.border.left.length, it.border.right.length]).toEqual([R, R]);
    expect([it.border.top.length, it.border.bottom.length]).toEqual([C, C]);
    for (const n of [...it.border.top, ...it.border.bottom, ...it.border.left, ...it.border.right, g.a.name, g.b.name]) expect(it.glyphs[n], n).toBeDefined();
    for (const [name, rows] of Object.entries(it.glyphs)) for (const row of rows) expect(row, name).toMatch(new RegExp(`^[#.]{${rows[0].length}}$`));

    // the holes are distinct cells and the eight ways to lay the grille read differently
    expect(new Set(g.holes.map((h) => h.join())).size).toBe(g.holes.length);
    const views = new Set<string>();
    for (const flip of [false, true])
      for (let rot = 0; rot < 4; rot++) views.add(g.holes.map((h) => turn(g, h, rot, flip).join()).join(';'));
    expect(views.size).toBe(8);

    const all = places(g, R, C);
    expect(all).toHaveLength(2 * 4 * (R - g.n + 1) * (C - g.n + 1));
    const matching = all.filter((p) => valid(g, it.border, p));
    expect(matching.length).toBeGreaterThanOrEqual(1);

    for (const p of it.puzzles ?? []) {
      expect(p.scenes.length).toBeGreaterThan(0);
      const want = (p.answer ?? '').toLowerCase().match(/[a-z']+/g) ?? [];
      const answerWords = reading(g, it.rows, p.place).map(bare);
      // the placement the puzzle names has its marks on their pictures and reads what the answer says
      expect(valid(g, it.border, p.place), p.ask).toBe(true);
      expect(want.slice(0, answerWords.length)).toEqual(answerWords);
      for (const q of all) {
        const same = reading(g, it.rows, q).map(bare).join(' ') === answerWords.join(' ');
        const isIt = q.r === p.place.r && q.c === p.place.c && q.rot === p.place.rot && q.flip === p.place.flip;
        // nothing else reads the answer, and what the other matching places read is a different word list
        expect(same, JSON.stringify(q)).toBe(isIt);
        // holes always land on the message
        for (const [r, c] of holeCells(g, q)) expect(it.rows[r]?.[c]).toBeDefined();
      }
      // a placement that misses a mark never shows the answer
      expect(all.filter((q) => !valid(g, it.border, q) && reading(g, it.rows, q).map(bare).join(' ') === answerWords.join(' '))).toHaveLength(0);
    }
  });
});
