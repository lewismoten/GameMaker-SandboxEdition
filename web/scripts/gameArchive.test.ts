// Catalog ZIPs carry an intact DOS runtime and reversible player customizations.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { extId } from '@lewismoten/gamemaker-sandbox-engine/player/fileExtensions';
import { readZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { dosNameProblems } from '../src/export/exportDos';
import { playerRecord } from '../src/dosPlayer/playerRecord';
import { readHostedZip } from '../src/project/hostedZip';
import { gameArchive } from './gameArchive';
import { cdGames, type CdCatalogEntry } from './cdGames';

const bytes = serializeGame(newGame('Fixture'));
const ownReadme = new TextEncoder().encode('The game author’s own README.');
const entry: CdCatalogEntry = {
  id: 'fixture',
  title: 'Fixture',
  kind: 'gameware',
  path: 'games/gameware/fixture/',
  gam: 'fixture.gam',
  files: ['fixture.gam', 'readme.txt'],
  sizes: [bytes.length, ownReadme.length],
  bytes: bytes.length + ownReadme.length,
};
const cd = resolve(import.meta.dirname, '../../cd/gm');
let temp: string;
let paths: Map<string, string>;
beforeAll(() => {
  temp = mkdtempSync(join(tmpdir(), 'catalog-zip-fixture-'));
  writeFileSync(join(temp, 'fixture.gam'), bytes);
  writeFileSync(join(temp, 'readme.txt'), ownReadme);
  paths = new Map([
    [`${entry.path}fixture.gam`, join(temp, 'fixture.gam')],
    [`${entry.path}readme.txt`, join(temp, 'readme.txt')],
    ...['xferplay.exe', 'sndblast.drv', 'config.hlp'].map((name) => [`dos/${name}`, join(cd, name)] as [string, string]),
  ]);
});
afterAll(() => rmSync(temp, { recursive: true, force: true }));

describe('catalog DOS distribution', () => {
  it('is reproducible, uses 8.3 names and includes game files, runtime, setup and notices', async () => {
    const zip = await gameArchive(entry, paths);
    expect(await gameArchive(entry, paths)).toEqual(zip);
    const files = new Map((await readZip(zip)).map((e) => [e.name, e.data]));
    expect(dosNameProblems([...files.keys()])).toEqual([]);
    expect(files.get('FIXTURE.EXE')).toEqual(new Uint8Array(readFileSync(join(cd, 'xferplay.exe'))));
    expect(files.get('SNDBLAST.DRV')).toEqual(new Uint8Array(readFileSync(join(cd, 'sndblast.drv'))));
    expect(files.get('CONFIG.HLP')).toEqual(new Uint8Array(readFileSync(join(cd, 'config.hlp'))));
    expect(files.get('FIXTURE.GAM')).toEqual(bytes);
    expect(files.get('README.TXT')).toEqual(ownReadme);
    expect(new TextDecoder().decode(files.get('CONFIG.BAT'))).toContain('FIXTURE config');
    const notice = new TextDecoder().decode(files.get('PLAYER.TXT'));
    for (const credit of ['MIT License', 'Borland', 'Creative']) expect(notice).toContain(credit);
  });

  it('plays with customized extensions and recovers native editable files in the browser', async () => {
    const zip = await gameArchive({ ...entry, player: playerRecord({ 'str.menu.play': 'Go', [extId('gam')]: 'qaz' }) }, paths);
    const files = new Map((await readZip(zip)).map((e) => [e.name, e.data]));
    expect(files.has('FIXTURE.QAZ')).toBe(true);
    expect(files.has('FIXTURE.GAM')).toBe(false);
    const native = await readHostedZip(zip);
    expect(native.get('fixture.gam')).toEqual(bytes);
    expect(native.get('readme.txt')).toEqual(ownReadme);
  });

  it('packages resource-only CD folders without pretending they are playable games', async () => {
    const files = await readZip(await gameArchive({ ...entry, gam: null }, paths));
    expect(files.map((e) => e.name)).toEqual(['FIXTURE.GAM', 'README.TXT']);
  });
  it('Vite serves permanent ZIPs, rejects loose game files and refreshes changed sources', async () => {
    const { createServer } = await import('vite');
    const source = join(temp, 'cd');
    const disk = join(source, 'gameware/fixture');
    mkdirSync(disk, { recursive: true });
    mkdirSync(join(source, 'gm'), { recursive: true });
    writeFileSync(join(disk, 'fixture.gam'), bytes);
    for (const name of ['xferplay.exe', 'sndblast.drv', 'config.hlp']) copyFileSync(join(cd, name), join(source, 'gm', name));
    const server = await createServer({
      configFile: false,
      root: temp,
      publicDir: false,
      logLevel: 'silent',
      plugins: [cdGames(source)],
      optimizeDeps: { noDiscovery: true },
      server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
    });
    try {
      await server.listen();
      const address = server.httpServer!.address();
      if (!address || typeof address === 'string') throw new Error('No test server port');
      const base = `http://127.0.0.1:${address.port}/`;
      const catalog = (await (await fetch(base + 'games/catalog.json')).json()) as CdCatalogEntry[];
      const game = catalog.find((e) => e.id === 'fixture')!;
      expect(game.pack).toBe('fixture.zip');
      expect(game.health).toBeDefined();
      const url = base + game.path + game.pack;
      const response = await fetch(url);
      expect(response.headers.get('content-type')).toBe('application/zip');
      const first = new Uint8Array(await response.arrayBuffer());
      expect((await readHostedZip(first)).get('fixture.gam')).toEqual(bytes);
      expect(new Uint8Array(await (await fetch(url)).arrayBuffer())).toEqual(first);
      expect((await fetch(base + game.path + 'fixture.gam')).status).toBe(404);
      const revised = serializeGame(newGame('Revised fixture'));
      writeFileSync(join(disk, 'fixture.gam'), revised);
      server.watcher.emit('change', join(disk, 'fixture.gam'));
      const next = await fetch(url);
      expect(next.status).toBe(200);
      expect((await readHostedZip(new Uint8Array(await next.arrayBuffer()))).get('fixture.gam')).toEqual(revised);
    } finally {
      await server.close();
    }
  });
});
