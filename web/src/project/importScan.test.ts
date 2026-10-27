// What an import finds: a game folder, a folder of them, zips of games (folders inside,
// several games, zips in zips), any mix of those, and zips or folders with no game.
import { describe, expect, it } from 'vitest';
import { GameReader, groupGames, scanImport, scanSummary, type ScanFile } from './importScan';
import { createZip } from './zip';
import { newGame, serializeGame } from '../formats/game';

const enc = new TextEncoder();
const gam = (title: string) => serializeGame(newGame(title));
const file = (path: string, bytes: Uint8Array = enc.encode(path)): ScanFile => ({ path, size: bytes.length, read: () => Promise.resolve(bytes) });
const zip = async (path: string, entries: [string, Uint8Array][]) => file(path, await createZip(entries.map(([name, data]) => ({ name, data }))));
const game = (dir: string, title: string): [string, Uint8Array][] => [
  [`${dir}${title.toLowerCase()}.gam`, gam(title)],
  [`${dir}${title.toLowerCase()}.pal`, enc.encode('palette')],
  [`${dir}hero.cel`, enc.encode('hero')],
];
/** A self-extracting archive: a DOS program stub, then the zip; `absolute` moves its offsets past the stub, as some packers did. */
async function sfx(entries: [string, Uint8Array][], absolute: boolean): Promise<Uint8Array> {
  const z = await createZip(entries.map(([name, data]) => ({ name, data })));
  const stub = new Uint8Array(1500).fill(0x90);
  stub.set([0x4d, 0x5a]);
  const out = new Uint8Array(stub.length + z.length);
  out.set(stub);
  out.set(z, stub.length);
  if (absolute) {
    const v = new DataView(out.buffer);
    const eocd = out.length - 22;
    const dir = v.getUint32(eocd + 16, true);
    v.setUint32(eocd + 16, dir + stub.length, true);
    for (let p = dir + stub.length, i = 0; i < v.getUint16(eocd + 10, true); i++) {
      v.setUint32(p + 42, v.getUint32(p + 42, true) + stub.length, true);
      p += 46 + v.getUint16(p + 28, true);
    }
  }
  return out;
}
const loose = (entries: [string, Uint8Array][]) => entries.map(([p, b]) => file(p, b));

describe('scanImport', () => {
  it('finds one game folder, every file in it', async () => {
    const given = loose([...game('zark/', 'Zark'), ['zark/notes/readme.txt', enc.encode('hi')], ['zark/play.exe', enc.encode('x')]]);
    const r = await scanImport(given);
    expect(r.games.map((g) => [g.name, g.from, g.fileCount])).toEqual([['Zark', 'zark/', 4]]);
    expect((await new GameReader(given).read(r.games[0])).files.names()).toEqual(['hero.cel', 'readme.txt', 'zark.gam', 'zark.pal']);
  });

  it('gives a single game the files around its folder too, as an import always has', () => {
    const { games, loose: rest } = groupGames(loose([...game('pick/zark/', 'Zark'), ['pick/readme.txt', enc.encode('hi')]]));
    expect(games.map((g) => [g.dir, g.files.length])).toEqual([['pick/zark', 4]]);
    expect(rest).toEqual([]);
  });

  it('finds each game in a folder of game folders, and leaves out the files in none', async () => {
    const given = loose([...game('all/zark/', 'Zark'), ...game('all/glub/', 'Glub'), ['all/readme.txt', enc.encode('hi')]]);
    const r = await scanImport(given);
    expect(r.games.map((g) => [g.name, g.from, g.fileCount])).toEqual([
      ['Glub', 'all/glub/', 3],
      ['Zark', 'all/zark/', 3],
    ]);
    expect(r.loose.map((f) => f.path)).toEqual(['all/readme.txt']);
    const read = await new GameReader(given).read(r.games[1]);
    expect(read.files.names()).toEqual(['hero.cel', 'zark.gam', 'zark.pal']);
  });

  it('finds the games in a folder of zips, with a folder or nested folders inside, and says which had none', async () => {
    const given = [
      await zip('games/zark.zip', game('', 'Zark')),
      await zip('games/glub.zip', game('glub/', 'Glub')),
      await zip('games/deep.zip', game('a/b/deep/', 'Deep')),
      await zip('games/tools.zip', [['tool.txt', enc.encode('no game')]]),
    ];
    const progress: number[] = [];
    const r = await scanImport(given, { onProgress: (done) => progress.push(done) });
    expect(r.games.map((g) => [g.name, g.from, g.fileCount])).toEqual([
      ['Deep', 'games/deep.zip › a/b/deep/', 3],
      ['Glub', 'games/glub.zip › glub/', 3],
      ['Zark', 'games/zark.zip', 3],
    ]);
    expect(r.emptyZips).toEqual([{ path: 'games/tools.zip', held: 'only tool.txt' }]);
    expect(scanSummary(r)).toBe('3 games found, 1 zip had no game');
    expect(progress).toEqual([0, 1, 2, 3, 4]);
    const read = await new GameReader(given).read(r.games[0]);
    expect(read.files.names()).toEqual(['deep.gam', 'deep.pal', 'hero.cel']);
  });

  it('finds several games in one zip, and games in a zip inside a zip', async () => {
    const inner = await createZip(game('', 'Inner').map(([name, data]) => ({ name, data })));
    const given = [await zip('pack.zip', [...game('one/', 'One'), ...game('two/', 'Two'), ['more/inner.zip', inner]])];
    const r = await scanImport(given);
    expect(r.games.map((g) => [g.name, g.from])).toEqual([
      ['Inner', 'pack.zip › more/inner.zip'],
      ['One', 'pack.zip › one/'],
      ['Two', 'pack.zip › two/'],
    ]);
    const reader = new GameReader(given);
    expect((await reader.read(r.games[0])).files.names()).toEqual(['hero.cel', 'inner.gam', 'inner.pal']);
    expect((await reader.read(r.games[2])).files.names()).toEqual(['hero.cel', 'two.gam', 'two.pal']);
  });

  it('takes a mix: a game folder, a folder of them, and zips beside them', async () => {
    const given = [...loose(game('mix/', 'Top')), ...loose(game('mix/more/sub/', 'Sub')), await zip('mix/z.zip', game('z/', 'Zed'))];
    const r = await scanImport(given);
    expect(r.games.map((g) => [g.name, g.from, g.fileCount])).toEqual([
      ['Top', 'mix/', 3],
      ['Sub', 'mix/more/sub/', 3],
      ['Zed', 'mix/z.zip › z/', 3],
    ]);
  });

  it('lists each .gam of a folder as its own game, without the other .gam', async () => {
    const given = loose([...game('g/', 'Beta'), ['g/alpha.gam', gam('Alpha')]]);
    const r = await scanImport(given);
    expect(r.games.map((g) => [g.name, g.gam, g.fileCount, g.leftover])).toEqual([
      ['Alpha', 'alpha.gam', 3, undefined],
      ['Beta', 'beta.gam', 3, undefined],
    ]);
    expect((await new GameReader(given).read(r.games[0])).files.names()).toEqual(['alpha.gam', 'beta.pal', 'hero.cel']);
  });

  it('lists a leftover .gam that no player loads and that lacks its files after the real game, unticked', async () => {
    const player = new Uint8Array(160_598);
    player.set(enc.encode('.Z0G'), 0x256b6);
    const space = newGame('Space');
    space.scenes[0].files = ['SPACE.Z0A', 'SPACE.Z0B', 'SHARED.Z0Q'];
    const given = [
      await zip('zapak.zip', [
        ['SPACE.Z0G', serializeGame(space)],
        ['ZAPAK.EXE', player],
        ['ZAPAK.Z0G', gam('Zapak')],
        ['SHARED.Z0Q', enc.encode('map')],
      ]),
    ];
    const r = await scanImport(given);
    expect(r.games.map((g) => [g.name, g.missing, g.leftover])).toEqual([
      ['Zapak', undefined, undefined],
      ['Space', 2, 'SPACE.GAM: 2 of its files aren’t in the zip; no player loads it'],
    ]);
    const reader = new GameReader(given);
    expect((await reader.read(r.games[0])).files.names()).toEqual(['shared.z0q', 'zapak.z0g']);
    // the leftover keeps the folder's player, to rename its files back by
    const left = await reader.read(r.games[1]);
    expect([left.files.names(), left.players.map((p) => p.name), left.gam]).toEqual([['shared.z0q', 'space.z0g'], ['ZAPAK.EXE'], 'space.gam']);
  });

  it('lists a .gam missing files in a folder of its own, beside a whole game of the same zip, as a leftover', async () => {
    const test = newGame('Title Screen');
    test.scenes[0].files = ['AVTEST.MAP', 'AVTEST.CBL'];
    const broken = newGame('Broken');
    broken.scenes[0].files = ['GONE.MAP'];
    const given = [
      await zip('shorty.zip', [...game('', 'Shorty'), ['TEST/AVTEST.GAM', serializeGame(test)]]),
      // a folder of games is many downloads: one missing files there is not a leftover
      ...loose([...game('more/zark/', 'Zark'), ['more/broken/broken.gam', serializeGame(broken)]]),
    ];
    const r = await scanImport(given);
    expect(r.games.map((g) => [g.name, g.from, g.missing, g.leftover])).toEqual([
      ['Broken', 'more/broken/', 1, undefined],
      ['Zark', 'more/zark/', undefined, undefined],
      ['Shorty', 'shorty.zip', undefined, undefined],
      ['Title Screen', 'shorty.zip › TEST/', 2, 'AVTEST.GAM: 2 of its files aren’t in the zip'],
    ]);
  });

  it('finds each game of a folder whose games share their files, each with its own player, renamed extensions and all', async () => {
    // an Acord Games player asks for .z0g in place of .gam (dosPlayer/renamedExtensions.ts)
    const player = new Uint8Array(160_598);
    player.set(enc.encode('.z0g'), 0x256b6);
    const given = [
      await zip('zapper.zip', [
        ['NEVER.EXE', player],
        ['NEVER.Z0G', gam('Neverwhere 1')],
        ['NEVER1B.EXE', player],
        ['NEVER1B.Z0G', gam('Neverwhere 1B')],
        ['SHARED.Z0Q', enc.encode('map')],
      ]),
    ];
    const r = await scanImport(given);
    expect(r.games.map((g) => [g.name, g.gam, g.fileCount])).toEqual([
      ['Neverwhere 1', 'never.gam', 3],
      ['Neverwhere 1B', 'never1b.gam', 3],
    ]);
    const second = await new GameReader(given).read(r.games[1]);
    expect([second.name, second.gam, second.players.map((p) => p.name)]).toEqual(['Neverwhere 1B', 'never1b.gam', ['NEVER1B.EXE']]);
    expect(second.files.names()).toEqual(['never1b.z0g', 'shared.z0q']);
  });

  it('reads self-extracting .EXEs as zips (offsets counted from the zip or from the file), never running them', async () => {
    for (const absolute of [false, true]) {
      const given = [file('games/zark.exe', await sfx(game('', 'Zark'), absolute)), file('games/tool.exe', new Uint8Array([0x4d, 0x5a, 1, 2, 3]))];
      const r = await scanImport(given);
      expect(r.games.map((g) => [g.name, g.from, g.fileCount])).toEqual([['Zark', 'games/zark.exe', 3]]);
      expect((await new GameReader(given).read(r.games[0])).files.names()).toEqual(['hero.cel', 'zark.gam', 'zark.pal']);
      expect(r.loose.map((f) => f.path)).toEqual(['games/tool.exe']);
    }
  });

  it('keeps one of the same game found twice (a zip with a self-extracting copy of itself), the copy with the most files', async () => {
    const inside = await sfx(game('', 'Yuphex'), false);
    const given = [
      await zip('yuphex.zip', [...game('', 'Yuphex'), ['extra.txt', enc.encode('x')], ['yufex.zip', await createZip([{ name: 'YUFEX.EXE', data: inside }])]]),
    ];
    const r = await scanImport(given);
    expect(r.games.map((g) => [g.name, g.from, g.fileCount, g.alsoIn])).toEqual([
      ['Yuphex', 'yuphex.zip', 4, ['yuphex.zip › yufex.zip › YUFEX.EXE (a self-extracting archive)']],
    ]);
    expect(r.emptyZips).toEqual([]);
    expect(scanSummary(r)).toBe('1 game found, 1 copy of the same game left out');
  });

  it('says what a zip with no game held', async () => {
    const r = await scanImport([
      await zip('docs.zip', [
        ['a.txt', enc.encode('x')],
        ['b.doc', enc.encode('x')],
      ]),
      await zip('pics.zip', [
        ['a.gif', enc.encode('x')],
        ['b.gif', enc.encode('x')],
        ['c.gif', enc.encode('x')],
        ['d.gif', enc.encode('x')],
      ]),
      await zip('sfx.zip', [['SETUP.EXE', await sfx([['readme.txt', enc.encode('x')]], false)]]),
    ]);
    expect(r.emptyZips).toEqual([
      { path: 'docs.zip', held: 'only text files (a.txt, b.doc)' },
      { path: 'pics.zip', held: '4 files, such as a.gif, b.gif, c.gif…' },
      { path: 'sfx.zip › SETUP.EXE (a self-extracting archive)', held: 'only readme.txt' },
      { path: 'sfx.zip', held: 'only SETUP.EXE, a self-extracting archive with no game' },
    ]);
  });

  it('finds nothing in zips with no .gam, damaged zips, or a Mac’s copies', async () => {
    const r = await scanImport([
      await zip('a.zip', [['readme.txt', enc.encode('x')]]),
      await zip('mac.zip', [
        ['__MACOSX/._zark.gam', enc.encode('fork')],
        ['._b.gam', enc.encode('fork')],
      ]),
      file('broken.zip', enc.encode('not a zip')),
    ]);
    expect(r.games).toEqual([]);
    expect(r.emptyZips).toEqual([
      { path: 'a.zip', held: 'only readme.txt' },
      { path: 'mac.zip', held: 'it is empty' },
    ]);
    expect(r.badZips.map((b) => b.path)).toEqual(['broken.zip']);
    expect(r.loose).toEqual([]);
    expect(scanSummary(r)).toBe('0 games found, 2 zips had no game, 1 zip could not be read');
  });

  it('finds nothing in loose files with no .gam, and keeps them for a new game', async () => {
    const r = await scanImport(loose([['hero.gif', enc.encode('gif')]]));
    expect(r.games).toEqual([]);
    expect(r.loose.map((f) => f.path)).toEqual(['hero.gif']);
  });

  it('stops when canceled', async () => {
    const ctl = new AbortController();
    ctl.abort();
    await expect(scanImport([await zip('a.zip', game('', 'A'))], { signal: ctl.signal })).rejects.toThrow();
  });
});
