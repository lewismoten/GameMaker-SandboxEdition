// Exercise the audit CLI against a small repository with a reachable glob import.
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';

it('counts recursive glob imports at every directory depth', () => {
  const root = mkdtempSync(join(tmpdir(), 'dead-code-'));
  try {
    for (const dir of ['web/src/parts/a/b', 'web/scripts', 'web/public', 'web/packages', 'games', 'scripts']) {
      mkdirSync(join(root, dir), { recursive: true });
    }
    symlinkSync(resolve(__dirname, '../../node_modules'), join(root, 'node_modules'), 'junction');
    copyFileSync(join(__dirname, 'deadCode.ts'), join(root, 'web/scripts/deadCode.ts'));
    writeFileSync(join(root, 'web/index.html'), '<script type="module" src="/src/main.ts"></script>');
    writeFileSync(join(root, 'web/src/main.ts'), "export const parts = import.meta.glob('./parts/**/*.ts');");
    for (const file of ['parts/top.ts', 'parts/a/middle.ts', 'parts/a/b/live.ts', 'unrelated.ts']) {
      writeFileSync(join(root, 'web/src', file), 'export default 1;');
    }

    const output = execFileSync(process.execPath, [require.resolve('vite-node/vite-node.mjs'), 'web/scripts/deadCode.ts', '--json'], {
      cwd: root,
      encoding: 'utf8',
    });
    const report = JSON.parse(output) as { unreferencedFiles: string[] };
    expect(report.unreferencedFiles).toEqual([join('web', 'src', 'unrelated.ts')]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
