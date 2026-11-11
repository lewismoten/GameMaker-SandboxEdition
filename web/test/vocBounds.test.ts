// VOC block-9 format checks decode bytes only; no audio context or playback is created.
import { expect, it } from 'vitest';
import { decodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
function voc(channels: number, bits = 8, codec = 0, rate = 8000, data = [0, 128, 255, 128]): Uint8Array {
  const bytes = new Uint8Array(26 + 4 + 12 + data.length + 1);
  bytes.set(new TextEncoder().encode('Creative Voice File\x1a'));
  const v = new DataView(bytes.buffer);
  v.setUint16(20, 26, true);
  bytes[26] = 9;
  bytes[27] = 12 + data.length;
  v.setUint32(30, rate, true);
  bytes[34] = bits;
  bytes[35] = channels;
  v.setUint16(36, codec, true);
  bytes.set(data, 42);
  return bytes;
}
it('rejects stereo VOC instead of decoding twice as many mono frames', () => {
  expect(() => decodeVoc(voc(2))).toThrow(/mono PCM/);
  expect(decodeVoc(voc(1)).samples).toHaveLength(4);
  expect(decodeVoc(voc(1, 16, 4)).samples).toHaveLength(2);
});
it('validates VOC block-9 codec, rate, size and complete PCM samples', () => {
  for (const input of [voc(1, 8, 4), voc(1, 16, 0), voc(1, 8, 0, 0), voc(0), voc(1, 16, 4, 8000, [1])]) expect(() => decodeVoc(input)).toThrow(/VOC/);
  expect(() => decodeVoc(voc(1).subarray(0, 40))).toThrow(/Truncated/);
});
