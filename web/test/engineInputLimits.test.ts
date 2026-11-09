// Crafted tiny files that would otherwise make the decoders allocate gigabytes.
import { describe, expect, it } from 'vitest';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { decodePartialGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gifProgressive';
import { decodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';

// 65535 x 65535 image header with a few bytes of LZW data (the review's 38-byte repro, shortened).
const hugeGif = Uint8Array.from([
  ...Buffer.from('GIF89a'), 1, 0, 1, 0, 0, 0, 0, 0x2c, 0, 0, 0, 0, 0xff, 0xff, 0xff, 0xff, 0, 2, 2, 0x44, 1, 0,
]);

// A VOC of many silence blocks, each 65536 samples, repeated by a repeat block.
function silenceVoc(blocks: number): Uint8Array {
  const out: number[] = [...Buffer.from('Creative Voice File\x1a'), 0x1a, 0, 0x0a, 0x01, 0x29, 0x11];
  for (let i = 0; i < blocks; i++) out.push(3, 3, 0, 0, 0xff, 0xff, 0x83);
  out.push(0);
  return Uint8Array.from(out);
}

describe('input limits', () => {
  it('refuses a GIF whose size would allocate gigabytes', () => {
    expect(() => decodeGif(hugeGif)).toThrow(/too large/);
    expect(() => decodePartialGif(hugeGif)).toThrow(/too large/);
  });
  it('refuses a VOC whose silence blocks add up to hours', () => {
    expect(() => decodeVoc(silenceVoc(1000))).toThrow(/too long/);
  });
  it('still decodes a short VOC with silence', () => {
    expect(decodeVoc(silenceVoc(2)).samples.length).toBe(2 * 65536);
  });
});
