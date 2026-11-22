// Tests: Reading and writing zip files (the archives package).
import { describe, expect, it } from 'vitest';
import { createZip, listZip, readZip, isZip, crc32 } from '@lewismoten/gamemaker-sandbox-archives/zip';

describe('zip', () => {
  it('recognizes an empty archive', async () => {
    const bytes = await createZip([]);
    expect(isZip(bytes)).toBe(true);
    expect(await readZip(bytes)).toEqual([]);
  });

  it('reads the real directory when the comment contains an empty ZIP end record', async () => {
    const entries = [{ name: 'LEVEL.GAM', data: Uint8Array.of(42) }];
    const zip = await createZip(entries);
    const comment = await createZip([]);
    const bytes = new Uint8Array(zip.length + comment.length);
    bytes.set(zip);
    bytes.set(comment, zip.length);
    new DataView(bytes.buffer).setUint16(zip.length - 2, comment.length, true);
    expect(listZip(bytes).map((entry) => entry.name)).toEqual(['LEVEL.GAM']);
    expect(await readZip(bytes)).toEqual(entries);
  });

  it('reads a game ZIP after a complete empty ZIP', async () => {
    const entries = [{ name: 'LEVEL.GAM', data: Uint8Array.of(42) }];
    const prefix = await createZip([]);
    const game = await createZip(entries);
    const bytes = new Uint8Array(prefix.length + game.length);
    bytes.set(prefix);
    bytes.set(game, prefix.length);
    expect(await readZip(bytes)).toEqual(entries);
  });

  it('reports a truncated archive comment', async () => {
    const zip = await createZip([]);
    new DataView(zip.buffer, zip.byteOffset).setUint16(zip.length - 2, 10, true);
    await expect(readZip(zip)).rejects.toThrow(/truncated ZIP archive comment/i);
  });

  it('computes CRC-32', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('writes both classic ZIP counts at 65,535 entries and rejects 65,536', async () => {
    const data = new Uint8Array();
    const entries = Array.from({ length: 65535 }, (_, i) => ({ name: String(i), data }));
    const zip = await createZip(entries);
    const endRecord = new DataView(zip.buffer, zip.byteOffset + zip.length - 22);
    expect(endRecord.getUint16(8, true)).toBe(65535); // Entries on this disk
    expect(endRecord.getUint16(10, true)).toBe(65535); // Total entries

    entries.push({ name: 'overflow', data });
    await expect(createZip(entries)).rejects.toThrow(/too many entries/i);
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
