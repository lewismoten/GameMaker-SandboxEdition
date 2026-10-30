// Exercise the actual tarball in an independent NodeNext consumer; reject site/Node runtime edges.
import { mkdtempSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
const here = dirname(fileURLToPath(import.meta.url)),
  consumer = mkdtempSync(resolve(tmpdir(), 'gm-archives-consumer-'));
try {
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', consumer], { cwd: here, encoding: 'utf8' }));
  assert.ok(pack.files.some((f) => f.path === 'LICENSE'));
  assert.ok(pack.files.some((f) => f.path === 'NOTICE.md'));
  assert.ok(pack.files.every((f) => !/\.(gam|map|exe|pal|voc|chr|rec)$/i.test(f.path)));
  writeFileSync(resolve(consumer, 'package.json'), '{"type":"module","private":true}');
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', resolve(consumer, pack.filename)], { cwd: consumer, stdio: 'pipe' });
  writeFileSync(
    resolve(consumer, 'smoke.mjs'),
    `
import assert from 'node:assert/strict';
import {unpackGame,createZip,readZip} from '@lewismoten/gamemaker-sandbox-archives';
import {encodePack} from '@lewismoten/gamemaker-sandbox-archives/pack';
import {scanImport,scanSummary,GameReader,scanFile,groupGames} from '@lewismoten/gamemaker-sandbox-archives/scan';
import {scanImport as rootScan} from '@lewismoten/gamemaker-sandbox-archives';
const data=Uint8Array.of(1,2,3), zip=await createZip([{name:'sample.bin',data}]);
assert.deepEqual((await readZip(zip))[0].data,data);
assert.equal(typeof unpackGame,'function');assert.ok(encodePack([['a',data]]).length>3);
assert.equal(rootScan,scanImport);
const archive=await createZip([{name:'GAME/DEMO.GAM',data},{name:'GAME/HELP.TXT',data}]);
const given=[{path:'demo.zip',size:archive.length,read:async()=>archive}];
const report=await scanImport(given);
assert.equal(report.games.length,1);assert.equal(report.badZips.length,0);
assert.equal(typeof scanSummary(report),'string');
const reader=new GameReader(given);assert.equal(reader.mainGam(report.games[0]),'demo.gam');
assert.deepEqual(await reader.file(report.games[0],'demo.gam'),data);
assert.deepEqual((await reader.read(report.games[0])).files.get('help.txt'),data);
assert.equal(groupGames([scanFile(new File([data],'loose.gam'))]).games.length,1);
`,
  );
  execFileSync(process.execPath, ['smoke.mjs'], { cwd: consumer, stdio: 'inherit' });
  writeFileSync(
    resolve(consumer, 'consumer.ts'),
    `import {unpackGame,createZip,type GameInput} from '@lewismoten/gamemaker-sandbox-archives';\nimport {scanImport,GameReader,type ScanFile,type FoundGame} from '@lewismoten/gamemaker-sandbox-archives/scan';\nexport const given: ScanFile[]=[];\nexport const report=()=>scanImport(given,{zipLimits:{maxEntries:100,maxBytes:10000}});\nexport const reader=(g:FoundGame)=>new GameReader(given).read(g);\nexport const input: GameInput = new Uint8Array();\nexport const result = () => unpackGame(input);\nexport const zip = () => createZip([]);\n`,
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
  let size = 0;
  for (const name of readdirSync(resolve(here, 'dist')).filter((n) => n.endsWith('.js'))) {
    const code = readFileSync(resolve(here, 'dist', name), 'utf8');
    assert.ok(!/from\s*["']node:|catalog\.json|secretGames|window\./.test(code), name + ' has a site/Node dependency');
    size += gzipSync(code).length;
  }
  process.stdout.write('Packed archives, NodeNext declarations, and browser/content boundaries passed; all JS gzip ' + size + ' bytes.\n');
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
