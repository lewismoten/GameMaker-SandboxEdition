// Exercise output ownership and the lifetime of plain Node callers.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { inspectMesh } from './meshCheck';
import { runTrinketTool } from './trinketTool';

let out;
beforeEach(() => {
  out = mkdtempSync(join(tmpdir(), 'trinkets-'));
});
afterEach(() => rmSync(out, { recursive: true, force: true }));

it('preserves unrelated files and removes only obsolete manifest outputs', async () => {
  const mesh = {
    positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]),
    indices: new Uint32Array([0, 2, 1, 0, 1, 3, 1, 2, 3, 2, 0, 3]),
    colors: new Uint8Array(12),
  };
  const report = inspectMesh(mesh);
  const tool = {
    out,
    game: 'sample',
    gameTitle: 'Sample',
    keyFiles: [],
    args: ['--force'],
    defs: ['old', 'keep'].map((id) => ({ id, title: id, blurb: '', height: 1, maxWidth: 1 })),
    make: () => ({
      mesh,
      report,
      support: mesh,
      bodies: [{ mesh, color: [0, 0, 0] }],
      wholeVolume: report.volume,
      erodedPieces: 1,
      erodedSpecks: 0,
      overhang: { area: 0, share: 0 },
    }),
  };
  const note = join(out, 'extra.stl');
  writeFileSync(note, 'mine');
  await runTrinketTool(tool);
  expect(readFileSync(note, 'utf8')).toBe('mine');
  expect(readdirSync(out)).toEqual(expect.arrayContaining(['old.stl', 'old.3mf', 'old-supports.stl']));
  await runTrinketTool({ ...tool, defs: tool.defs.slice(1) });
  expect(readdirSync(out).sort()).toEqual(['extra.stl', 'keep-supports.stl', 'keep.3mf', 'keep.stl', 'manifest.json']);
  expect(readFileSync(note, 'utf8')).toBe('mine');
});

it('confines stale manifest entries to files directly inside the output directory', async () => {
  const build = join(out, 'build');
  mkdirSync(build);
  const note = join(out, 'note.stl');
  writeFileSync(note, 'mine');
  writeFileSync(join(build, 'manifest.json'), JSON.stringify({ items: [{ file: '../note.stl', colors: { file: note } }] }));
  await runTrinketTool({ out: build, game: 'sample', gameTitle: 'Sample', args: [], keyFiles: [], defs: [] });
  expect(readFileSync(note, 'utf8')).toBe('mine');
});

function runCaller(body) {
  const entry = join(out, 'caller.mjs');
  buildSync({
    stdin: {
      contents: `import { runTrinketTool } from './trinketTool';
    const tool = {out: process.argv[2],game:'sample',gameTitle:'Sample',args:[],keyFiles:[],defs:[],make(){throw Error('fixture failure')}};
    ${body}`,
      resolveDir: fileURLToPath(new URL('.', import.meta.url)),
    },
    outfile: entry,
    bundle: true,
    platform: 'node',
    format: 'esm',
  });
  return execFileSync(process.execPath, [entry, join(out, 'build')], { encoding: 'utf8', timeout: 4000 });
}
it('returns to the caller after a cache hit', () => {
  expect(runCaller("await runTrinketTool(tool); await runTrinketTool(tool); console.log('continued');")).toContain('up to date\ncontinued');
});
it('exits naturally after catching a worker failure', () => {
  expect(
    runCaller(`try { await runTrinketTool({...tool,args:['--workers','2'],defs:['a','b'].map(id=>({id,height:1,maxWidth:1}))}); }
    catch(error){ console.log('caught',error.message); }`),
  ).toContain('caught Error: fixture failure');
});
