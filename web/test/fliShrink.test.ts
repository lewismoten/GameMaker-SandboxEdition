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
  bandColor,
  chainVisibility,
  frameStep,
  maxColorsStep,
  onePaletteStep,
  shrinkFrames,
  snapColorsStep,
  type FliFrames,
} from '@lewismoten/gamemaker-sandbox-tools/kit/fliShrink';

// Under a second on a fast machine; the 5 s default timed out on a slower one under load.
const SLOW = 30_000;

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
// toEqual on 64,000-byte frames is slow; these compare the bytes directly.
const sameBytes = (a: Uint8Array, b: Uint8Array): boolean => a.length === b.length && Buffer.compare(a, b) === 0;
const sameFrames = (a: Uint8Array[], b: Uint8Array[]): boolean => a.length === b.length && a.every((f, i) => sameBytes(f, b[i]));

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
  it(
    'show the same colors for every pixel drawn, and take fewer bytes',
    () => {
      const s = sample();
      const full = encodeFli(s.frames, s.palettes[0], { palettes: s.palettes, runs: true, noLoopFrame: true });
      const sparse = encodeFrames(s, { sparsePalettes: true });
      expect(sparse.length).toBeLessThan(full.length);
      const a = play(full);
      const b = play(sparse);
      for (let f = 0; f < a.length; f++) {
        expect(sameBytes(b[f].px, a[f].px), `frame ${f}`).toBe(true);
        const used = new Set(a[f].px);
        for (const c of used) for (let j = 0; j < 3; j++) expect(b[f].pal[c * 3 + j]).toBe(a[f].pal[c * 3 + j]);
      }
    },
    SLOW,
  );

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

  it('one palette: no COLOR chunk after frame 0, same frames and timing, and it plays back as measured', () => {
    const r = onePaletteStep(s, { colors: 256 });
    const bytes = encodeFrames(r.frames, r.encode);
    const a = parseFli(bytes);
    expect(a.frameCount).toBe(s.frames.length);
    expect(a.speed).toBe(s.speed);
    const dv = new DataView(bytes.buffer, bytes.byteOffset);
    let p = 128;
    for (let f = 0; f < a.frameCount; f++) {
      const n = dv.getUint16(p + 6, true);
      let q = p + 16;
      for (let c = 0; c < n; c++) {
        if (f > 0) expect([11, 4]).not.toContain(dv.getUint16(q + 4, true));
        q += dv.getUint32(q, true);
      }
      p += dv.getUint32(p, true);
    }
    // the player's screen matches the step's frames
    const shown = play(bytes);
    const rgb = (px: Uint8Array, pal: Uint8Array, x: number) => [0, 1, 2].map((j) => pal[px[x] * 3 + j] & 63).join();
    for (let f = 0; f < s.frames.length; f++) {
      for (const x of [0, 4, 8 * f + 40 * 320 + 3, 12345]) expect(rgb(shown[f].px, shown[f].pal, x)).toBe(rgb(r.frames.frames[f], r.frames.palettes[f], x));
    }
  });
  it('one palette is lossless when the colors fit, and fewer colors cost visibility', () => {
    expect(onePaletteStep(s, { colors: 256 }).lossless).toBe(true);
    const few = onePaletteStep(s, { colors: 3 });
    expect(few.lossless).toBe(false);
    expect(new Set(few.frames.frames.flatMap((f) => [...new Set(f)])).size).toBeLessThanOrEqual(3);
  });
  it('chainVisibility compares a dropped-frame result with the original', () => {
    const d = dropFramesStep(s);
    const v = chainVisibility(s, d.frames);
    expect(v.worst).toBeGreaterThan(0);
    expect(chainVisibility(s, s).changedShare).toBe(0);
  });

  it('frame it: nothing set is the same picture', () => {
    const r = frameStep(s, { top: 0, bottom: 0, left: 0, right: 0, zoom: 1, panX: 0, panY: 0 });
    expect(r.lossless).toBe(true);
    expect(sameFrames(r.frames.frames, s.frames)).toBe(true);
  });
  it(
    'frame it: bands are exactly the band color, frames and timing stay, and it round trips',
    () => {
      const r = frameStep(s, { top: 20, bottom: 30, left: 16, right: 40, zoom: 1, panX: 0, panY: 0 });
      const band = bandColor(s.palettes[0]);
      expect(r.frames.frames.length).toBe(s.frames.length);
      expect(r.frames.speed).toBe(s.speed);
      let bad = 0;
      r.frames.frames.forEach((f, fi) => {
        for (let y = 0; y < 200; y++)
          for (let x = 0; x < 320; x++) {
            const inside = y >= 20 && y < 170 && x >= 16 && x < 280;
            if (inside ? f[y * 320 + x] !== s.frames[fi][y * 320 + x] : f[y * 320 + x] !== band) bad++;
          }
      });
      expect(bad).toBe(0);
      const back = decodeFli(encodeFrames(r.frames, r.encode));
      expect(sameFrames(back.frames, r.frames.frames)).toBe(true);
      expect(back.speed).toBe(s.speed);
      expect(r.savedBytes).toBeGreaterThan(0);
    },
    SLOW,
  );
  it('frame it: at zoom 1 the picture stays put under the bands, at other zooms it is centered in the area', () => {
    const r = frameStep(s, { top: 0, bottom: 0, left: 100, right: 0, zoom: 1, panX: 0, panY: 0 });
    expect(r.frames.frames[3][50 * 320 + 150]).toBe(s.frames[3][50 * 320 + 150]);
    const z = frameStep(s, { top: 0, bottom: 0, left: 100, right: 0, zoom: 1.0001, panX: 0, panY: 0 });
    // the original's middle column sits in the middle of the area (x = 100 + 110)
    expect(z.frames.frames[3][100 * 320 + 210]).toBe(s.frames[3][100 * 320 + 160]);
  });
  it('frame it: zoom out averages into existing colors, zoom in repeats pixels', () => {
    const small = frameStep(s, { top: 0, bottom: 0, left: 0, right: 0, zoom: 0.5, panX: 0, panY: 0 });
    const used = new Set(s.frames.flatMap((f) => [...new Set(f)]));
    const band = bandColor(s.palettes[0]);
    const strays = small.frames.frames.flatMap((f) => [...new Set(f)].filter((c) => !used.has(c) && c !== band));
    expect(strays).toEqual([]);
    expect(small.frames.frames[0][0]).toBe(bandColor(s.palettes[0]));
    const big = frameStep(s, { top: 0, bottom: 0, left: 0, right: 0, zoom: 2, panX: 0, panY: 0 });
    // a 2x zoom shows each pixel twice across: neighbors in a pair match
    const f = big.frames.frames[0];
    const odd: number[] = [];
    for (let x = 0; x < 320; x += 2) if (f[100 * 320 + x] !== f[100 * 320 + x + 1]) odd.push(x);
    expect(odd).toEqual([]);
  });
});
