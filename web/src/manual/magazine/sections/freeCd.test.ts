// The free CD page: the disc leads to the original source release, every game it lists is in
// cd/ or games/, and its library counts are what cd/ holds.
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cdCatalog } from '../../../../scripts/cdGames';
import { magContext, magGames } from '../games';
import { linksIn } from '../inline';
import type { Block } from '../types';
import { CD_LIBRARY, DISC_GO, DISC_NAME, FREE_CD, ORIGINAL_REPO } from './freeCd';
import { COVER } from './cover';

const repo = join(__dirname, '../../../../..');
const cd = join(repo, 'cd');
const ctx = magContext(magGames(cdCatalog(cd)));

/** Every file under a folder, recursively. */
const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [f]));
const dirs = (dir: string) => readdirSync(dir).filter((f) => statSync(join(dir, f)).isDirectory());

/** Every block, nested ones too. */
const flat = (list: Block[]): Block[] =>
  list.flatMap((b) => [b, ...(b.t === 'cols' || b.t === 'side' ? flat(b.blocks) : b.t === 'grid' ? flat(b.cells.flat()) : [])]);

describe('the free CD', async () => {
  const [page] = await FREE_CD.pages(ctx);
  const blocks = flat(page.blocks);

  it('is a disc that opens the original 2014 source release in a new tab', async () => {
    expect(ORIGINAL_REPO).toBe('https://github.com/gandrewstone/GameMaker');
    expect(DISC_GO).toBe(`go:url/${ORIGINAL_REPO}`);
    expect(DISC_NAME).toMatch(/new tab/);
    const [cover] = await COVER.pages(ctx);
    const discs = [...blocks, ...flat(cover.blocks)].filter((b) => b.t === 'disc');
    expect(discs.length).toBe(2);
    for (const d of discs) expect(d.t === 'disc' && d.go).toBe(DISC_GO);
  });

  it('lists only games that are on the disc', () => {
    const text = blocks.flatMap((b) => (b.t === 'p' ? [b.text] : b.t === 'list' ? b.items : []));
    const ids = text.flatMap(linksIn).flatMap((go) => (go.startsWith('go:play/') ? [go.slice(8)] : []));
    const gameware = ctx.games.filter((g) => g.kind === 'gameware');
    const shareware = ctx.games.filter((g) => g.kind === 'shareware');
    expect(gameware.length).toBeGreaterThan(10);
    expect(shareware.length).toBeGreaterThan(10);
    for (const g of [...gameware, ...shareware]) expect(ids, g.title).toContain(g.id);
    const inCd = new Set([...dirs(join(cd, 'gameware')), ...dirs(join(cd, 'sharware'))]);
    const inGames = new Set(dirs(join(repo, 'games')));
    for (const id of ids) expect(inCd.has(id) || inGames.has(id), id).toBe(true);
  });

  it('counts the original CD’s libraries truly', () => {
    const ext = (dir: string, e: RegExp) => files(join(cd, dir)).filter((f) => e.test(f)).length;
    expect(ext('picture', /\.gif$/i)).toBeGreaterThan(CD_LIBRARY.pictures);
    expect(dirs(join(cd, 'picture')).length).toBe(CD_LIBRARY.subjects);
    expect(ext('sound', /\.voc$/i)).toBe(CD_LIBRARY.sounds);
    expect(ext('music', /\.cmf$/i)).toBe(CD_LIBRARY.songs);
    expect(ext('animate', /\.fli$/i)).toBe(CD_LIBRARY.animations);
    for (const f of ['code', 'cd/gm', 'cd/sharware', 'runtime/run/GM', 'games']) expect(statSync(join(repo, f)).isDirectory(), f).toBe(true);
    expect(readdirSync(cd)).toContain('install.exe');
  });
});
