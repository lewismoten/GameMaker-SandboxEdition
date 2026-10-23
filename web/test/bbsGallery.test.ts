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
import { decodePicture, GALLERY, SOFA_GIFS } from '../src/retro/bbs/gallery';
import { decodePartialJpeg } from '../src/formats/jpeg';

/** The VGA-sized snapshots (scripts/bbsGifs.ts), on either board; the 640x480 GIFs are tested below. */
const sandbox = list.filter((f) => !f.board);
const small = list.filter((f) => f.width <= 320);
const big = list.filter((f) => f.width > 320);

describe('GIF Gallery files', () => {
  it.each(small)('$name is a 1994 download: 8.3 name, 320x200 or smaller, small', (f) => {
    expect(f.name).toMatch(/^[A-Z0-9_]{1,8}\.(GIF|JPG)$/);
    const bytes = new Uint8Array(readFileSync(resolve(__dirname, '../public/bbs', f.name)));
    expect(bytes.length).toBe(f.bytes);
    expect(bytes.length).toBeLessThan(48_000);
    expect(f.width).toBeLessThanOrEqual(320);
    expect(f.height).toBeLessThanOrEqual(200);
    if (f.format === 'GIF') {
      const g = decodePartialGif(bytes)!;
      expect(String.fromCharCode(...bytes.subarray(0, 6))).toBe('GIF89a');
      expect(g.interlaced).toBe(true);
      expect(g.complete).toBe(true);
      expect([g.width, g.height]).toEqual([f.width, f.height]);
      expect(g.colors).toBe(f.colors);
      expect(g.aspect).toBeCloseTo(53 / 64); // tall VGA pixels
      expect(decodeGif(bytes).pixels.length).toBe(f.width * f.height);
    } else {
      const j = decodePartialJpeg(bytes)!;
      expect([j.width, j.height]).toEqual([f.width, f.height]);
      expect(j.complete).toBe(true);
      expect(j.progressive).toBe(f.progressive);
      expect(j.channels).toBe(f.gray ? 1 : 3);
      expect(j.aspect).toBeCloseTo(5 / 6);
    }
    const pic = decodePicture(bytes)!;
    expect(pic.complete).toBe(true);
    expect(pic.pixels.length).toBe(f.width * f.height);
  });

  it('describes every file in two listing lines or less (the list fits one screen)', () => {
    expect(GALLERY.length).toBe(sandbox.length);
    for (const f of GALLERY) {
      expect(f.desc, f.name).not.toBe('');
      expect(f.desc.length, f.name).toBeLessThanOrEqual(74);
    }
  });
});

describe('The 640x480 GIF pictures', () => {
  it.each(big)('$name is a 640x480 interlaced GIF, small enough for a 14.4k (or a patient 2400) caller', (f) => {
    expect(f.name).toMatch(/^[A-Z0-9_]{1,8}\.GIF$/);
    const bytes = new Uint8Array(readFileSync(resolve(__dirname, '../public/bbs', f.name)));
    expect(bytes.length).toBe(f.bytes);
    expect(bytes.length).toBeGreaterThan(30_000);
    expect(bytes.length).toBeLessThanOrEqual(150_000);
    expect(String.fromCharCode(...bytes.subarray(0, 6))).toMatch(/^GIF8[79]a$/);
    const g = decodePartialGif(bytes)!;
    expect(g.interlaced).toBe(true);
    expect(g.complete).toBe(true);
    expect([g.width, g.height]).toEqual([640, 480]);
    expect(g.colors).toBeGreaterThanOrEqual(f.colors);
    expect(g.colors).toBeLessThanOrEqual(256);
    expect(decodeGif(bytes).pixels.length).toBe(640 * 480);
    expect(f.bytes / GIF_CPS).toBeLessThan(110);
  });

  it('paints coarse first: a fifth of the file fills the whole picture in bands of rows', () => {
    const f = big[0];
    const bytes = new Uint8Array(readFileSync(resolve(__dirname, '../public/bbs', f.name)));
    const pic = decodePicture(bytes.subarray(0, Math.floor(bytes.length * 0.2)))!;
    expect(pic.complete).toBe(false);
    const row = (y: number) => pic.pixels.subarray(y * 640, (y + 1) * 640);
    expect(row(479).some((p) => p !== pic.blank)).toBe(true); // the bottom is there, roughly
    expect(row(9)).toEqual(row(8)); // standing in for the rows still to come
    expect(SOFA_GIFS.map((x) => x.name)).toEqual(list.filter((x) => x.board === 'sofa').map((x) => x.name));
  });
});

describe('picture screen', () => {
  it('uses 320x200 for small pictures and 640x400 for the rest', () => {
    expect(modeFor(320, 200)).toEqual([320, 200]);
    expect(modeFor(192, 200)).toEqual([320, 200]);
    expect(modeFor(321, 200)).toEqual([640, 400]);
    expect(modeFor(320, 201)).toEqual([640, 400]);
    expect(modeFor(640, 400)).toEqual([640, 400]);
    expect(modeFor(640, 480)).toEqual([640, 480]);
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

  it('takes about as long as it did at 14,400 bps', () => {
    for (const f of small) {
      const seconds = f.bytes / (GIF_CPS * GIF_TIME_COMPRESSION);
      expect(seconds, f.name).toBeGreaterThan(3);
      expect(seconds, f.name).toBeLessThan(35);
    }
  });
});
