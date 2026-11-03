// Teddy's Little Biggest Adventure's Clown Club Face Dial (games/teddy3/printables.json) is a copy of
// what the game builds from games/teddy3/src/wheel: the same faces, signs, rings and windows, and its
// puzzle really picks the one Firefly Meadow gate that wears the code Gwinn's face shows.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CodeWheelItem } from './types';
import { turnFor } from './codeWheel';
import { OUTER, INNER, HIDDEN, WINDOWS, GLYPHS, GATES, GATE_CODES, codeOf, turnOf } from '../../../../games/teddy3/src/wheel/wheel';
import { FACES } from '../../../../games/teddy3/src/wheel/faces';

const file = join(__dirname, '../../../../games/teddy3/printables.json');
const it0 = (JSON.parse(readFileSync(file, 'utf8')).items as { kind: string }[]).find((i) => i.kind === 'codewheel') as CodeWheelItem;

describe("Teddy's Little Biggest Adventure: the Face Dial matches the game", () => {
  it('has the same faces, rings, windows and glyphs as games/teddy3/src/wheel', () => {
    expect(it0.split).toBe(true);
    expect(it0.outer).toEqual(OUTER);
    expect(it0.inner).toEqual(INNER);
    expect(it0.hidden).toEqual(HIDDEN);
    expect(it0.windows).toEqual(WINDOWS);
    expect(it0.glyphs).toEqual(GLYPHS);
  });

  it('is a spiral of seven windows, each onto a ring of its own', () => {
    expect(WINDOWS).toHaveLength(7);
    expect(new Set(WINDOWS.map((w) => w.ring)).size).toBe(7);
  });

  it('draws every face 12 wide with an even number of rows, so it splits cleanly', () => {
    for (const name of OUTER) {
      expect(FACES[name], name).toHaveLength(12);
      for (const row of FACES[name]) expect(row).toMatch(/^[#.]{12}$/);
    }
  });

  it('joins a different face at every turn, and shows a different code for each', () => {
    expect(new Set(OUTER.map(turnOf)).size).toBe(OUTER.length);
    expect(new Set(OUTER.map((f) => codeOf(f).join())).size).toBe(OUTER.length);
  });

  it("the Meadow's gates: only the middle one wears Gwinn's face's code", () => {
    const p = it0.puzzles!.find((q) => q.turn.inner === 'Gwinn' && q.turn.outer === 'Gwinn')!;
    expect(p).toBeDefined();
    expect(turnFor(it0, 'Gwinn', 'Gwinn')).toBe(turnOf('Gwinn'));
    expect(GATE_CODES.map((c) => c.join())).toContain(codeOf('Gwinn').join());
    expect(GATE_CODES.findIndex((c) => c.join() === codeOf('Gwinn').join())).toBe(GATES.open);
    expect(new Set(GATE_CODES.map((c) => c.join())).size).toBe(GATE_CODES.length);
    expect(p.answer).toContain(codeOf('Gwinn').join(', '));
  });
});
