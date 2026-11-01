import { describe, expect, it } from 'vitest';
import { encodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import { VOC_MAX_BYTES, VOC_MAX_SAMPLES, vocBytesFor, vocTooBig } from './vocLimit';

describe('VOC size limit', () => {
  it('matches the encoder byte for byte', () => {
    for (const n of [0, 1, 1000, VOC_MAX_SAMPLES]) expect(encodeVoc(new Float32Array(n)).length).toBe(vocBytesFor(n));
  });
  it('the most samples just fit and one more does not', () => {
    expect(encodeVoc(new Float32Array(VOC_MAX_SAMPLES)).length).toBe(VOC_MAX_BYTES);
    expect(vocTooBig(vocBytesFor(VOC_MAX_SAMPLES))).toBe(false);
    expect(vocTooBig(vocBytesFor(VOC_MAX_SAMPLES + 1))).toBe(true);
  });
});
