// Development admission and progress wiring, with a tiny test-owned heavy runner and no game builds.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it.each([true, false])('routes development builds through heavy (existing disk: %s)', (existing) => {
  const root = mkdtempSync(join(tmpdir(), 'dev-games-test-'));
  try {
    mkdirSync(join(root, 'scripts'), { recursive: true });
    mkdirSync(join(root, 'games/example/disk'), { recursive: true });
    writeFileSync(join(root, 'games/example/build.ts'), '');
    if (existing) writeFileSync(join(root, 'games/example/disk/TEST.GAM'), 'fixture');
    writeFileSync(join(root, 'scripts/dev-games.mjs'), readFileSync(new URL('../../scripts/dev-games.mjs', import.meta.url)));
    writeFileSync(join(root, 'scripts/game-build-inputs.mjs'), `export const root = ${JSON.stringify(root)};`);
    writeFileSync(
      join(root, 'scripts/heavy.mjs'),
      `
      import { writeFileSync } from 'node:fs';
      writeFileSync(${JSON.stringify(join(root, 'invocation.json'))}, JSON.stringify({args: process.argv.slice(2), progress: process.env.GM_BUILD_PROGRESS}));
      console.error('fixture heavy admission and progress');
    `,
    );
    const result = spawnSync(process.execPath, [join(root, 'scripts/dev-games.mjs')], {
      encoding: 'utf8',
      timeout: 5000,
      env: { ...process.env, GM_BUILD_PROGRESS: '' },
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toContain('fixture heavy admission and progress');
    const invocation = JSON.parse(readFileSync(join(root, 'invocation.json'), 'utf8'));
    expect(invocation.args).toEqual([process.execPath, join(root, 'scripts/build-games.mjs')]);
    expect(invocation.progress).toBe(existing ? '1' : '');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
