// Tests: decoding JPEGs, whole and cut short (formats/jpeg.ts), with the BBS gallery's
// pictures (web/public/bbs, made by libjpeg's cjpeg) as samples.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { decodePartialJpeg, isJpeg } from '../src/formats/jpeg';

const sample = (name: string) => new Uint8Array(readFileSync(resolve(__dirname, '../public/bbs', name)));
const count = (a: Uint8Array) => a.reduce((n, v) => n + v, 0);

describe('JPEG', () => {
  it('decodes baseline, progressive and grayscale files', () => {
    for (const [name, progressive, channels] of [
      ['GWINN.JPG', false, 3],
      ['TEDDY.JPG', true, 3],
      ['HOBO3.JPG', false, 1],
    ] as const) {
      const bytes = sample(name);
      expect(isJpeg(bytes)).toBe(true);
      const j = decodePartialJpeg(bytes)!;
      expect(j.complete, name).toBe(true);
      expect(j.progressive, name).toBe(progressive);
      expect(j.channels, name).toBe(channels);
      expect(j.pixels.length).toBe(j.width * j.height * channels);
      expect(count(j.shown)).toBe(j.width * j.height);
      // a real picture: not one flat color
      const mean = j.pixels.reduce((a, b) => a + b, 0) / j.pixels.length;
      const spread = Math.sqrt(j.pixels.reduce((a, b) => a + (b - mean) ** 2, 0) / j.pixels.length);
      expect(spread, name).toBeGreaterThan(20);
    }
  });

  it('has nothing to show before the frame header arrives', () => {
    expect(decodePartialJpeg(sample('GWINN.JPG').subarray(0, 20))).toBeUndefined();
  });

  it('fills a baseline file in top to bottom as it arrives', () => {
    const bytes = sample('GWINN.JPG');
    let last = 0;
    for (let f = 0.2; f < 1; f += 0.2) {
      const j = decodePartialJpeg(bytes.subarray(0, Math.floor(bytes.length * f)))!;
      const shown = count(j.shown);
      expect(shown).toBeGreaterThan(last);
      expect(shown).toBeLessThan(j.width * j.height);
      expect(j.shown[0]).toBe(1); // top left first
      expect(j.shown[j.shown.length - 1]).toBe(0); // bottom right last
      last = shown;
    }
  });

  it('shows a progressive file whole from its first scan, sharper with each scan', () => {
    const bytes = sample('TEDDY.JPG');
    const whole = decodePartialJpeg(bytes)!;
    let lastScans = -1;
    let lastErr = Infinity;
    for (const f of [0.25, 0.5, 0.75, 1]) {
      const j = decodePartialJpeg(bytes.subarray(0, Math.floor(bytes.length * f)))!;
      expect(count(j.shown)).toBe(j.width * j.height);
      expect(j.scans).toBeGreaterThanOrEqual(lastScans);
      lastScans = j.scans;
      let err = 0;
      for (let i = 0; i < j.pixels.length; i++) err += Math.abs(j.pixels[i] - whole.pixels[i]);
      expect(err).toBeLessThanOrEqual(lastErr);
      lastErr = err;
    }
    expect(lastErr).toBe(0);
  });
});
