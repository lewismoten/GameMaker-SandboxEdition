import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dosDir, isDosFileName } from './dosDir';

const GAMES = join(__dirname, '..', '..', '..', 'games');
const games = readdirSync(GAMES)
  .filter((id) => existsSync(join(GAMES, id, 'about.json')))
  .map((id) => ({ id, ...(JSON.parse(readFileSync(join(GAMES, id, 'about.json'), 'utf8')) as { exe?: string }) }));

describe('dosDir', () => {
  it('keeps an id that is already an 8.3 name', () => {
    expect(dosDir({ id: 'loaf', exe: 'LOAF.EXE' })).toBe('LOAF');
  });
  it('takes the program name for a longer id', () => {
    expect(dosDir({ id: 'reckoning', exe: 'RECKON.EXE' })).toBe('RECKON');
    expect(dosDir({ id: 'snowbound', exe: 'SNOWBND.EXE' })).toBe('SNOWBND');
  });
  it('shortens the way DOS did when there is no program name', () => {
    expect(dosDir({ id: 'reckoning' })).toBe('RECKON~1');
  });
  it('gives every game in games/ a valid folder and program name, no two the same', () => {
    const dirs = games.map(dosDir);
    for (const [i, g] of games.entries()) {
      expect(isDosFileName(dirs[i]), `${g.id}: ${dirs[i]}`).toBe(true);
      if (g.exe) expect(isDosFileName(g.exe), `${g.id}: ${g.exe}`).toBe(true);
    }
    expect(new Set(dirs).size).toBe(dirs.length);
  });
});
