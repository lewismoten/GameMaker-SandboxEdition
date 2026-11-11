// Header-only inputs must be rejected before coefficient allocation.
import { expect, it } from 'vitest';
import { decodePartialJpeg } from '@lewismoten/gamemaker-sandbox-engine/formats/jpeg';

function header(width: number, height: number, sampling = 0x11, components = 1): Uint8Array {
  return new Uint8Array([
    255,
    216,
    255,
    192,
    0,
    8 + 3 * components,
    8,
    height >> 8,
    height & 255,
    width >> 8,
    width & 255,
    components,
    ...Array.from({ length: components }, (_, i) => [i + 1, sampling, 0]).flat(),
  ]);
}
it('rejects the 65535-square JPEG header before requesting its coefficient buffer', () => {
  expect(() => decodePartialJpeg(header(65535, 65535))).toThrow(/too large/);
});
it('bounds aggregate JPEG working memory and rejects invalid component sampling', () => {
  expect(() => decodePartialJpeg(header(4096, 4096, 0x11, 3))).toThrow(/working memory/);
  for (const sampling of [0, 0x01, 0x10, 0x51]) expect(() => decodePartialJpeg(header(1, 1, sampling))).toThrow(/component/);
  expect(() => decodePartialJpeg(header(1, 1, 0x11, 2))).toThrow(/components/);
  expect(decodePartialJpeg(header(1, 1))?.pixels.length).toBe(1);
});
