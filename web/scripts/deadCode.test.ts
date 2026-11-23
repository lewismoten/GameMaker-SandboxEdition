// Compare the public inventory from equivalent package entry points.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import ts from 'typescript';
import { expect, it } from 'vitest';

it('reports the same unconsumed public names through named and wildcard barrels', () => {
  const root = mkdtempSync(join(tmpdir(), 'dead-code-'));
  try {
    for (const dir of ['web/public', 'web/scripts', 'web/packages/tools/src', 'games', 'scripts']) mkdirSync(join(root, dir), { recursive: true });
    const script = join(root, 'web/scripts/deadCode.cjs');
    const source = readFileSync(join(__dirname, 'deadCode.ts'), 'utf8');
    writeFileSync(
      script,
      ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText,
    );
    const pkg = join(root, 'web/packages/tools');
    writeFileSync(join(pkg, 'package.json'), JSON.stringify({ name: 'tools', exports: { './audio': { 'gamemaker-source': './src/audio.ts' } } }));
    writeFileSync(join(pkg, 'src/sound.ts'), 'export const tone = 1, volume = 2; export default 3;');
    writeFileSync(join(root, 'games/consumer.ts'), "import { volume } from 'tools/audio';");
    for (const clause of ['{ tone, volume }', '*']) {
      writeFileSync(join(pkg, 'src/audio.ts'), `export ${clause} from './sound';`);
      const json = execFileSync(process.execPath, [script, '--json'], {
        encoding: 'utf8',
        env: { ...process.env, NODE_PATH: resolve(__dirname, '../../node_modules') },
      });
      expect(JSON.parse(json).publicExports).toEqual([{ file: 'web/packages/tools/src/audio.ts', name: 'tone', kind: 'dead' }]);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
