import { describe, expect, it } from 'vitest';
import { decodeVoc, encodeVoc } from '../src/formats/voc';
import { CMF_GAMEMAKER_CLOCK, encodeCmf, parseCmf } from '../src/formats/cmf';
import { applyFliFrame, encodeFli, newFliCanvas, parseFli } from '../src/formats/fli';

describe('encoders', () => {
  it('writes VOC files the decoder reads back', () => {
    const samples = Float32Array.from({ length: 2000 }, (_, i) => Math.sin(i / 5) * 0.8);
    const voc = decodeVoc(encodeVoc(samples, 11025));
    expect(voc.samples.length).toBe(samples.length);
    expect(Math.abs(voc.sampleRate - 11025)).toBeLessThan(150);
    for (let i = 0; i < samples.length; i += 97) expect(Math.abs(voc.samples[i] - samples[i])).toBeLessThan(0.02);
  });

  it('writes CMF songs at Game-Maker\'s clock', () => {
    const inst = Uint8Array.from({ length: 16 }, (_, i) => i);
    const bytes = encodeCmf({ instruments: [inst], events: [{ tick: 0, data: [0x90, 60, 100] }, { tick: 300, data: [0x80, 60, 0] }] });
    const cmf = parseCmf(bytes);
    expect(cmf.clockTicks).toBe(CMF_GAMEMAKER_CLOCK);
    expect([...cmf.instruments[0]]).toEqual([...inst]);
    expect(cmf.channelUsed[0]).toBe(1);
    // delta 0, note on; delta 300 (varlen 0x82 0x2c), note off; end of track
    expect([...cmf.music]).toEqual([0, 0x90, 60, 100, 0x82, 0x2c, 0x80, 60, 0, 0, 0xff, 0x2f, 0]);
  });

  it('writes FLI animations frame for frame', () => {
    const frames = [0, 1, 2].map((f) => Uint8Array.from({ length: 320 * 200 }, (_, i) => ((i % 320) >> 4) * 3 + f + (((i / 320) | 0) % 7 === 0 ? 9 : 0)));
    const pal = Uint8Array.from({ length: 768 }, (_, i) => i & 63);
    const anim = parseFli(encodeFli(frames, pal, { speed: 4 }));
    expect(anim.frameCount).toBe(3);
    expect(anim.speed).toBe(4);
    const c = newFliCanvas(anim);
    frames.forEach((f, n) => {
      applyFliFrame(anim, n, c);
      expect(Buffer.compare(Buffer.from(c.pixels), Buffer.from(f))).toBe(0);
    });
    expect([...c.palette]).toEqual([...pal]);
  });
});
