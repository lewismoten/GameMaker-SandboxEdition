// Tests: the drawings in the Sandbox games' hint books (redFilm.ts hiddenSketch) use only
// glyphs the renderer draws, and their labels sit on the drawing.
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { unknownGlyphs } from '../src/manual/printables/redFilm';
import type { HintSketch, PrintablesFile } from '../src/manual/printables/types';

const GAMES = join(__dirname, '../../games');

function sketches(): [string, HintSketch][] {
  const out: [string, HintSketch][] = [];
  for (const id of readdirSync(GAMES)) {
    const file = join(GAMES, id, 'printables.json');
    if (!existsSync(file)) continue;
    const p = JSON.parse(readFileSync(file, 'utf8')) as PrintablesFile;
    for (const it of p.items ?? []) if (it.kind === 'hintbook') for (const s of it.sections) for (const q of s.hints) if (q.sketch) out.push([`${id}: ${q.q}`, q.sketch]);
  }
  return out;
}

describe('hint book drawings', () => {
  it('every Sandbox game with a felt egg draws one', () => {
    expect(sketches().length).toBeGreaterThanOrEqual(8);
  });
  it('use only known glyphs, and keep their labels on the drawing', () => {
    for (const [where, s] of sketches()) {
      expect(unknownGlyphs(s), where).toEqual([]);
      // small enough for the red film sheet to cover at once
      expect(s.rows.length, where).toBeLessThanOrEqual(7);
      for (const r of s.rows) expect(r.length, where).toBeLessThanOrEqual(14);
      for (const l of s.labels ?? []) expect(l.y >= 0 && l.y < s.rows.length && l.x >= 0, `${where}: ${l.text}`).toBe(true);
    }
  });
});
