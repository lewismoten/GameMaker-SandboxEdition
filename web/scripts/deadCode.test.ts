// Exercise the dead-code CLI against an isolated repository layout.
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';

it('reports only the unused CSS class when JavaScript modules name the others', () => {
  const root = mkdtempSync(join(tmpdir(), 'dead-code-'));
  try {
    for (const dir of ['web/scripts', 'web/src', 'web/public', 'web/packages', 'games', 'scripts']) mkdirSync(join(root, dir), { recursive: true });
    symlinkSync(resolve('../node_modules'), join(root, 'node_modules'), 'dir');
    copyFileSync(join(__dirname, 'deadCode.ts'), join(root, 'web/scripts/deadCode.ts'));
    const src = join(root, 'web/src');
    writeFileSync(join(src, 'main.ts'), "import './side.js'; import './module.mjs'; import './typed.mts';");
    writeFileSync(join(src, 'side.js'), "document.body.classList.add('js-active');");
    writeFileSync(join(src, 'module.mjs'), "document.body.classList.add('module-active');");
    writeFileSync(join(src, 'typed.mts'), "document.body.classList.add('typed-active');");
    writeFileSync(join(src, 'style.css'), '.js-active {} .module-active {} .typed-active {} .unused {}');
    const output = execFileSync(process.execPath, [require.resolve('vite-node/vite-node.mjs'), 'web/scripts/deadCode.ts', '--json'], {
      cwd: root,
      encoding: 'utf8',
    });
    expect((JSON.parse(output) as { unusedClasses: unknown[] }).unusedClasses).toEqual([{ file: 'web/src/style.css', cls: 'unused' }]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
