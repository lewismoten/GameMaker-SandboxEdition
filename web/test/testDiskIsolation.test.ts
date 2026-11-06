// A fully populated nested disk must stay out of every automatic catalog, even when explicitly named.
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import type { Roots } from '../scripts/mcp/roots';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { cdCatalog, cdSecretCatalog, cdFiles, slimCatalog, pageCatalog, indexCatalog, cdGames } from '../scripts/cdGames';
import { makeDisk } from '../../games/kit/testdisks/sound-stress/disk';
import { catalogDownloadable } from '../src/export/downloadable';

let root: string;
const repo = resolve(import.meta.dirname, '../..');
const write = (name: string, data: string | Uint8Array) => {
  mkdirSync(dirname(join(root, name)), { recursive: true });
  writeFileSync(join(root, name), data);
};
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'testdisk-isolation-'));
  mkdirSync(join(root, 'cd'));
  for (const name of ['xferplay.exe', 'sndblast.drv', 'config.hlp']) write(`cd/gm/${name}`, readFileSync(join(repo, 'cd/gm', name)));
  mkdirSync(join(root, 'web'));
  const files = makeDisk('unused').files;
  for (const [id, series] of [
    ['control', 'starter'],
    ['retail', 'original'],
    ['kit/testdisks/sound-stress', 'original'],
  ]) {
    write(`games/${id}/about.json`, JSON.stringify({ title: id, series, version: '1.0' }));
    write(`games/${id}/build.ts`, 'throw new Error("must not run automatically");');
    for (const [name, bytes] of files) write(`games/${id}/disk/${name}`, bytes);
  }
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

it('keeps default MCP enumeration shallow and public registries unmodified', async () => {
  vi.doMock('../scripts/mcp/roots', async (original) => ({
    ...(await original<object>()),
    GAMES_DIR: join(root, 'games'),
    CD_GAMES_DIR: join(root, 'cd/gameware'),
  }));
  try {
    const { listGames } = await import('../scripts/mcp/sources');
    const listed = listGames({ read: [join(root, 'games'), join(root, 'cd')], isWritable: () => false } as unknown as Roots);
    expect(listed.map((game) => game.source)).toEqual(['sandbox:control', 'sandbox:retail']);
  } finally {
    vi.doUnmock('../scripts/mcp/roots');
  }
  for (const path of ['web/src/project/starter.ts', 'web/src/project/starterHeroes.ts', 'web/src/project/ceremonies.ts', 'web/src/cast/castData.ts'])
    expect(readFileSync(join(repo, path), 'utf8')).not.toContain('sound-stress');
});

it('ignores generated nested disk files in Git', () => {
  expect(execFileSync('git', ['check-ignore', 'games/kit/testdisks/sound-stress/disk/soundtst.gam'], { cwd: repo, encoding: 'utf8' }).trim()).toContain(
    '/disk/soundtst.gam',
  );
});

it('keeps catalog positive controls while omitting the populated nested fixture from every variant and file route', () => {
  const catalog = cdCatalog(join(root, 'cd'));
  expect(catalog.map((e) => e.id)).toEqual(['control', 'retail']);
  expect(catalog.filter(catalogDownloadable).map((e) => e.id)).toEqual(['retail']);
  for (const variant of [catalog, cdSecretCatalog(join(root, 'cd')), slimCatalog(catalog), pageCatalog(catalog), indexCatalog(catalog)]) {
    expect(JSON.stringify(variant)).not.toContain('sound-stress');
    expect(JSON.stringify(variant)).not.toContain('testdisks');
  }
  expect([...cdFiles(join(root, 'cd')).values()].some((v) => v.includes('testdisks'))).toBe(false);
});

it('neither serves guessed test-disk URLs nor emits them into a production catalog build', async () => {
  const { createServer, build } = await import('vite');
  const server = await createServer({
    configFile: false,
    root: join(root, 'web'),
    publicDir: false,
    logLevel: 'silent',
    plugins: [cdGames(join(root, 'cd'))],
    optimizeDeps: { noDiscovery: true },
    server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
  });
  try {
    await server.listen();
    const address = server.httpServer!.address();
    if (!address || typeof address === 'string') throw new Error('No port');
    const base = `http://127.0.0.1:${address.port}/`;
    for (const path of ['games/catalog.json', 'games/index.json', 'games/extra-1.json', 'games/extra-2.json']) {
      const text = await (await fetch(base + path)).text();
      expect(text).not.toContain('sound-stress');
    }
    for (const path of ['games/originals/sound-stress/soundtst.zip', 'games/kit/testdisks/sound-stress/disk/soundtst.gam', 'games/details/sound-stress.json'])
      expect((await fetch(base + path)).status).toBe(404);
    for (let tries = 0; tries < 100; tries++) {
      const response = await fetch(base + 'games/originals/control/control.zip');
      if (response.status === 200) break;
      expect(response.status).toBe(202);
      await new Promise((done) => setTimeout(done, 50));
      if (tries === 99) throw new Error('Control archive never ready');
    }
  } finally {
    await server.close();
  }
  write('web/index.html', '<html><body>fixture</body></html>');
  const result = await build({
    configFile: false,
    root: join(root, 'web'),
    publicDir: false,
    logLevel: 'silent',
    plugins: [cdGames(join(root, 'cd'))],
    build: { write: false },
  });
  const builds = Array.isArray(result) ? result : [result];
  const outputs = builds.flatMap((b) => ('output' in b ? b.output : []));
  expect(outputs.some((o) => o.fileName === 'games/catalog.json')).toBe(true);
  expect(outputs.some((o) => o.fileName.includes('sound-stress') || o.fileName.includes('testdisks'))).toBe(false);
  const cat = outputs.find((o) => o.fileName === 'games/catalog.json');
  expect(cat && 'source' in cat ? String(cat.source) : '').toContain('control');
}, 30000);

it('leaves the diagnostic out of actual Pocket output files in default, any, card, GMP, only and force modes', () => {
  const cli = join(repo, 'web/scripts/pocketData.ts');
  const viteNode = join(repo, 'node_modules/.bin/vite-node');
  const modes = [[], ['--series', 'any'], ['--out', join(root, 'card')], ['--gmp', join(root, 'gmp')], ['--only', 'sound-stress'], ['--force', 'sound-stress']];
  for (const [i, args] of modes.entries()) {
    const output = execFileSync(viteNode, [cli, ...args], { cwd: join(root, 'web'), encoding: 'utf8', env: { ...process.env, GM_SKIP_GAME_BUILD: '1' } });
    expect(output).not.toContain('sound-stress');
    if (i !== 4) expect(output).toContain(i === 2 || i === 3 ? 'retail' : 'control');
    const dir = i === 2 ? join(root, 'card/pocket') : i === 3 ? join(root, 'gmp/pocket') : join(root, 'hardware/pocket-player/data');
    const names = readdirSync(dir);
    expect(names.join()).not.toContain('sound-stress');
    if (i !== 3) {
      const index = readFileSync(join(dir, 'games.txt'), 'utf8');
      expect(index).not.toContain('sound-stress');
      if (i !== 4) expect(index).toContain(i === 2 ? 'retail|' : 'control|');
    } else expect(names.some((n) => n.endsWith('.GMP'))).toBe(true);
  }
}, 30000);
