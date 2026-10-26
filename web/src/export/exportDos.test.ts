// The DOS export writes the project's DOS player customizations into its XFERPLAY.EXE copy and
// says so in its README, keeping the notices; with none it ships the CD's file untouched. Renamed
// extensions rename the game's files and the names inside them, which an import undoes.
import { readFileSync, readdirSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportDos } from './exportDos';
import { GameFiles } from '../project/files';
import { readZip } from '../project/zip';
import { md5Hex } from '../dosPlayer/md5';
import { STOCK_PLAYER_MD5 } from '../dosPlayer/applyPatches';
import { ACORD_EXTENSIONS, EXT_KINDS, extId } from '../dosPlayer/fileExtensions';
import { adoptPlayer } from '../project/importPlayer';
import { parseGame } from '../formats/game';
import { parseSlideList } from '../formats/graphicScripts';

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

describe('exportDos with renamed extensions', () => {
  afterEach(() => vi.unstubAllGlobals());
  const dir = new URL('../../../cd/gameware/peach/', import.meta.url);
  const peach = () => new GameFiles(readdirSync(dir).map((n) => [n, new Uint8Array(readFileSync(new URL(n, dir)))]));
  async function exportPeach(player: Record<string, unknown>) {
    vi.stubGlobal('fetch', async (url: string) => new Response(url.endsWith('xferplay.exe') ? exe.slice() : new Uint8Array([1])));
    const { zip } = await exportDos(peach(), { title: 'Peach', gam: 'peach.gam', appBase: 'http://localhost/', player: player as never });
    return readZip(zip);
  }
  const added = /^(PEACH\.EXE|SNDBLAST\.DRV|CONFIG\.(BAT|HLP)|README\.TXT)$/;
  const every = Object.fromEntries(EXT_KINDS.map((k, i) => [extId(k.ext), `q${String.fromCharCode(97 + i)}_`]));

  it('changes nothing when every kind keeps its own extension', async () => {
    const own = Object.fromEntries(EXT_KINDS.map((k) => [extId(k.ext), k.ext]));
    const [a, b] = [await exportPeach({}), await exportPeach(own)];
    expect(b.map((e) => [e.name, md5Hex(e.data)])).toEqual(a.map((e) => [e.name, md5Hex(e.data)]));
  });

  it('renames the files, the names inside them and the player, as Acord did', async () => {
    const entries = await exportPeach(Object.fromEntries(Object.entries(ACORD_EXTENSIONS).map(([e, v]) => [extId(e), v])));
    const names = entries.map((e) => e.name);
    expect(names).toContain('PEACH.Z0G');
    expect(names).toContain('FANGDUCK.Z0B');
    expect(names).toContain('DEMO.Z0R');
    expect(names).toContain('CHOIR01.VOC'); // kept, as Acord kept .voc
    expect(names.some((n) => /\.(GAM|GIF|MAP|PAL|BKD|CMF)$/.test(n))).toBe(false);
    const get = (n: string) => entries.find((e) => e.name === n)!.data;
    const game = parseGame(get('PEACH.Z0G'));
    for (const s of game.scenes) for (const f of s.files) if (f) expect(f.toLowerCase(), f).toMatch(/\.(z0.|lst)$/);
    expect(game.scenes[0].files[2].toUpperCase()).toBe('MENU.Z0N');
    expect(names).toContain('MENU.Z0N');
    for (const e of parseSlideList(get('INSTRUCT.LST'))) expect(names, e.name).toContain(e.name.toUpperCase());
    const readme = new TextDecoder().decode(get('README.TXT'));
    expect(readme).toContain('plays PEACH.Z0G');
    expect(readme).toContain('.map -> .z0b');
    expect(readme).toContain('Files, Pictures: .gif -> .z0n');
  });

  it('comes back as the same files and choices through the import', async () => {
    const entries = await exportPeach(every);
    const files = new GameFiles(entries.filter((e) => !added.test(e.name)).map((e) => [e.name, e.data]));
    const r = adoptPlayer(files, [{ name: 'PEACH.EXE', bytes: entries.find((e) => e.name === 'PEACH.EXE')!.data }])!;
    expect(r.patches).toEqual(every);
    expect(r.message).toMatch(/Files tab keeps their extensions/);
    // the plain export's files (with the CD's ISO names, such as 1_1.gif, given back as 1-1.gif)
    const before = new GameFiles((await exportPeach({})).filter((e) => !added.test(e.name)).map((e) => [e.name, e.data]));
    expect(files.names().sort()).toEqual(before.names().sort());
    for (const n of before.names()) expect(md5Hex(files.get(n)!), n).toBe(md5Hex(before.get(n)!));
  });
});
