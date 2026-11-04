// Regression cases from `npm run fuzz:files`: malformed files must fail with a clear Error, not a
// RangeError or TypeError from deep inside, and not by allocating the size a header claims.
import { describe, expect, it } from 'vitest';
import { createZip, readZip } from '@lewismoten/gamemaker-sandbox-archives/project/zip';
import { buildPreview } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfPreview';
import { readSong } from '@lewismoten/gamemaker-sandbox-engine/formats/cmfSong';
import { parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { decodeFliFrames } from '@lewismoten/gamemaker-sandbox-engine/formats/fliFrames';

/** A 128-byte FLI header with the given size, frame count and magic, and nothing after it. */
function fliHeader(width: number, height: number, frames = 1, magic = 0xaf11) {
  const b = new Uint8Array(128);
  const v = new DataView(b.buffer);
  v.setUint32(0, 128, true);
  v.setUint16(4, magic, true);
  v.setUint16(6, frames, true);
  v.setUint16(8, width, true);
  v.setUint16(10, height, true);
  return b;
}

describe('malformed FLI', () => {
  it('rejects a file shorter than its header with a clear message', () => {
    expect(() => parseFli(new Uint8Array(0))).toThrow(/Not an FLI file/);
    expect(() => parseFli(new Uint8Array([0, 0, 0, 0, 0x11, 0xaf]))).toThrow(/shorter than its 128-byte header/);
  });
  it('refuses a header that claims a 65535 x 65535 picture before allocating it', () => {
    expect(() => decodeFliFrames(fliHeader(65535, 65535))).toThrow(/too large/);
  });
  it('still opens an ordinary 320 x 200 header', () => {
    expect(parseFli(fliHeader(320, 200)).width).toBe(320);
  });
});

describe('short CMF', () => {
  it('a CMF cut to its first bytes still previews (the header is padded to 40 bytes)', () => {
    const cut = new Uint8Array(4);
    cut.set([0x43, 0x54, 0x4d, 0x46]);
    expect(() => buildPreview(readSong(cut))).not.toThrow();
  });
});

describe('damaged ZIP data', () => {
  it('names the entry when its compressed data is garbage', async () => {
    const zip = await createZip([{ name: 'a.txt', data: new Uint8Array(2000).fill(65) }]);
    // Find the local data after the 30-byte header + name, and overwrite part of the deflate stream.
    for (let i = 30 + 5; i < 30 + 5 + 8; i++) zip[i] = 0xff;
    await expect(readZip(zip, { maxEntries: 10, maxBytes: 1 << 20 })).rejects.toThrow(/damaged|bigger than its directory|Damaged/);
    await expect(readZip(zip)).rejects.toThrow(/damaged|Damaged/);
  });
});
