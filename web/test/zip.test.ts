import { describe, expect, it } from 'vitest';
import { createZip, readZip, crc32 } from '../src/project/zip';

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
});
