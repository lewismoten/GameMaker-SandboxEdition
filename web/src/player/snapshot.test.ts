// Decode screenshot PNG chunks and scanlines to check the DOS crop, indices and live palette.
import { describe, expect, it } from 'vitest';
import { inflateSync } from 'node:zlib';
import { encodePng } from '@lewismoten/gamemaker-sandbox-tools/image/png';
import { crc32 } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { snapshotName, snapshotPicture } from './snapshot';

function frame(dosCropped: boolean) {
  const pixels = Uint8Array.from({ length: 320 * 200 }, (_, i) => (i + Math.floor(i / 320)) % 256);
  const palette = Uint8Array.from({ length: 768 }, (_, i) => i % 64);
  return { dosCropped, pixels, palette, sceneNumber: 7 };
}

describe('DOS snapshots', () => {
  it.each([true, false])('copies the visible area with crop=%s, without retaining live buffers', (crop) => {
    const screen = frame(crop);
    const pic = snapshotPicture(screen);
    expect([pic.width, pic.height]).toEqual(crop ? [312, 196] : [320, 200]);
    for (let y = 0; y < pic.height; y++) {
      expect(pic.pixels.subarray(y * pic.width, (y + 1) * pic.width)).toEqual(screen.pixels.subarray(y * 320, y * 320 + pic.width));
    }
    expect(pic.palette).toEqual(screen.palette);
    screen.pixels.fill(0);
    screen.palette.fill(0);
    expect(pic.pixels.some(Boolean)).toBe(true);
    expect(pic.palette.some(Boolean)).toBe(true);
  });

  it('does not infer gameplay from black borders or a black palette', () => {
    const screen = frame(false);
    screen.pixels.fill(0);
    screen.palette.fill(0);
    expect(snapshotPicture(screen)).toMatchObject({ width: 320, height: 200 });
  });

  it.each([true, false])('encodes exact PNG dimensions, palette and scanlines with crop=%s', async (crop) => {
    const pic = snapshotPicture(frame(crop));
    const bytes = await encodePng(pic);
    expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    const chunks = new Map<string, Uint8Array>();
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let at = 8; at < bytes.length;) {
      const length = view.getUint32(at);
      const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
      chunks.set(type, bytes.subarray(at + 8, at + 8 + length));
      expect(view.getUint32(at + 8 + length)).toBe(crc32(bytes.subarray(at + 4, at + 8 + length)) >>> 0);
      at += length + 12;
    }
    const header = chunks.get('IHDR')!;
    const dims = new DataView(header.buffer, header.byteOffset, header.byteLength);
    expect([dims.getUint32(0), dims.getUint32(4)]).toEqual(crop ? [312, 196] : [320, 200]);
    expect([...header.subarray(8)]).toEqual([8, 3, 0, 0, 0]);
    expect(chunks.get('PLTE')).toEqual(Uint8Array.from(pic.palette, (c) => (c << 2) | (c >> 4)));
    const raw = inflateSync(chunks.get('IDAT')!);
    expect(raw.length).toBe((pic.width + 1) * pic.height);
    for (let y = 0; y < pic.height; y++) {
      const at = y * (pic.width + 1);
      expect(raw[at]).toBe(0);
      expect(new Uint8Array(raw.subarray(at + 1, at + 1 + pic.width))).toEqual(pic.pixels.subarray(y * pic.width, (y + 1) * pic.width));
    }
    expect(chunks.get('IEND')?.length).toBe(0);
  });

  it('names captures using game identity, display and local time', () => {
    const now = new Date(2026, 10, 7, 1, 2, 3);
    expect(snapshotName('game:sample', frame(true), now)).toBe('sample-scene-7-20261107-010203.png');
    expect(snapshotName('bundle:my/game', frame(false), now)).toBe('my-game-screen-20261107-010203.png');
  });
});
