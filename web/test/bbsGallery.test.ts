// Tests: the BBS's GIF Gallery files (web/public/bbs, made by scripts/bbsGifs.ts), the
// picture screen's mode and placement, and the download's pace (retro/bbs/gifArea.ts).
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import list from '../src/retro/bbs/gallery.json';
import { decodeGif } from '../src/formats/gif';
import { decodePartialGif } from '../src/formats/gifProgressive';
import { modeFor, nearestColor, placeIn } from '../src/retro/view/picture';
import { bytesAt, GIF_CPS, GIF_TIME_COMPRESSION } from '../src/retro/bbs/gifArea';
import { GALLERY } from '../src/retro/bbs/gallery';

describe('GIF Gallery files', () => {
  it.each(list)('$name is a 1994 download: 8.3 name, interlaced GIF89a, VGA sized, 256 colors or fewer', (f) => {
    expect(f.name).toMatch(/^[A-Z0-9_]{1,8}\.GIF$/);
    const bytes = new Uint8Array(readFileSync(resolve(__dirname, '../public/bbs', f.name)));
    expect(bytes.length).toBe(f.bytes);
    const g = decodePartialGif(bytes)!;
    expect(String.fromCharCode(...bytes.subarray(0, 6))).toBe('GIF89a');
    expect(g.interlaced).toBe(true);
    expect(g.complete).toBe(true);
    expect([g.width, g.height]).toEqual([f.width, f.height]);
    expect(g.width).toBeLessThanOrEqual(640);
    expect(g.height).toBeLessThanOrEqual(400);
    expect(g.colors).toBeLessThanOrEqual(256);
    expect(g.colors).toBe(f.colors);
    expect(g.aspect).toBeCloseTo(53 / 64); // tall VGA pixels
    expect(decodeGif(bytes).pixels.length).toBe(f.width * f.height);
  });

  it('describes every file in two listing lines or less (the list fits one screen)', () => {
    expect(GALLERY.length).toBe(list.length);
    for (const f of GALLERY) {
      expect(f.desc, f.name).not.toBe('');
      expect(f.desc.length, f.name).toBeLessThanOrEqual(80);
    }
  });
});

describe('picture screen', () => {
  it('uses 320x200 for small pictures and 640x400 for the rest', () => {
    expect(modeFor(320, 200)).toEqual([320, 200]);
    expect(modeFor(192, 200)).toEqual([320, 200]);
    expect(modeFor(321, 200)).toEqual([640, 400]);
    expect(modeFor(320, 201)).toEqual([640, 400]);
  });

  it('centers a picture, and shrinks one too big to fit, keeping its shape', () => {
    expect(placeIn(480, 400, 640, 400)).toEqual({ x: 80, y: 0, w: 480, h: 400 });
    expect(placeIn(1280, 800, 640, 400)).toEqual({ x: 0, y: 0, w: 640, h: 400 });
    expect(placeIn(800, 400, 640, 400)).toEqual({ x: 0, y: 40, w: 640, h: 320 });
  });

  it('finds the nearest palette color', () => {
    const pal = new Uint8Array(768);
    pal.set([63, 63, 63], 3);
    pal.set([60, 0, 0], 6);
    expect(nearestColor(pal, 63, 60, 62, 3)).toBe(1);
    expect(nearestColor(pal, 50, 5, 5, 3)).toBe(2);
    expect(nearestColor(pal, 2, 2, 2, 3)).toBe(0);
  });
});

describe('gallery download', () => {
  it('arrives at 14,400 bps, sped up, never past the end', () => {
    expect(bytesAt(0, 1000)).toBe(0);
    expect(bytesAt(1000, 1e6)).toBe(GIF_CPS * GIF_TIME_COMPRESSION);
    expect(bytesAt(60_000, 5000)).toBe(5000);
    expect(bytesAt(-5, 5000)).toBe(0);
  });

  it('takes long enough to watch but not forever', () => {
    for (const f of list) {
      const seconds = f.bytes / (GIF_CPS * GIF_TIME_COMPRESSION);
      expect(seconds, f.name).toBeGreaterThan(1);
      expect(seconds, f.name).toBeLessThan(25);
    }
  });
});
