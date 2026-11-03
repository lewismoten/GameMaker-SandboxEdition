// hostedZip's check for the CD's own player: it must agree with adoptPlayer's md5 test, or a hand-edited player would be missed.
import { existsSync, readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createZip } from '@lewismoten/gamemaker-sandbox-archives/project/zip';
import { peekGameFile } from './files';
import { onlyStockPlayers } from './hostedZip';

const path = new URL('../../../cd/gm/xferplay.exe', import.meta.url);
const stock = existsSync(path) ? new Uint8Array(readFileSync(path)) : undefined;

describe('onlyStockPlayers', () => {
  it.skipIf(!stock)('accepts the CD player and nothing else of its size', async () => {
    expect(await onlyStockPlayers([{ bytes: stock! }])).toBe(true);
    const edited = stock!.slice();
    edited[1000] ^= 1;
    expect(await onlyStockPlayers([{ bytes: stock! }, { bytes: edited }])).toBe(false);
  });
  it('ignores programs that are not the size of a player', async () => {
    expect(await onlyStockPlayers([{ bytes: new Uint8Array(100) }])).toBe(true);
  });
});

describe('peekGameFile', () => {
  const entry = { path: 'games/x/', files: ['x.gam'], gz: false, pack: 'x.zip' } as unknown as Parameters<typeof peekGameFile>[0];
  const serve = async (names: string[]) => {
    const edited = new Uint8Array(160_598).fill(7); // a player that is not the CD's own
    const zip = await createZip([...names.map((name) => ({ name, data: new Uint8Array([1, 2, 3]) })), { name: 'x.exe', data: edited }]);
    const fetchMock = vi.fn(() => Promise.resolve(new Response(zip as unknown as BodyInit)));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  };
  afterEach(() => vi.unstubAllGlobals());

  it('reads the .gam as stored, with one request and without reading the player', async () => {
    const fetchMock = await serve(['x.gam']);
    expect([...(await peekGameFile(entry, 'x.gam', './a/'))!]).toEqual([1, 2, 3]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to the reading path when the zip has no such file (extensions renamed)', async () => {
    const fetchMock = await serve(['x.abc']);
    expect(await peekGameFile(entry, 'x.gam', './b/')).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1); // the fallback reused the zip already fetched
  });

  it('inflates a zip once for many files', async () => {
    const fetchMock = await serve(['x.gam', 'x.bkd']);
    const a = await peekGameFile(entry, 'x.gam', './c/');
    const b = await peekGameFile(entry, 'x.bkd', './c/');
    expect([...a!]).toEqual([1, 2, 3]);
    expect([...b!]).toEqual([1, 2, 3]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
