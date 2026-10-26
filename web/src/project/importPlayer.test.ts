// Importing a game folder with its own player: a hand-edited XFERPLAY.EXE becomes DOS player
// patches, and a player with renamed extensions has the game's files renamed back. The 1990s
// players come from the scratchpad archive; those tests skip when it is not there.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { adoptPlayer } from './importPlayer';
import { GameFiles } from './files';
import { parseGame } from '../formats/game';
import { parseSlideList } from '../formats/graphicScripts';

const ARCHIVE = '/private/tmp/claude-501/-Users-lewismoten-dev-GameMaker/e139be0f-458e-435b-825a-5595bd4c49ab/scratchpad/arch2/';
const folder = (dir: string) => {
  const files = new GameFiles();
  const players: { name: string; bytes: Uint8Array }[] = [];
  for (const f of readdirSync(ARCHIVE + dir)) {
    const bytes = new Uint8Array(readFileSync(ARCHIVE + dir + '/' + f));
    if (/\.exe$/i.test(f)) players.push({ name: f, bytes });
    else if (!/\.(com|bat|drv|pif|lzh)$/i.test(f)) files.set(f, bytes);
  }
  return { files, players };
};
const has = (dir: string) => existsSync(ARCHIVE + dir);

describe('adoptPlayer', () => {
  it('says nothing for the CD’s own player, or none', () => {
    const exe = new Uint8Array(readFileSync(new URL('../../../cd/gm/xferplay.exe', import.meta.url)));
    expect(adoptPlayer(new GameFiles(), [{ name: 'GAME.EXE', bytes: exe }])).toBeUndefined();
    expect(adoptPlayer(new GameFiles(), [])).toBeUndefined();
  });

  it.skipIf(!has('game-maker_builder'))('reads Builder’s blanked words', () => {
    const { files, players } = folder('game-maker_builder');
    const r = adoptPlayer(files, players)!;
    expect(r.exe).toBe('BUILDER.EXE');
    expect(Object.keys(r.patches)).toHaveLength(8);
    expect(r.message).toMatch(/8 changes/);
    expect(r.message).not.toMatch(/aren’t carried over/);
  });

  it.skipIf(!has('game-maker_rodip-river-of-the-deep'))('reads Rōdïp’s status words', () => {
    const { files, players } = folder('game-maker_rodip-river-of-the-deep');
    const r = adoptPlayer(files, players)!;
    expect(r.patches['str.invent.lives']).toBe('Failsafes: %d');
  });

  it.skipIf(!has('game-maker_anyworld'))('renames Acord Games’ files back', () => {
    const { files, players } = folder('game-maker_anyworld');
    const r = adoptPlayer(files, players)!;
    expect(r.message).toMatch(/renamed file extensions/);
    expect(files.has('anyworld.gam')).toBe(true);
    const game = parseGame(files.get('anyworld.gam')!);
    expect(game.scenes[0].files[2].toLowerCase()).toBe('any0.gif');
    expect(game.scenes[2].files.slice(0, 8).map((f) => f.toLowerCase().split('.')[1])).toEqual(['pal', 'map', 'bbl', 'mon', 'mbl', 'chr', 'cbl', 'snd']);
    for (const s of game.scenes) for (const f of s.files) if (f) expect(f.toLowerCase(), f).not.toMatch(/\.z0/);
    expect(game.scenes[0].files[11].toLowerCase()).toBe('any1.rec'); // a demo the folder lacks keeps its (renamed) name
    const lst = parseSlideList(files.get('any1.lst')!);
    for (const e of lst) expect(files.has(e.name), e.name).toBe(true);
  });
});
