// The DOS export writes the project's DOS player customizations into its XFERPLAY.EXE copy and
// says so in its README, keeping the notices; with none it ships the CD's file untouched.
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportDos } from './exportDos';
import { GameFiles } from '../project/files';
import { readZip } from '../project/zip';
import { md5Hex } from '../dosPlayer/md5';
import { STOCK_PLAYER_MD5 } from '../dosPlayer/applyPatches';

const exe = new Uint8Array(readFileSync(new URL('../../../cd/gm/xferplay.exe', import.meta.url)));
const gam = new Uint8Array(readFileSync(new URL('../../../cd/gameware/peach/peach.gam', import.meta.url)));

async function exported(player?: Record<string, unknown>) {
  vi.stubGlobal('fetch', async (url: string) => new Response(url.endsWith('xferplay.exe') ? exe.slice() : new Uint8Array([1])));
  const { zip } = await exportDos(new GameFiles([['nebula.gam', gam]]), {
    title: 'Nebula',
    gam: 'nebula.gam',
    appBase: 'http://localhost/',
    player: player as never,
  });
  const entries = await readZip(zip);
  const get = (n: string) => entries.find((e) => e.name === n)!.data;
  return { exe: get('NEBULA.EXE'), readme: new TextDecoder().decode(get('README.TXT')) };
}

describe('exportDos and the DOS player', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('ships the CD’s player as it came when nothing is customized', async () => {
    const r = await exported();
    expect(md5Hex(r.exe)).toBe(STOCK_PLAYER_MD5);
    expect(r.readme).toContain('as it came on the Game-Maker CD');
  });

  it('patches it and lists the changes, keeping the notices', async () => {
    const r = await exported({ 'str.menu.play': 'Go', 'color.rgb.blue': [63, 63, 63], 'table.fkeys.F5': 'off' });
    expect(Buffer.from(r.exe.subarray(0x2575b, 0x25760)).toString('latin1')).toBe('Go  \0');
    expect(r.exe[0x16354]).toBe(63);
    expect(r.readme).toContain('customized');
    expect(r.readme).toContain('Main menu, Play: "Play" -> "Go"');
    expect(r.readme).toContain('Play, F5 saves: on -> off');
    for (const notice of ['MIT License', 'Borland', 'Creative']) expect(r.readme).toContain(notice);
  });
});
