// ZIP-only hosting: one shared request, native DOS names, independent edits and bounded failures.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { fetchGameFile, loadHostedGame } from '../src/project/files';
import { streamHostedGame } from '../src/project/streamGame';

const entry = (id: string) => ({
  id,
  title: 'ZIP fixture',
  kind: 'gameware' as const,
  path: `games/${id}/`,
  gam: 'demo.gam',
  files: ['demo.gam', 'a_j.bkd'],
  pack: 'demo.zip',
});
const gam = Uint8Array.of(1, 2, 3);
const bkd = Uint8Array.of(4, 5, 6);
const zip = () =>
  createZip([
    { name: 'DEMO.GAM', data: gam, store: true },
    { name: 'A-J.BKD', data: bkd, store: true },
  ]);
function serve(bytes: Uint8Array, status = 200) {
  const fetch = vi.fn(async (_url: string) => new Response(bytes as Uint8Array<ArrayBuffer>, { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

afterEach(() => vi.unstubAllGlobals());

describe('hosted DOS ZIPs', () => {
  it('shares one archive request across individual reads and independent editable copies', async () => {
    const fetch = serve(await zip());
    const e = entry('zip-shared');
    const [first, second, one] = await Promise.all([loadHostedGame(e), loadHostedGame(e), fetchGameFile(e, 'A-J.BKD')]);
    expect(first.names()).toEqual(['a_j.bkd', 'demo.gam']);
    expect(first.get('A-J.BKD')).toEqual(bkd);
    first.get('demo.gam')![0] = 99;
    expect(second.get('demo.gam')).toEqual(gam);
    expect(one).toEqual(bkd);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe('./games/zip-shared/demo.zip');
  });

  it('starts play only after extraction and supplies files to streaming copies', async () => {
    const fetch = serve(await zip());
    const game = streamHostedGame(entry('zip-play'), './', 4, 1);
    const copy = game.files.copy();
    copy.set('demo.gam', Uint8Array.of(9));
    await copy.stream!.need(['a_j.bkd']);
    await game.started;
    await game.done;
    expect(game.files.get('demo.gam')).toEqual(gam);
    expect(game.files.stream).toBeUndefined();
    expect(copy.get('demo.gam')).toEqual(Uint8Array.of(9));
    expect(copy.get('a_j.bkd')).toEqual(bkd);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('reports a missing archive without fanning out into loose-file requests', async () => {
    const fetch = serve(Uint8Array.of(), 404);
    await expect(loadHostedGame(entry('zip-missing'))).rejects.toThrow('Could not load the game archive');
    expect(await fetchGameFile(entry('zip-missing-file'), 'demo.gam')).toBeUndefined();
    await expect(streamHostedGame(entry('zip-missing-play')).started).rejects.toThrow('Could not load the game archive');
    expect(fetch.mock.calls.every(([url]) => String(url).endsWith('/demo.zip'))).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('rejects damaged or incomplete ZIPs instead of silently opening a partial project', async () => {
    const fetch = serve(Uint8Array.of(1, 2, 3));
    await expect(loadHostedGame(entry('zip-damaged'))).rejects.toThrow('Could not load the game archive');
    fetch.mockResolvedValue(new Response((await createZip([{ name: 'DEMO.GAM', data: gam, store: true }])) as Uint8Array<ArrayBuffer>));
    await expect(loadHostedGame(entry('zip-incomplete'))).rejects.toThrow('Could not load the game archive');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
