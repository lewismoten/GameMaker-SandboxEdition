// Spectral gates must reject bright audio, preserve protected encodings and filter aliases.
import { describe, expect, it } from 'vitest';
import { encodeVoc, decodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import { lowerPcmVoc, vocBandShares } from '@lewismoten/gamemaker-sandbox-tools/kit/vocRate';

const tone = (hz: number) =>
  encodeVoc(
    Float32Array.from({ length: 11025 }, (_, i) => Math.sin((2 * Math.PI * hz * i) / 11025) * 0.7),
    11025,
  );

describe('VOC rate measurement and filtering', () => {
  it('distinguishes low tones from the discarded high band', () => {
    expect(vocBandShares(tone(500), [4000])[0]).toBeLessThan(0.0001);
    expect(vocBandShares(tone(4500), [4000])[0]).toBeGreaterThan(0.99);
  });
  it('suppresses a high tone before reducing its rate, and retains duration', () => {
    const before = decodeVoc(tone(4500));
    const after = decodeVoc(lowerPcmVoc(tone(4500), 8000));
    const rms = Math.sqrt(after.samples.reduce((sum, x) => sum + x * x, 0) / after.samples.length);
    expect(rms).toBeLessThan(0.02);
    expect(Math.abs(after.samples.length / after.sampleRate - before.samples.length / before.sampleRate)).toBeLessThan(1 / after.sampleRate);
    expect(after.sampleRate).toBe(8000);
  });
  it('never raises rates or changes packed or multiblock files', () => {
    const bytes = tone(500);
    expect(lowerPcmVoc(bytes, 22050)).toBe(bytes);
    expect(lowerPcmVoc(bytes, 2000)).toBe(bytes);
    const packed = bytes.slice();
    packed[31] = 1;
    expect(lowerPcmVoc(packed, 8000)).toBe(packed);
    const multi = new Uint8Array(bytes.length + 4);
    multi.set(bytes);
    expect(lowerPcmVoc(multi, 8000)).toBe(multi);
  });
  it('measures short clips and silence without non-finite shares', () => {
    expect(vocBandShares(encodeVoc(new Float32Array(20), 11025), [4000])).toEqual([0]);
    expect(vocBandShares(encodeVoc(Float32Array.of(0, 1, -1), 11025), [4000])[0]).toBeGreaterThan(0);
  });
});
