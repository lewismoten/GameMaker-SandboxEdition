// CRC-32 stays correct after the faster rewrite, and a large entry's check hands control back to the event loop.
import { describe, expect, it } from 'vitest';
import { createZip, crc32, listZip } from '@lewismoten/gamemaker-sandbox-archives/zip';

describe('zip CRC-32', () => {
  it('matches the standard check value and is chunk-size independent', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
    const d = Uint8Array.from({ length: 1003 }, (_, i) => (i * 7) & 255);
    let c = 0xffffffff;
    for (const b of d) c = ((c >>> 8) ^ [...Array(8)].reduce((x: number) => (x & 1 ? 0xedb88320 ^ (x >>> 1) : x >>> 1), (c ^ b) & 0xff)) >>> 0;
    expect(crc32(d)).toBe((c ^ 0xffffffff) >>> 0);
  });

  it('verifies a large entry in slices that let timers run, and still catches damage', async () => {
    const big = Uint8Array.from({ length: 6 << 20 }, (_, i) => (i * 31) & 255);
    const zip = await createZip([{ name: 'BIG.BIN', data: big, store: true }]);
    const entry = listZip(zip)[0];
    let ticks = 0;
    const timer = setInterval(() => ticks++, 0);
    const data = await entry.read();
    clearInterval(timer);
    expect(data!.length).toBe(big.length);
    expect(ticks).toBeGreaterThanOrEqual(3); // yielded between 1 MiB slices
    zip[100 + 5000] ^= 1;
    await expect(listZip(zip)[0].read()).rejects.toThrow(/CRC-32/);
  });
});
