// Prove each workspace builds from its folder alone, using only declared, packed dependencies.
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scratch = mkdtempSync(join(tmpdir(), 'gamemaker-package-isolation-'));
const artifacts = [];
const names = ['engine', 'archives', 'tools'];
const run = (cwd, args) => execFileSync('npm', args, { cwd, stdio: 'inherit' });
function inspect(dir, pkg) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) inspect(file, pkg);
    else if (file.endsWith('.ts')) {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/(?:from\s*|import\s*\()(['"])([^'"]+)\1/g)) {
        const spec = m[2];
        if (spec.startsWith('.')) {
          const target = resolve(dirname(file), spec.split('?')[0]);
          assert.ok(target.startsWith(pkg.dir + sep), `${relative(pkg.dir, file)} imports outside its package: ${spec}`);
        } else if (spec.startsWith('@lewismoten/')) {
          const name = spec.split('/').slice(0, 2).join('/');
          assert.ok(pkg.manifest.dependencies?.[name], `Undeclared dependency ${name} in ${pkg.manifest.name}`);
        }
      }
    }
  }
}
try {
  for (const name of names) {
    const source = join(root, 'web/packages', name);
    const manifest = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
    inspect(join(source, 'src'), { dir: source, manifest });
    assert.ok(existsSync(join(source, 'LICENSE')) && existsSync(join(source, 'NOTICE.md')));
    const isolated = join(scratch, name);
    cpSync(source, isolated, {
      recursive: true,
      filter: (p) =>
        !relative(source, p)
          .split(sep)
          .some((s) => ['dist', 'node_modules', '.git'].includes(s) || s.endsWith('.tgz')),
    });
    const dependencies = name === 'engine' ? [] : name === 'archives' ? artifacts.slice(0, 1) : artifacts;
    run(isolated, ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-save', ...dependencies]);
    // verify performs the isolated source build and then tests the packed output in another consumer.
    run(isolated, ['run', 'verify', '--', ...dependencies]);
    const [pack] = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', scratch], { cwd: isolated, encoding: 'utf8' }));
    artifacts.push(join(scratch, pack.filename));
    process.stdout.write(`${manifest.name}: independent source build and packed consumer passed\n`);
  }
  writeFileSync(join(scratch, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  // Test module identity across independently built packages, not workspace source aliases.
  run(scratch, ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-save', ...artifacts]);
  writeFileSync(
    join(scratch, 'smoke.mjs'),
    `
import assert from 'node:assert/strict';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { createZip, unpackGame } from '@lewismoten/gamemaker-sandbox-archives';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
const bytes=serializeGame(newGame('Independent'));
const archive=await createZip([{name:'DEMO.GAM',data:bytes}]);
const result=await unpackGame(archive);
const files=new GameFiles(result.entries);
assert.equal(files.mainGame(),'demo.gam');assert.deepEqual(files.get('demo.gam'),bytes);
assert.equal(new Pixels(20,20).px.length,400);
`,
  );
  execFileSync(process.execPath, [join(scratch, 'smoke.mjs')], { cwd: scratch, stdio: 'inherit' });
  process.stdout.write('All three packages work together from independently built npm artifacts.\n');
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
