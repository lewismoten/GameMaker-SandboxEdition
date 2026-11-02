// Importing a game folder with its own player: a hand-edited XFERPLAY.EXE becomes DOS player
// patches, and a player with renamed extensions has the game's files renamed back. The 1990s
// players come from the archive of zips (see GM_ARCHIVE_DIR below); those tests skip when it is not there.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { adoptPlayer } from '@lewismoten/gamemaker-sandbox-archives/project/importPlayer';
import { applyPlayerPatches } from '@lewismoten/gamemaker-sandbox-archives/player/applyPatches';
import { md5Hex } from '@lewismoten/gamemaker-sandbox-archives/player/md5';
import { readZip } from '@lewismoten/gamemaker-sandbox-archives/project/zip';
import { GameFiles } from './files';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';

// GM_ARCHIVE_DIR, else the git-ignored .for-lewis/reference/archive/ at the repo root, holds the games as game-maker_<name>.zip
const ARCHIVE = process.env.GM_ARCHIVE_DIR ?? fileURLToPath(new URL('../../../.for-lewis/reference/archive/', import.meta.url));
// games are filed by their player's build (3.0/, 2.02/…; older copies: the root or pre-3.0/)
const zipPath = (dir: string) =>
  ['', 'pre-3.0', '3.0', '2.02', '2.00', '2.04', '1.04', '1.0'].map((sub) => join(ARCHIVE, sub, dir + '.zip')).find((p) => existsSync(p)) ??
  join(ARCHIVE, dir + '.zip');
const folder = async (dir: string) => {
  const files = new GameFiles();
  const players: { name: string; bytes: Uint8Array }[] = [];
  for (const { name: f, data: bytes } of await readZip(new Uint8Array(readFileSync(zipPath(dir))))) {
    if (f.endsWith('/')) continue;
    if (/\.exe$/i.test(f)) players.push({ name: f, bytes });
    else if (!/\.(com|bat|drv|pif|lzh)$/i.test(f)) files.set(f, bytes);
  }
  return { files, players };
};
// a missing zip (a fresh clone, CI) skips its test
const has = (dir: string) => existsSync(zipPath(dir));

describe('adoptPlayer', () => {
  it('says nothing for the CD’s own player, but records its build', () => {
    const exe = new Uint8Array(readFileSync(new URL('../../../cd/gm/xferplay.exe', import.meta.url)));
    const r = adoptPlayer(new GameFiles(), [{ name: 'GAME.EXE', bytes: exe }])!;
    expect(r).toMatchObject({ message: '', patches: {}, origin: { build: '3.00', stock: true, regions: [] } });
    expect(adoptPlayer(new GameFiles(), [])).toBeUndefined();
    expect(adoptPlayer(new GameFiles(), [{ name: 'SETUP.EXE', bytes: new Uint8Array(3000) }])).toBeUndefined();
  });

  it.skipIf(!has('game-maker_builder'))('reads Builder’s blanked words', async () => {
    const { files, players } = await folder('game-maker_builder');
    const r = adoptPlayer(files, players)!;
    expect(r.exe).toBe('BUILDER.EXE');
    expect(Object.keys(r.patches)).toHaveLength(8);
    expect(r.message).toMatch(/8 changes/);
    expect(r.message).not.toMatch(/aren’t carried over/);
  });

  it.skipIf(!has('game-maker_rodip-river-of-the-deep'))('reads Rōdïp’s status words', async () => {
    const { files, players } = await folder('game-maker_rodip-river-of-the-deep');
    const r = adoptPlayer(files, players)!;
    expect(r.patches['str.invent.lives']).toBe('Failsafes: %d');
  });

  it.skipIf(!has('game-maker_anyworld'))('renames Acord Games’ files back', async () => {
    const { files, players } = await folder('game-maker_anyworld');
    const r = adoptPlayer(files, players)!;
    expect(r.message).toMatch(/under other extensions/);
    expect(files.has('anyworld.gam')).toBe(true);
    const game = parseGame(files.get('anyworld.gam')!);
    expect(game.scenes[0].files[2].toLowerCase()).toBe('any0.gif');
    expect(game.scenes[2].files.slice(0, 8).map((f) => f.toLowerCase().split('.')[1])).toEqual(['pal', 'map', 'bbl', 'mon', 'mbl', 'chr', 'cbl', 'snd']);
    for (const s of game.scenes) for (const f of s.files) if (f) expect(f.toLowerCase(), f).not.toMatch(/\.z0/);
    expect(game.scenes[0].files[11].toLowerCase()).toBe('any1.rec'); // a demo the folder lacks keeps its (renamed) name
    const lst = parseSlideList(files.get('any1.lst')!);
    for (const e of lst) expect(files.has(e.name), e.name).toBe(true);
  });

  it.skipIf(!has('game-maker_anyworld'))('keeps Acord Games’ About page and writes the player back byte for byte', async () => {
    const { files, players } = await folder('game-maker_anyworld');
    const exe = players.find((p) => p.bytes.length === 160_598)!;
    const r = adoptPlayer(files, players)!;
    expect(r.origin).toMatchObject({ build: '3.00', stock: false, aboutAuthor: 'Acord Games' });
    expect(r.origin.about?.length).toBe(22);
    expect(r.message).toMatch(/writes them back/);
    const stock = new Uint8Array(readFileSync(new URL('../../../cd/gm/xferplay.exe', import.meta.url)));
    const out = applyPlayerPatches(stock, r.origin.importPatches, { regions: r.origin.regions, patches: r.origin.importPatches });
    expect(md5Hex(out)).toBe(md5Hex(exe.bytes));
  });

  it.skipIf(!has('game-maker_capn-zapn_more-dosgames-2'))('reads an older build’s player by its own offsets', async () => {
    const { files, players } = await folder('game-maker_capn-zapn_more-dosgames-2');
    const r = adoptPlayer(files, players)!;
    expect(r.origin).toMatchObject({ build: '1.04', aboutAuthor: 'Gary Acord' });
    expect(r.origin.regions.length).toBeGreaterThan(0);
    expect(r.message).toMatch(/aren’t in it/);
  });
});
