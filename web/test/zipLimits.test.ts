// Zips with no limits given get safe defaults; zips inside zips share one byte budget.
import { describe, expect, it } from 'vitest';
import { createZip, listZip, readZip, DEFAULT_ZIP_LIMITS } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { scanImport } from '@lewismoten/gamemaker-sandbox-archives/project/importScan';

/** A zip whose directory claims `claim` bytes for its one file. */
async function liar(claim: number): Promise<Uint8Array> {
  const z = await createZip([{ name: 'a.bin', data: new Uint8Array(65536) }]);
  const v = new DataView(z.buffer, z.byteOffset, z.byteLength);
  for (let i = z.length - 22; i >= 0; i--)
    if (v.getUint32(i, true) === 0x06054b50) {
      v.setUint32(v.getUint32(i + 16, true) + 24, claim, true);
      return z;
    }
  throw new Error('no directory');
}

function noise(n: number): Uint8Array {
  const out = new Uint8Array(n);
  let s = 12345;
  for (let i = 0; i < n; i++) out[i] = (s = (s * 1103515245 + 12345) & 0x7fffffff) >> 16;
  return out;
}

describe('zip default limits', () => {
  it('refuses a directory that claims more than the default byte cap', async () => {
    const z = await liar(DEFAULT_ZIP_LIMITS.maxBytes + 1);
    expect(() => listZip(z)).toThrow(/unpacks to more than/);
    await expect(readZip(z)).rejects.toThrow(/unpacks to more than/);
  });
  it('refuses a file that inflates past what its directory says', async () => {
    const z = await liar(10);
    await expect(readZip(z)).rejects.toThrow(/bigger than its directory says/);
  });
  it('still reads an ordinary zip with no limits given', async () => {
    const z = await createZip([{ name: 'a.txt', data: new TextEncoder().encode('hello') }]);
    expect((await readZip(z))[0].data.length).toBe(5);
  });
});

describe('nested scan budget', () => {
  it('counts zips inside zips against one total', async () => {
    const inner = () => createZip([{ name: 'f.bin', data: noise(1000) }]);
    const outer = await createZip([
      { name: 'one.zip', data: await inner() },
      { name: 'two.zip', data: await inner() },
    ]);
    const run = (maxBytes: number) =>
      scanImport([{ path: 'o.zip', size: outer.length, read: async () => outer }], { zipLimits: { maxEntries: 100, maxBytes } });
    // Each zip alone fits under 3000; together (outer ~2200, then each inner 1000) they do not.
    expect((await run(1 << 20)).badZips).toEqual([]);
    const tight = await run(3000);
    expect(tight.badZips.length).toBeGreaterThan(0);
    expect(tight.badZips[0].error).toMatch(/in all/);
  });
});
