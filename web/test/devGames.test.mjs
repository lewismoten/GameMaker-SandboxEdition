// Development admission and progress wiring, with a tiny test-owned heavy runner and no game builds.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';

it.each([true, false])('routes development builds through heavy (existing disk: %s)', async (existing) => {
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
      import { existsSync, writeFileSync } from 'node:fs';
      writeFileSync(${JSON.stringify(join(root, 'invocation.json'))}, JSON.stringify({args: process.argv.slice(2), progress: process.env.GM_BUILD_PROGRESS}));
      console.error('fixture heavy admission and progress');
      if (process.env.GM_BUILD_PROGRESS === '1') {
        const deadline = Date.now() + 2000;
        while (existsSync(${JSON.stringify(root)}) && !existsSync(${JSON.stringify(join(root, 'release'))})) {
          if (Date.now() >= deadline) {
            writeFileSync(${JSON.stringify(join(root, 'expired'))}, '');
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }
    `,
    );
    const result = spawnSync(process.execPath, [join(root, 'scripts/dev-games.mjs')], {
      encoding: 'utf8',
      timeout: 5000,
      env: { ...process.env, GM_BUILD_PROGRESS: '' },
    });
    expect(result.status).toBe(0);
    if (existing) {
      expect(existsSync(join(root, 'expired'))).toBe(false);
      writeFileSync(join(root, 'release'), '');
      await vi.waitFor(() => expect(readFileSync(join(root, 'node_modules/.cache/games-dev.log'), 'utf8')).toContain('fixture heavy admission and progress'));
      expect(result.stderr).toBe('');
    } else {
      expect(result.stderr).toContain('fixture heavy admission and progress');
    }
    const invocation = JSON.parse(readFileSync(join(root, 'invocation.json'), 'utf8'));
    expect(invocation.args).toEqual([process.execPath, join(root, 'scripts/build-games.mjs')]);
    expect(invocation.progress).toBe(existing ? '1' : '');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
