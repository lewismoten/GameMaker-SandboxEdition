// Game packs (.gmpak): written and read back, and handed out file by file as they arrive.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gzipSync } from 'node:zlib';
import { PackReader, decodePack, encodePack } from '../src/project/gamePack';
import { fetchGameFile, loadHostedGame } from '../src/project/files';
import { streamHostedGame } from '../src/project/streamGame';

const files: [string, Uint8Array][] = [
  ['game.gam', new Uint8Array([1, 2, 3])],
  ['empty.txt', new Uint8Array(0)],
  ['big.map', Uint8Array.from({ length: 70000 }, (_, i) => i & 255)],
];

describe('gamePack', () => {
  it('reads back what it wrote', () => {
    expect(decodePack(encodePack(files))).toEqual(files);
  });

  it('hands out each file as soon as its bytes are in, whatever the chunk sizes', () => {
    const packed = encodePack(files);
    for (const step of [1, 7, 4096, packed.length]) {
      const r = new PackReader();
      const got: [string, Uint8Array][] = [];
      for (let at = 0; at < packed.length; at += step) got.push(...r.push(packed.subarray(at, at + step)));
      expect(got).toEqual(files);
      expect(r.done).toBe(true);
    }
  });

  it('refuses something else', () => {
    expect(() => decodePack(new Uint8Array([1, 2, 3, 4, 5, 6]))).toThrow();
    expect(() => decodePack(encodePack(files).subarray(0, 20))).toThrow(/cut short/);
  });
});

describe('hosted games from their pack', () => {
  afterEach(() => vi.unstubAllGlobals());
  const names = ['g.gam', 'a.map', 'b.bbl'];
  const bytes = (n: string) => new TextEncoder().encode(`${n}!`);
  const packed = gzipSync(encodePack(names.map((n) => [n, bytes(n)])));
  const entry = (id: string) => ({ id, title: id, kind: 'gameware' as const, path: `games/${id}/`, gam: 'g.gam', files: names, gz: true, pack: 'p.gmpak' });

  function serve(pack: boolean) {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls.push(url);
        if (url.endsWith('.gmpak')) return pack ? new Response(packed as Uint8Array<ArrayBuffer>) : new Response('', { status: 404 });
        const name = url.split('/').pop()!.replace(/\.gz$/, '');
        const body = url.endsWith('.gz') ? gzipSync(bytes(name)) : bytes(name);
        return new Response(body as Uint8Array<ArrayBuffer>);
      }),
    );
    return calls;
  }

  it('loads a game in one request', async () => {
    const calls = serve(true);
    const files = await loadHostedGame(entry('one'));
    expect(calls).toEqual(['./games/one/p.gmpak']);
    expect(files.names()).toEqual([...names].sort());
    expect(files.get('a.map')).toEqual(bytes('a.map'));
    // read this session: its single files come from it too
    expect(await fetchGameFile(entry('one'), 'B.BBL')).toEqual(bytes('b.bbl'));
    expect(calls.length).toBe(1);
  });

  it('streams a game from its pack', async () => {
    const calls = serve(true);
    const g = streamHostedGame(entry('two'));
    await g.started;
    await g.done;
    expect(calls).toEqual(['./games/two/p.gmpak']);
    expect(g.files.names()).toEqual([...names].sort());
    expect(g.files.stream).toBeUndefined();
  });

  it('fetches the files one by one when the pack is missing', async () => {
    const calls = serve(false);
    const files = await loadHostedGame(entry('three'));
    expect(files.get('g.gam')).toEqual(bytes('g.gam'));
    expect(calls.filter((c) => c.endsWith('.gz')).length).toBe(3);
    const g = streamHostedGame(entry('four'));
    await g.done;
    expect(g.files.get('b.bbl')).toEqual(bytes('b.bbl'));
  });
});
