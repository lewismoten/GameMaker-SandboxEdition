// Every download name the build gives a game is a DOS 8.3 name, and no two games share one:
// the ZIP (<dosName>.zip), the folder it unpacks to (dosDir), and each file inside.
import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { dosDir, isDosFileName } from '../src/project/dosDir';
import { cdCatalog, cdSecretCatalog } from './cdGames';
import { gameZipName, legacyAlias } from './gameArchive';

const cd = resolve(import.meta.dirname, '../../cd');
const games = [...cdCatalog(cd), ...cdSecretCatalog(cd)];

describe('download names', () => {
  it('gives every game an 8.3 ZIP name from its dosName or its 8.3 id, never a ~1 guess', () => {
    for (const g of games) {
      const zip = gameZipName(g);
      expect(isDosFileName(zip), g.id).toBe(true);
      expect(zip, g.id).not.toContain('~');
      expect(zip).toBe(`${dosDir(g).toLowerCase()}.zip`);
      expect(g.pack, g.id).toBe(zip);
    }
  });

  it('keeps ZIP names and folders different for every game', () => {
    const names = games.map((g) => dosDir(g));
    expect(new Set(names).size).toBe(names.length);
  });

  it('omits legacy aliases for games without a published old link', () => {
    for (const game of games.filter((g) => g.id !== 'reckoning' && g.id !== 'snowbound')) {
      expect(legacyAlias(game), game.id).toBeUndefined();
    }
  });

  it('names every file inside with 8.3', () => {
    for (const g of games) for (const f of g.files) expect(isDosFileName(f), `${g.id}/${f}`).toBe(true);
  });
});
