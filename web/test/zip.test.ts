// Tests: Reading and writing zip files (project/zip.ts).
import { describe, expect, it } from 'vitest';
import { createZip, readZip, crc32 } from '@lewismoten/gamemaker-sandbox-archives/zip';

describe('zip', () => {
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
});
