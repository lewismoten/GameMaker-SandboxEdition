// Sparse palettes round trip, and the shrink steps' reports (fliShrink.ts).
import { describe, expect, it } from 'vitest';
import { applyFliFrame, encodeFli, newFliCanvas, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import {
  decodeFli,
  dropFramesStep,
  encodeFrames,
  fliReport,
  flattenDitherStep,
  holdStillStep,
  maxColorsStep,
  shrinkFrames,
  snapColorsStep,
  type FliFrames,
} from '@lewismoten/gamemaker-sandbox-tools/kit/fliShrink';

/** A small animation: a gray picture with a moving block that fades out over the last frames (320x200). */
function sample(): FliFrames {
  const frames: Uint8Array[] = [];
  const palettes: Uint8Array[] = [];
  const base = new Uint8Array(768);
  for (let i = 0; i < 6; i++) [i * 10, i * 10, i * 10].forEach((v, j) => (base[i * 3 + j] = v));
  for (let f = 0; f < 10; f++) {
    const px = new Uint8Array(64000);
    for (let y = 0; y < 200; y++) for (let x = 0; x < 320; x++) px[y * 320 + x] = x % 4 === 0 && y % 2 === 0 ? 1 : 2; // a speckle of one gray on a close one
    for (let y = 40; y < 60; y++) for (let x = f * 8; x < f * 8 + 20; x++) px[y * 320 + x] = 5;
    frames.push(px);
    const k = f < 7 ? 1 : (10 - f) / 4;
    palettes.push(base.map((v) => Math.round(v * k)));
  }
  return { frames, palettes, width: 320, height: 200, speed: 5 };
}

/** The screen as the player has it after each frame. */
function play(fli: Uint8Array) {
  const a = parseFli(fli);
  const c = newFliCanvas(a);
  const shown: { px: Uint8Array; pal: Uint8Array }[] = [];
  for (let f = 0; f < a.frameCount; f++) {
    applyFliFrame(a, f, c);
    shown.push({ px: Uint8Array.from(c.pixels), pal: Uint8Array.from(c.palette) });
  }
  return shown;
}

describe('sparse palettes', () => {
  it('show the same colors for every pixel drawn, and take fewer bytes', () => {
    const s = sample();
    const full = encodeFli(s.frames, s.palettes[0], { palettes: s.palettes, runs: true, noLoopFrame: true });
    const sparse = encodeFrames(s, { sparsePalettes: true });
    expect(sparse.length).toBeLessThan(full.length);
    const a = play(full);
    const b = play(sparse);
    for (let f = 0; f < a.length; f++) {
      expect(b[f].px).toEqual(a[f].px);
      const used = new Set(a[f].px);
      for (const c of used) for (let j = 0; j < 3; j++) expect(b[f].pal[c * 3 + j]).toBe(a[f].pal[c * 3 + j]);
    }
  });

  it('send a color a frame did not draw once a later frame does', () => {
    const s = sample();
    const px = new Uint8Array(64000).fill(1);
    const frames = [px, px, Uint8Array.from(px).fill(3)];
    const pal = (v: number) => {
      const p = new Uint8Array(768);
      p[9] = p[10] = p[11] = v; // color 3
      return p;
    };
    const f: FliFrames = { ...s, frames, palettes: [pal(10), pal(20), pal(30)] };
    const shown = play(encodeFrames(f, { sparsePalettes: true }));
    expect(shown[2].pal[9]).toBe(30);
  });
});

describe('fliReport', () => {
  it('adds up to the file size and finds the whole picture', () => {
    const fli = encodeFrames(sample());
    const r = fliReport(fli);
    expect(r.frames).toHaveLength(10);
    expect(r.frames.reduce((n, f) => n + f.bytes, 128)).toBe(fli.length);
    expect(Object.values(r.byChunk).reduce((n, v) => n + v, 128)).toBe(fli.length);
    expect(r.byChunk.LC).toBeGreaterThan(0);
  });
});

describe('shrink steps', () => {
  const s = sample();
  it('flatten dithering between close grays: smaller, and reports what changed', () => {
    const r = flattenDitherStep(s, { tolerance: 50 });
    expect(r.lossless).toBe(false);
    expect(r.savedBytes).toBeGreaterThan(0);
    expect(r.visibility.worst).toBeGreaterThan(0);
    expect(r.visibility.worst).toBeLessThanOrEqual(50);
  });
  it('a lossless step reports no difference', () => {
    const r = shrinkFrames(s, [{ step: 'sparsePalettes' }])[0];
    expect(r.lossless).toBe(true);
    expect(r.visibility).toEqual({ mean: 0, worst: 0, changedShare: 0 });
    expect(r.savedBytes).toBeGreaterThan(0);
  });
  it('drop every other frame halves the frames and doubles the wait', () => {
    const r = dropFramesStep(s);
    expect(r.frames.frames.length).toBeLessThan(s.frames.length);
    expect(r.frames.speed).toBe(10);
    expect(decodeFli(encodeFrames(r.frames)).speed).toBe(10);
  });
  it('hold still, snap colors and fewer colors never grow the picture set', () => {
    for (const r of [holdStillStep(s, { tolerance: 40 }), snapColorsStep(s, { tolerance: 30 }), maxColorsStep(s, { colors: 2 })]) {
      expect(r.frames.frames).toHaveLength(s.frames.length);
      expect(r.savedBytes).toBeGreaterThanOrEqual(0);
    }
    expect(new Set(maxColorsStep(s, { colors: 2 }).frames.frames.flatMap((f) => [...new Set(f)])).size).toBeLessThanOrEqual(2);
  });
  it('steps chain, each on the one before', () => {
    const out = shrinkFrames(s, [{ step: 'sparsePalettes' }, { step: 'dropFrames' }]);
    expect(out[1].encode.sparsePalettes).toBe(true);
  });
});
