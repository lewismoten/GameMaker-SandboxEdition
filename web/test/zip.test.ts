// Tests: Reading and writing zip files (the archives package).
import { describe, expect, it } from 'vitest';
import { createZip, readZip, crc32 } from '@lewismoten/gamemaker-sandbox-archives/zip';

describe('zip', () => {
  it('computes CRC-32', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('round-trips stored and deflated entries', async () => {
    const big = new Uint8Array(5000).map((_, i) => i % 7);
    const entries = [
      { name: 'a.txt', data: new TextEncoder().encode('hi') },
      { name: 'game/big.bin', data: big },
    ];
    const zip = await createZip(entries);
    expect(zip.length).toBeLessThan(big.length);
    const back = await readZip(zip);
    expect(back.map((e) => e.name)).toEqual(['a.txt', 'game/big.bin']);
    expect(Buffer.compare(back[1].data, big)).toBe(0);
    expect(new TextDecoder().decode(back[0].data)).toBe('hi');
  });

  it.each([true, false])('rejects a CRC mismatch (store=%s)', async (store) => {
    const name = 'game/level.map';
    const zip = await createZip([{ name, data: new Uint8Array(256).fill(42), store }]);
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    expect(view.getUint16(8, true)).toBe(store ? 0 : 8);
    if (store) zip[30 + name.length] ^= 1;
    else {
      // Keep the deflate stream valid so only the CRC check can detect the mismatch.
      const directory = view.getUint32(zip.length - 6, true);
      zip[directory + 16] ^= 1;
    }
    await expect(readZip(zip)).rejects.toThrow('The ZIP entry game/level.map is damaged (CRC-32 mismatch)');
  });
});
