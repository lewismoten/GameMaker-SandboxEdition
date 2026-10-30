// Verify the built engine artifact and its NodeNext types without repository-relative imports.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const here = dirname(fileURLToPath(import.meta.url)),
  consumer = mkdtempSync(resolve(tmpdir(), 'gm-engine-consumer-'));
try {
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', consumer], { cwd: here, encoding: 'utf8' }));
  assert.ok(pack.files.some((f) => f.path === 'LICENSE'));
  assert.ok(pack.files.some((f) => f.path === 'NOTICE.md'));
  writeFileSync(resolve(consumer, 'package.json'), '{"private":true,"type":"module"}');
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', resolve(consumer, pack.filename)], { cwd: consumer, stdio: 'pipe' });
  writeFileSync(
    resolve(consumer, 'smoke.mjs'),
    `import assert from 'node:assert/strict';\nimport {GameFiles,Machine} from '@lewismoten/gamemaker-sandbox-engine';\nimport {parseGame,newGame,serializeGame} from '@lewismoten/gamemaker-sandbox-engine/formats/game';\nconst b=serializeGame(newGame('Engine'));const files=new GameFiles([['TEST.GAM',b]]);assert.equal(files.mainGame(),'test.gam');assert.equal(typeof Machine,'function');assert.ok(parseGame(b).scenes.length>0);`,
  );
  execFileSync(process.execPath, ['smoke.mjs'], { cwd: consumer, stdio: 'inherit' });
  writeFileSync(
    resolve(consumer, 'consumer.ts'),
    `import {GameFiles,Machine} from '@lewismoten/gamemaker-sandbox-engine';\nimport type {World} from '@lewismoten/gamemaker-sandbox-engine/engine/world';\nexport const files=new GameFiles();export type Runtime=Machine;export type State=World;\n`,
  );
  execFileSync(
    process.execPath,
    [
      createRequire(import.meta.url).resolve('typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--target',
      'es2022',
      '--module',
      'nodenext',
      '--moduleResolution',
      'nodenext',
      'consumer.ts',
    ],
    { cwd: consumer, stdio: 'inherit' },
  );
  process.stdout.write('Packed engine API and NodeNext declarations passed.\n');
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
