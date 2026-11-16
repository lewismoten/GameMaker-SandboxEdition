// The figures use real DOS bytes. Check ZIP recovery and the delta's retained pixels.
import { describe, expect, it } from 'vitest';
import { createZip, readZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { parseBlocks, BACKBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseFli, newFliCanvas, applyFliFrame } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { blockSamples, fliSample } from './compressionFigures';

describe('Chapter 17’s measured compression figures', () => {
  it('compares complete, recoverable BBL ZIPs with the same blank slots', async () => {
    const sizes: number[] = [];
    for (const s of blockSamples()) {
      expect(s.bytes.length).toBe(63000);
      const parsed = parseBlocks(s.bytes, BACKBL);
      expect(parsed[0].pixels).toEqual(s.pixels);
      expect(parsed.slice(1).every((b) => b.pixels.every((p) => p === 0))).toBe(true);
      const zip = await createZip([{ name: 'TEST.BBL', data: s.bytes }]);
      const files = await readZip(zip);
      expect(files.find((f) => f.name === 'TEST.BBL')?.data).toEqual(s.bytes);
      sizes.push(zip.length);
    }
    expect(sizes[0]).toBeGreaterThan(sizes[1]);
    expect(sizes[0]).toBeGreaterThan(sizes[2]);
  });

  it('draws a full BRUN then an LC change on exactly 12 lines, without a ring frame', () => {
    const s = fliSample();
    const anim = parseFli(s.bytes);
    const canvas = newFliCanvas(anim);
    expect(anim.frameCount).toBe(2);
    expect(anim.frames.length).toBe(2);
    applyFliFrame(anim, 0, canvas);
    expect(canvas.pixels).toEqual(s.first);
    applyFliFrame(anim, 1, canvas);
    expect(canvas.pixels).toEqual(s.second);
    const view = new DataView(s.bytes.buffer);
    const firstChunk = anim.frames[0] + 16;
    expect(view.getUint16(firstChunk + 4, true)).toBe(11);
    expect(view.getUint16(firstChunk + view.getUint32(firstChunk, true) + 4, true)).toBe(15);
    const lc = anim.frames[1] + 16;
    expect(view.getUint16(lc + 4, true)).toBe(12);
    expect(view.getUint16(lc + 6, true)).toBe(110);
    expect(view.getUint16(lc + 8, true)).toBe(12);
    expect(s.sizes[1]).toBeLessThan(s.sizes[0]);
    expect(128 + s.sizes[0] + s.sizes[1]).toBe(s.bytes.length);
  });
});
