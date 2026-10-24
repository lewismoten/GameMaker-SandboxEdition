// Unpacking a sent game (unpack.ts): every way in gives the same game, and bad data gives a
// friendly LinkError, never a crash.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createZip } from '../project/zip';
import { encodePack } from '../project/gamePack';
import { encodeGame, scriptJson } from '../export/singlePage';
import { LinkError } from './protocol';
import { unpackGame } from './unpack';

const DISK = join(__dirname, '../../../games/teddy/disk');
const files: [string, Uint8Array][] = readdirSync(DISK).map((n) => [n, new Uint8Array(readFileSync(join(DISK, n)))]);

const gzip = async (b: Uint8Array) =>
  new Uint8Array(await new Response(new Blob([b as BlobPart]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
const reasonOf = (p: Promise<unknown>) =>
  p.then(
    () => 'none',
    (e: unknown) => (e instanceof LinkError ? e.reason : `crash: ${String(e)}`),
  );

describe('unpackGame', () => {
  it('reads the folder’s files as they are', async () => {
    const g = await unpackGame(files);
    expect(g.gam).toBe('teddy.gam');
    expect(g.files.size).toBe(files.length);
    expect(g.title.length).toBeGreaterThan(0);
  });
  it('reads a .zip, a pack and a gzipped pack the same, and drops DOS programs', async () => {
    const zip = await createZip([
      ...files.map(([name, data]) => ({ name: `TEDDY/${name.toUpperCase()}`, data })),
      { name: 'TEDDY/RUN.EXE', data: new Uint8Array([0x4d, 0x5a]) },
    ]);
    const pack = encodePack(files);
    for (const [name, bytes] of [
      ['teddy.zip', zip],
      ['teddy.gmpak', pack],
      ['teddy.gmpak', await gzip(pack)],
    ] as const) {
      const g = await unpackGame([[name, bytes]], { name: 'Teddy' });
      expect(g.files.names()).toEqual(files.map(([n]) => n).sort());
      expect(g.title).toBe('Teddy');
    }
  });
  it('reads a page made by “Export as one web page”', async () => {
    const game = await encodeGame({ id: 'teddy', title: 'Teddy’s Little Big Adventure', gam: 'teddy.gam' }, files);
    const html = `<!doctype html><title>x</title><script type="application/json" id="gm-game">${scriptJson(game)}</script>`;
    const g = await unpackGame([['teddy.html', new TextEncoder().encode(html)]]);
    expect(g.title).toBe('Teddy’s Little Big Adventure');
    expect(g.files.size).toBe(files.length);
    const lying = html.replace(/"files":\[\[/, '"files":[["huge.fli",99999999],[');
    expect(await reasonOf(unpackGame([['teddy.html', new TextEncoder().encode(lying)]]))).toBe('too-big');
  });
  it('turns bad data into plain errors', async () => {
    const zip = await createZip([{ name: 'a.gam', data: new Uint8Array(10) }]);
    expect(await reasonOf(unpackGame([['x.zip', zip.slice(0, zip.length - 30)]]))).toBe('invalid');
    expect(await reasonOf(unpackGame([['x.gmpak', new Uint8Array([0x47, 0x4d, 0x50, 0x4b, 1, 5, 65])]]))).toBe('invalid');
    expect(await reasonOf(unpackGame([['x.gmpak', new Uint8Array([0x1f, 0x8b, 8, 0, 1, 2, 3])]]))).toBe('invalid');
    expect(await reasonOf(unpackGame([['page.html', new TextEncoder().encode('<!doctype html><p>hello')]]))).toBe('no-game');
    expect(await reasonOf(unpackGame([['readme.txt', new Uint8Array(5)]]))).toBe('no-game');
    expect(await reasonOf(unpackGame([['bad.gam', new Uint8Array([1, 2, 3])]]))).toBe('invalid');
    expect(await reasonOf(unpackGame([['bad.gam', crypto.getRandomValues(new Uint8Array(4000))]]))).not.toMatch(/crash/);
  });
  it('stops a zip that unpacks past the limit', async () => {
    const big = new Uint8Array(20 * 1024 * 1024); // zeros: a few KB once deflated
    const zip = await createZip([0, 1, 2].map((i) => ({ name: `z${i}.fli`, data: big })));
    expect(zip.length).toBeLessThan(1024 * 1024);
    expect(await reasonOf(unpackGame([['bomb.zip', zip]]))).toBe('too-big');
  });
});
