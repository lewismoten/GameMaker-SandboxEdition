// The web player download: the page with this game's folder (DOS names) and a games.json listing it.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameFiles } from '../project/files';
import { readZip } from '../project/zip';
import { exportWebPlayer, playerGameList } from './exportWebPlayer';

const page = '<!doctype html><title>Game-Maker web player</title><p>“player”</p>';

describe('the web player download', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lists the game in its folder', () => {
    expect(JSON.parse(playerGameList({ title: 'Nebula’s Patrol', gam: 'nebula.gam', year: 1995 }, 'nebula'))).toEqual({
      title: 'Nebula’s Patrol',
      games: [{ title: 'Nebula’s Patrol', folder: 'nebula/', gam: 'NEBULA.GAM', year: 1995 }],
    });
  });

  it('zips the page as index.html beside the game’s folder, without its saves or editor notes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(page)),
    );
    const files = new GameFiles([
      ['nebula.gam', new Uint8Array([1])],
      ['space.map', new Uint8Array([2])],
      ['game1.sav', new Uint8Array([3])],
      ['nebula.gmx', new Uint8Array([4])],
    ]);
    const { name, zip } = await exportWebPlayer(files, { title: 'Nebula', gam: 'nebula.gam', appBase: 'https://example.com/' });
    expect(name).toBe('nebula-web-player.zip');
    const entries = await readZip(zip);
    expect(entries.map((e) => e.name).sort()).toEqual(['LICENSE.txt', 'README.txt', 'games.json', 'index.html', 'nebula/NEBULA.GAM', 'nebula/SPACE.MAP']);
    expect(new TextDecoder().decode(entries.find((e) => e.name === 'index.html')!.data)).toBe(page);
  });
});
