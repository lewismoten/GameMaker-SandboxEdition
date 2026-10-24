import { afterEach, describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseGame } from '../formats/game';
import { normalize } from '../project/files';
import { loadListedGame } from './load';

// One of this project's games, served as an old DOS folder would be: every name in upper case.
const DISK = resolve(__dirname, '../../../games/maximus/disk');
const FOLDER = 'https://example.com/old/MAXIMUS/';

function serveFolder(): void {
  const files = new Map(readdirSync(DISK).map((f) => [f.toUpperCase(), readFileSync(resolve(DISK, f))]));
  vi.stubGlobal('fetch', (input: string | URL) => {
    const url = new URL(String(input));
    const name = decodeURIComponent(url.pathname.slice(new URL(FOLDER).pathname.length));
    const bytes = url.href.startsWith(FOLDER) ? files.get(name) : undefined;
    return Promise.resolve(bytes ? new Response(new Uint8Array(bytes)) : new Response('not found', { status: 404 }));
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('loadListedGame', () => {
  it('finds the .gam by the folder’s name and every file it names, whatever their case', async () => {
    serveFolder();
    const { gam, entries } = await loadListedGame({ id: 'maximus', title: 'Maximus', folder: FOLDER });
    expect(gam).toBe('maximus.gam');
    const names = new Set(entries.map(([n]) => n));
    const game = parseGame(readFileSync(resolve(DISK, 'maximus.gam')));
    const named = game.scenes.flatMap((s) => s.files.filter(Boolean).map((f) => normalize(f)));
    expect(named.length).toBeGreaterThan(10);
    for (const f of named) expect(names, f).toContain(f);
    // and the files those name: the sound set's sounds, the slide lists' pictures
    expect(names).toContain('boom.voc');
    expect(names).toContain('story1.gif');
    for (const [n, b] of entries) expect(Buffer.compare(b, readFileSync(resolve(DISK, n))), n).toBe(0);
  });

  it('adds the list’s extra files, and says what to do when no .gam is found', async () => {
    serveFolder();
    const { entries } = await loadListedGame({ id: 'maximus', title: 'Maximus', folder: FOLDER, gam: 'MAXIMUS.GAM', files: ['readme.txt', 'nothere.txt'] });
    expect(entries.map(([n]) => n)).toContain('readme.txt');
    await expect(loadListedGame({ id: 'other', title: 'Other', folder: 'https://example.com/old/OTHER/' })).rejects.toThrow(
      'No game file (.gam) was found in https://example.com/old/OTHER/. Name it',
    );
  });
});
