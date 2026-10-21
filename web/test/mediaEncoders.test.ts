import { describe, expect, it } from 'vitest';
import { encodeWav, parseWav, toPcm8 } from '../src/media/wav';
import { changedRect, encodeAnimatedGif, lzw } from '../src/media/gifEncode';
import { decodeGif } from '../src/formats/gif';

/** A tiny GIF LZW decoder, independent of the encoder, for round trips. */
function unlzw(data: Uint8Array, count: number): Uint8Array {
  const out = new Uint8Array(count);
  let n = 0;
  let codeSize = 9;
  let dict: number[][] = [];
  const reset = () => {
    dict = [];
    for (let i = 0; i < 258; i++) dict.push([i]);
    codeSize = 9;
  };
  reset();
  let pos = 0;
  let prev: number[] | undefined;
  for (;;) {
    let code = 0;
    for (let b = 0; b < codeSize; b++, pos++) code |= ((data[pos >> 3] >> (pos & 7)) & 1) << b;
    if (code === 256) {
      reset();
      prev = undefined;
      continue;
    }
    if (code === 257) break;
    const entry = code < dict.length ? dict[code] : [...prev!, prev![0]];
    for (const v of entry) out[n++] = v;
    if (prev) dict.push([...prev, entry[0]]);
    prev = entry;
    if (dict.length === 1 << codeSize && codeSize < 12) codeSize++;
  }
  expect(n).toBe(count);
  return out;
}

describe('wav', () => {
  it('writes 8-bit mono PCM that reads back byte for byte', () => {
    const pcm = Uint8Array.from([128, 0, 255, 64, 200]);
    const wav = encodeWav(pcm, 11025);
    expect(wav.length).toBe(44 + 5 + 1);
    const r = parseWav(wav);
    expect(r).toMatchObject({ sampleRate: 11025, bits: 8, channels: 1 });
    expect([...r.data]).toEqual([...pcm]);
  });
  it('converts float samples back to the VOC bytes they came from', () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
    const floats = Float32Array.from(bytes, (b) => (b - 128) / 128);
    expect([...toPcm8(floats)]).toEqual([...bytes]);
  });
  it('writes 16-bit PCM', () => {
    const r = parseWav(encodeWav(Int16Array.from([-32768, 0, 32767]), 44100));
    expect(r.bits).toBe(16);
    expect(r.data.length).toBe(6);
  });
});

describe('animated gif', () => {
  const pal = new Uint8Array(768).map((_, i) => i % 64);
  const frame = (fill: (x: number, y: number) => number) => Uint8Array.from({ length: 32 * 20 }, (_, i) => fill(i % 32, Math.floor(i / 32)));

  it('round trips LZW, including table resets', () => {
    const px = Uint8Array.from({ length: 70000 }, (_, i) => ((i * 7919) % 251) ^ (i >> 9));
    expect([...unlzw(lzw(px), px.length)]).toEqual([...px]);
  });

  it('finds the changed rectangle', () => {
    const a = frame(() => 0);
    const b = a.slice();
    b[5 * 32 + 3] = 1;
    b[9 * 32 + 10] = 1;
    expect(changedRect(a, b, 32, 20)).toEqual([3, 5, 8, 5]);
    expect(changedRect(a, a, 32, 20)).toBeUndefined();
  });

  it('starts with a whole first frame that decodes, loops, and keeps total time', () => {
    const f1 = frame((x, y) => (x + y) & 15);
    const f2 = f1.slice();
    f2[0] = 99;
    const gif = encodeAnimatedGif(32, 20, [
      { pixels: f1, palette: pal, ms: 1000 / 70 },
      { pixels: f2, palette: pal, ms: 1000 / 70 },
      { pixels: f1, palette: pal, ms: 500 },
    ]);
    expect(String.fromCharCode(...gif.subarray(0, 6))).toBe('GIF89a');
    expect(String.fromCharCode(...gif.subarray(13 + 768 + 3, 13 + 768 + 14))).toBe('NETSCAPE2.0');
    const first = decodeGif(gif);
    expect(first.width).toBe(32);
    // the first 1/70 s frame is merged into the second, which is stored whole
    expect([...first.pixels]).toEqual([...f2]);
    // delays: walk the graphic control extensions
    const delays: number[] = [];
    for (let i = 0; i < gif.length - 8; i++) if (gif[i] === 0x21 && gif[i + 1] === 0xf9 && gif[i + 2] === 4) delays.push(gif[i + 4] | (gif[i + 5] << 8));
    // 1/70 s frames are too short for browsers: merged so the total stays 0.53 s
    expect(delays.every((d) => d >= 2)).toBe(true);
    expect(delays.reduce((a, b) => a + b, 0)).toBe(53);
  });
});

describe('mp4 mux', () => {
  it('puts ftyp, moov, then mdat, with the chunk offset at the first sample', async () => {
    const { muxMp4, topBoxes } = await import('../src/media/mp4Mux');
    const samples = [
      { data: Uint8Array.from([0, 0, 0, 2, 0x65, 1]), duration: 5, key: true },
      { data: Uint8Array.from([0, 0, 0, 1, 0x41]), duration: 5, key: false },
      { data: Uint8Array.from([0, 0, 0, 1, 0x41]), duration: 10, key: false },
    ];
    const mp4 = muxMp4({ width: 320, height: 200, timescale: 70, avcC: Uint8Array.from([1, 0x64, 0, 0x28, 0xff, 0xe0, 0]), samples });
    const boxes = topBoxes(mp4);
    expect(boxes.map((b) => b.type)).toEqual(['ftyp', 'moov', 'mdat']);
    expect(boxes.reduce((n, b) => n + b.size, 0)).toBe(mp4.length);
    const stco = mp4.findIndex((_, i) => String.fromCharCode(...mp4.subarray(i, i + 4)) === 'stco');
    const offset = new DataView(mp4.buffer).getUint32(stco + 12);
    expect(offset).toBe(boxes[2].offset + 8);
    expect([...mp4.subarray(offset, offset + 6)]).toEqual([0, 0, 0, 2, 0x65, 1]);
    // durations run-length coded: 2 x 5, 1 x 10; total 20/70 s in mvhd
    const stts = mp4.findIndex((_, i) => String.fromCharCode(...mp4.subarray(i, i + 4)) === 'stts');
    const v = new DataView(mp4.buffer);
    expect([v.getUint32(stts + 8), v.getUint32(stts + 12), v.getUint32(stts + 16), v.getUint32(stts + 20), v.getUint32(stts + 24)]).toEqual([2, 2, 5, 1, 10]);
  });
});

describe('720x400 text capture', () => {
  it('draws 9-dot cells, repeating the eighth column only for line drawing characters', async () => {
    const { textPixels, TEXT_W, TEXT_H } = await import('../src/media/screenCapture');
    const { FONT_CP437 } = await import('../src/retro/text/cp437');
    expect([TEXT_W, TEXT_H]).toEqual([720, 400]);
    const chars = new Uint8Array(80 * 25).fill(0xdb); // full block everywhere
    chars[0] = 0xc4; // ─ joins its neighbor
    chars[1] = 0xdb; // █ is in C0-DF too
    chars[2] = 0xb0; // ░ is not: a gap
    const attrs = new Uint8Array(80 * 25).fill(0x0f);
    const colors = Uint32Array.from({ length: 16 }, (_, i) => i);
    const out = new Uint32Array(720 * 400);
    textPixels(chars, attrs, colors, out);
    const row = [...Array(8)].findIndex((_, r) => FONT_CP437[0xc4 * 8 + r] & 0x80);
    expect(out[row * 2 * 720 + 8]).toBe(15);
    expect(out[0 * 720 + 9 + 8]).toBe(15);
    expect(out[0 * 720 + 18 + 8]).toBe(0);
  });
});
