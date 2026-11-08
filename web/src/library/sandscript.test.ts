// Sandscript (games/kit/sandscript.ts) and its only key, the folded note in the Library room
// (sandNote.ts, laid out by sandLayout.ts): the key lists every letter, A to Z, drawn from the
// source's own marks; the letters stay told apart when stamped small into a game's block; and
// nothing outside the Library hands the key out.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SANDSCRIPT, sandPixels, sandText } from '../../../games/kit/sandscript';
import { KEY_LETTERS, sandLayout } from './sandLayout';

const AZ = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

describe('Sandscript and the Library’s key', () => {
  it('has one letter for each of A to Z, and the key lists them all', () => {
    expect(Object.keys(SANDSCRIPT).sort()).toEqual(AZ);
    expect(KEY_LETTERS).toEqual(AZ);
  });

  it('draws each letter of the key with exactly the source’s marks, hanging from one rim', () => {
    for (const ch of AZ) {
      const g = SANDSCRIPT[ch];
      const key = sandLayout(ch);
      expect(key.rims, ch).toEqual([[0, 2]]);
      expect(key.lines, ch).toEqual(g.strokes.map(([[ax, ay], [bx, by]]) => [ax, ay, bx, by]));
      expect(key.dots, ch).toEqual(g.dots.map(([x, y]) => [x, y]));
      expect(g.strokes.length + g.dots.length, ch).toBeGreaterThan(0);
      for (const [x, y] of [...g.strokes.flat(), ...g.dots]) {
        expect([0, 1, 2], ch).toContain(x);
        expect([0, 1, 2], ch).toContain(y);
      }
    }
  });

  it('breaks the rim between words and drops what it can’t write', () => {
    expect(sandText('Hi, Teddy!  Sit.')).toBe('HI TEDDY SIT');
    expect(sandLayout('HI TEDDY SIT').rims).toHaveLength(3);
  });

  it('fits three letters to a 20-pixel block, and any two letters differ by three pixels or more', () => {
    expect(sandPixels('ABC')).toMatchObject({ rows: 5 });
    expect(sandPixels('ABC').cols).toBeLessThanOrEqual(20);
    const px = AZ.map((ch) => sandPixels(ch).px);
    for (let i = 0; i < AZ.length; i++)
      for (let j = i + 1; j < AZ.length; j++) {
        const diff = px[i].reduce((n, v, k) => n + (v === px[j][k] ? 0 : 1), 0);
        expect(diff, `${AZ[i]} and ${AZ[j]}`).toBeGreaterThanOrEqual(3);
      }
  });

  it('is handed out only by the Library’s note', () => {
    const src = join(__dirname, '..');
    const users: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.ts$/.test(name) && !name.endsWith('.test.ts') && readFileSync(p, 'utf8').includes('kit/sandscript')) users.push(p.slice(src.length + 1));
      }
    };
    walk(src);
    expect(users.sort()).toEqual(['library/sandLayout.ts', 'library/sandNote.ts']);
  });
});
