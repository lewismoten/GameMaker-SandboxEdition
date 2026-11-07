// The built CD catalog must derive exactly the same display title as a live import.
import { expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { cdCatalog } from './cdGames';

it('normalizes CP437 framed titles in the CD catalog', () => {
  const root = mkdtempSync(join(tmpdir(), 'cp437-catalog-'));
  try {
    const dir = join(root, 'cd/gameware/fixture');
    mkdirSync(dir, { recursive: true });
    const game = newGame();
    game.scenes[0].desc = '\xb3 JET DRIVER \xb3';
    writeFileSync(join(dir, 'jet.gam'), serializeGame(game));
    expect(cdCatalog(join(root, 'cd'))[0].title).toBe('JET DRIVER');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
