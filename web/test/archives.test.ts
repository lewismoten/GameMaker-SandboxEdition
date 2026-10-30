// Portable game import across folders, nested archives, and both SFX offset conventions.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { applyPlayerPatches } from '@lewismoten/gamemaker-sandbox-archives/player/applyPatches';
import { unpackGame, unpackGames, createZip, type ScanFile } from '@lewismoten/gamemaker-sandbox-archives';
import { encodePack } from '@lewismoten/gamemaker-sandbox-archives/pack';
import { serializeGame, newGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
const gam = (name = 'Archive') => serializeGame(newGame(name));
const files = (name = 'stripe'): [string, Uint8Array][] => [
  [`${name}.gam`, gam(name)],
  ['help.txt', new TextEncoder().encode('Hello')],
];
const zip = (entries = files()) =>
  createZip(
    entries.map(([name, data]) => ({ name, data })),
    new Date(2000, 0, 1, 12),
  );
const input = (path: string, data: Uint8Array): ScanFile => ({ path, size: data.length, read: () => Promise.resolve(data) });
async function sfx(absolute: boolean) {
  const z = await zip(),
    stub = new Uint8Array(1024);
  stub.set([0x4d, 0x5a]);
  const out = new Uint8Array(stub.length + z.length);
  out.set(stub);
  out.set(z, stub.length);
  if (absolute) {
    const v = new DataView(out.buffer),
      end = out.length - 22,
      dir = v.getUint32(end + 16, true);
    v.setUint32(end + 16, dir + stub.length, true);
    for (let p = dir + stub.length, i = 0; i < v.getUint16(end + 10, true); i++) {
      v.setUint32(p + 42, v.getUint32(p + 42, true) + stub.length, true);
      p += 46 + v.getUint16(p + 28, true);
    }
  }
  return out;
}
describe('portable game archives', () => {
  it('round-trips game folders, File selections, and ZIP bytes', async () => {
    for (const source of [files().map(([n, b]) => input('folder/' + n, b)), files().map(([n, b]) => new File([b as BlobPart], n)), await zip()]) {
      const result = await unpackGame(source);
      expect(result.gam).toBe('stripe.gam');
      expect(new Map(result.entries).get('stripe.gam')).toEqual(gam('stripe'));
      expect(result.entries.map(([n]) => n)).toEqual(['help.txt', 'stripe.gam']);
    }
    expect((await unpackGame(await zip(), { name: 'download' })).gam).toBe('stripe.gam');
  });
  it('reads SFX relative/absolute offsets, including EXEs inside ZIPs', async () => {
    for (const absolute of [false, true]) {
      const exe = await sfx(absolute);
      expect((await unpackGame(exe)).gam).toBe('stripe.gam');
      expect((await unpackGame(await zip([['inner.exe', exe]]))).gam).toBe('stripe.gam');
    }
  });
  it('reads ZIPs inside SFX files and nested ZIPs', async () => {
    const inner = await zip(),
      outer = await zip([['inner.zip', inner]]);
    expect((await unpackGame(outer)).gam).toBe('stripe.gam');
    const stub = new Uint8Array(512);
    stub.set([77, 90]);
    const exe = new Uint8Array(stub.length + outer.length);
    exe.set(stub);
    exe.set(outer, stub.length);
    expect((await unpackGame(exe)).gam).toBe('stripe.gam');
  });
  it('makes multiple games an explicit choice', async () => {
    const bytes = await zip([
      ['a/alpha.gam', gam('Alpha')],
      ['b/beta.gam', gam('Beta')],
    ]);
    expect((await unpackGames(bytes)).map((g) => g.gam)).toEqual(['alpha.gam', 'beta.gam']);
    await expect(unpackGame(bytes)).rejects.toThrow('2 games');
  });
  it('supports existing raw and gzip game packs', async () => {
    const pack = encodePack(files());
    expect((await unpackGame(pack)).gam).toBe('stripe.gam');
    const gzip = new Uint8Array(await new Response(new Blob([pack as BlobPart]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
    expect((await unpackGame(gzip)).gam).toBe('stripe.gam');
  });
  it('recovers game filenames from a customized DOS player inside a ZIP', async () => {
    const stock = new Uint8Array(readFileSync(new URL('../../cd/gm/xferplay.exe', import.meta.url)));
    const exe = applyPlayerPatches(stock, { 'file.ext.gam': 'zzz' });
    const game = await unpackGame(
      await zip([
        ['stripe.exe', exe],
        ['stripe.zzz', gam('stripe')],
      ]),
    );
    expect(game.gam).toBe('stripe.gam');
    expect(new Map(game.entries).get('stripe.gam')).toEqual(gam('stripe'));
    expect(game.player?.exe).toBe('STRIPE.EXE');
    expect(game.entries.some(([name]) => /\.exe$/i.test(name))).toBe(false);
  });
  it('reports damaged archives, ordinary EXEs, limits and cancellation', async () => {
    await expect(unpackGame(Uint8Array.of(77, 90, 0, 0))).rejects.toThrow('No Game-Maker');
    await expect(unpackGame(Uint8Array.of(80, 75, 3, 4))).rejects.toThrow();
    await expect(unpackGame(await zip(), { maxEntries: 1 })).rejects.toThrow('more than 1');
    await expect(unpackGame(await zip(), { maxBytes: 8 })).rejects.toThrow('byte limit');
    const controller = new AbortController();
    controller.abort();
    await expect(unpackGame(await zip(), { signal: controller.signal })).rejects.toThrow();
  });
});
