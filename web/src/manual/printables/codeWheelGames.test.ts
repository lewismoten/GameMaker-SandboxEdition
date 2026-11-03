// Every game's paper code wheel (printables.json, kind codewheel) holds together: rings as long as
// each other, a picture for every symbol that isn't a letter, windows on the ring, and puzzles set
// with symbols the wheel has. Each window may open onto a ring of its own. Quest for the Round Tuit's wheel is a copy of the runes, rings and
// puzzles its build carves into the game (games/realm/src/wheel), so it is checked against them:
// the same glyphs, and each "Tell me the answer" really reads the carving or picks the true door.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CodeWheelItem } from './types';
import { turnFor } from './codeWheel';
import { OUTER, INNER, HIDDEN, WINDOWS, GLYPHS, CARVINGS, MINE_DOORS, carve, read, windowMarks } from '../../../../games/realm/src/wheel/wheel';

const GAMES = join(__dirname, '../../../../games');

function wheels(): [string, CodeWheelItem][] {
  const out: [string, CodeWheelItem][] = [];
  for (const id of readdirSync(GAMES)) {
    const file = join(GAMES, id, 'printables.json');
    if (!existsSync(file)) continue;
    const items = (JSON.parse(readFileSync(file, 'utf8')) as { items?: { kind: string }[] }).items ?? [];
    for (const it of items) if (it.kind === 'codewheel') out.push([id, it as CodeWheelItem]);
  }
  return out;
}

describe('code wheels', () => {
  const all = wheels();
  it('finds the Round Tuit wheel', () => expect(all.map(([id]) => id)).toContain('realm'));

  it.each(all)('%s: rings, glyphs, windows and puzzles fit together', (_id, it) => {
    const n = it.outer.length;
    expect(it.inner).toHaveLength(n);
    const rings: string[][] = !it.hidden?.length ? [] : Array.isArray(it.hidden[0]) ? (it.hidden as string[][]) : [it.hidden as string[]];
    for (const r of rings) expect(r).toHaveLength(n);
    for (const name of [...it.outer, ...it.inner, ...rings.flat()]) if (name.length > 1) expect(it.glyphs?.[name], name).toBeDefined();
    for (const [name, rows] of Object.entries(it.glyphs ?? {})) {
      expect(rows.length, name).toBeGreaterThan(0);
      for (const r of rows) expect(r, name).toMatch(new RegExp(`^[#.]{${rows[0].length}}$`));
    }
    for (const w of it.windows ?? []) {
      expect(w.at >= 0 && w.at < n).toBe(true);
      expect((w.ring ?? 0) < Math.max(1, rings.length)).toBe(true);
    }
    for (const p of it.puzzles ?? []) {
      expect(it.inner, p.ask).toContain(p.turn.inner);
      expect(it.outer, p.ask).toContain(p.turn.outer);
      expect(p.scenes.length, p.ask).toBeGreaterThan(0);
    }
  });
});

describe('Quest for the Round Tuit: the wheel matches the game', () => {
  const it0 = wheels().find(([id]) => id === 'realm')![1];
  const puzzle = (k: { rune: string; letter: string }) => it0.puzzles?.find((p) => p.turn.inner === k.rune && p.turn.outer === k.letter);

  it('has the same rings, windows and glyphs as games/realm/src/wheel', () => {
    expect(it0.outer).toEqual(OUTER);
    expect(it0.inner).toEqual(INNER);
    expect(it0.hidden).toEqual(HIDDEN);
    expect(it0.windows).toEqual(WINDOWS);
    expect(it0.glyphs).toEqual(GLYPHS);
  });

  it('opens each window onto a ring of its own', () => {
    expect(new Set(WINDOWS.map((w) => w.ring)).size).toBe(WINDOWS.length);
    expect(HIDDEN).toHaveLength(WINDOWS.length);
  });

  it('shows a different set of marks in its windows at every turn', () => {
    const seen = new Set(OUTER.map((letter) => windowMarks({ rune: INNER[0], letter }).join()));
    expect(seen.size).toBe(OUTER.length);
  });

  it.each(Object.entries(CARVINGS))('%s: Tell me the answer reads the carving', (_name, c) => {
    const p = puzzle(c.key);
    expect(p, 'a puzzle keyed as the carving is').toBeDefined();
    // the wheel's turn for the answer is the key's, and reading the carved runes there gives the words
    const words = c.lines.map((l) => read(carve(l, c.key), c.key)).join(' ');
    expect(words).toBe(c.lines.join(' '));
    expect(turnFor(it0, p!.turn.inner, p!.turn.outer)).toBe((OUTER.indexOf(c.key.letter) - INNER.indexOf(c.key.rune) + 26) % 26);
    expect(p!.answer).toContain(words);
  });

  it("the Mines: Tell me the answer names the true door's marks, which no other door wears", () => {
    const p = puzzle(MINE_DOORS.key)!;
    const marks = windowMarks(MINE_DOORS.key);
    expect(MINE_DOORS.doors[MINE_DOORS.open]).toEqual(marks);
    expect(MINE_DOORS.doors.filter((d) => d.join() === marks.join())).toHaveLength(1);
    expect(p.answer).toContain(marks.join(', '));
    expect(p.answer).toContain(['first', 'second', 'third', 'fourth'][MINE_DOORS.open]);
  });
});
