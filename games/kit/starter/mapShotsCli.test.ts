// Unknown Starter IDs must fail before the CLI writes even the valid games' previews.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it('reports a misspelled ID and leaves the output directory uncreated', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'map-shots-'));
  const output = join(scratch, 'shots');
  try {
    const result = spawnSync(
      process.execPath,
      ['node_modules/vite-node/vite-node.mjs', '-c', 'scripts/game-build.config.mjs', 'games/kit/starter/mapShots.ts', output, 'first-steps', 'first-stpes'],
      { cwd: new URL('../../../', import.meta.url), encoding: 'utf8' },
    );
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Unknown Starter ID: first-stpes');
    expect(existsSync(output)).toBe(false);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
