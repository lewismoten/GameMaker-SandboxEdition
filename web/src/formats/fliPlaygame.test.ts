// PLAYGAME's own FLI player, ported for tests: FileRead (code/DRV/FILECLSS.CPP and .HPP, the
// version PLAYGAME.MAP shows linked) with a buffer as big as the memory left for it, and
// FLI::View, FrameHeader::View and its decoders (code/Image/FLI/FLI.CPP). FileRead reads the
// file through one buffer of up to 0xFFF0 bytes, shrunk by 2 while `new` fails, and Peek
// hands out a chunk only when the whole chunk fits in it; with less memory free (a game
// loaded through XFERPLAY) a big chunk comes back short and the decoders draw garbage.
// The screen is VGAScrn (code/DRV/VGAOBJ.ASM), whose table has only Rep1Col, RepCols and the
// palette routines that FLI.CPP uses; its BoxFill is 0, so an AllBlack chunk is a fault here.
// These tests play every game's .FLI files through that port with a small buffer, check
// that each frame matches what fli.ts draws, and check encodeFli's chunk size limit.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyFliFrame, encodeFli, FLI_CHUNK_MAX, newFliCanvas, parseFli } from './fli';
import { decodeFliFrames, encodeFliFrames } from './fliFrames';

interface DosPlay {
  /** Why the player went wrong, or undefined when every frame played. */
  failure?: string;
  /** The screen and the 6-bit palette after each frame. */
  frames: { pixels: Uint8Array; palette: Uint8Array }[];
  /** The buffer size FileRead got. */
  blen: number;
}

/** Plays an .FLI as PLAYGAME does, with at most `memory` bytes free for FileRead's buffer. */
function playLikeDos(file: Uint8Array, memory: number): DosPlay {
  const frames: DosPlay['frames'] = [];
  const length = file.length;
  let filePos = 0;
  let fpOpen = true;
  // FileRead::Open: blen starts at 65534; a file shorter than that keeps it, a longer one gets
  // 0xFFF0; then `new uchar[blen]` is tried, 2 bytes less each time it fails.
  let blen = 65534;
  if (blen < length + 1) blen = Math.min(length + 1, 0xfff0);
  while (blen > memory && blen > 10) blen -= 2;
  if (blen > memory) return { failure: 'no buffer', frames, blen };
  const buf = new Uint8Array(blen);
  const fread = (at: number, n: number): number => {
    if (!fpOpen) return 0;
    const got = Math.max(0, Math.min(n, length - filePos));
    buf.set(file.subarray(filePos, filePos + got), at);
    filePos += got;
    return got;
  };
  let end = fread(0, blen);
  let idx = 0;
  let curPos = 0;
  let eof = false;
  if (end === length) fpOpen = false; // "Its all in!"
  let failure: string | undefined;

  const loadMore = (): boolean => {
    if (idx >= end && !eof) {
      if (curPos >= length) {
        eof = true;
        return false;
      }
      if (idx === end) {
        idx = 0;
        end = fread(0, blen);
        if (end === 0) eof = true;
      }
      if (idx > blen) eof = true;
    }
    return !eof;
  };
  const get = (n: number, out: number[] = []): number[] => {
    if (eof) {
      failure ??= 'read past the end of the file';
      return out;
    }
    if (idx + n <= end) {
      for (let i = 0; i < n; i++) out.push(buf[idx + i]);
      idx += n;
      curPos += n;
    } else {
      const canCopy = end - idx;
      get(canCopy, out);
      get(n - canCopy, out);
    }
    loadMore();
    return out;
  };
  /** FileRead::Peek: the offset of `bytes` bytes in buf, or undefined when they did not fit. */
  const peek = (bytes: number): number | undefined => {
    if (idx + bytes >= end) {
      const leftOver = end - idx;
      buf.copyWithin(0, idx, end);
      end = leftOver + fread(leftOver, blen - leftOver);
      if (end === 0) eof = true;
      idx = 0;
      if (idx + bytes > end) return undefined; // DRV's Peek shortens Bytes; the decoders don't look
    }
    return idx;
  };
  const skip = (n: number): void => {
    idx += n;
    curPos += n;
    loadMore();
  };

  const screen = new Uint8Array(64000);
  const pal = new Uint8Array(768);
  const put = (x: number, y: number, v: number) => {
    const o = y * 320 + x;
    if (o >= 0 && o < 64000) screen[o] = v;
  };
  const s8 = (v: number) => (v << 24) >> 24;
  const u16 = (b: number[], p: number) => b[p] | (b[p + 1] << 8);

  // The decoders read through a window of the chunk's MemAmt bytes; reading past it is a fault.
  const decode = (type: number, at: number, size: number): void => {
    const lim = at + size;
    const rd = (p: number): number => {
      if (p >= lim) throw new Error(`chunk ${type} read past its ${size} bytes`);
      return buf[p];
    };
    let d = at;
    if (type === 11) {
      // DoColorChange: NumPackets an int; SkipCols a uchar; NumCols 0 means 256.
      const packets = (rd(d) | (rd(d + 1) << 8)) & 0xffff;
      d += 2;
      let skipCols = 0;
      for (let k = 0; k < packets; k++) {
        skipCols = (skipCols + rd(d)) & 255;
        let n = rd(d + 1);
        d += 2;
        if (n === 0) n = 256;
        for (let c = 0; c < n; c++, d += 3) for (let j = 0; j < 3; j++) pal[((c + skipCols) & 255) * 3 + j] = rd(d + j) & 63;
        skipCols = (skipCols + n) & 255;
      }
    } else if (type === 15) {
      // DoRunLength: always 200 lines; NumPackets a uchar; PacketLen <= 0 copies, > 0 repeats.
      for (let y = 0; y < 200; y++) {
        const packets = rd(d++);
        let x = 0;
        for (let k = 0; k < packets; k++) {
          let len = s8(rd(d++));
          if (len <= 0) {
            len = -len;
            for (let j = 0; j < len; j++) put(x + j, y, rd(d + j));
            d += len;
          } else {
            for (let j = 0; j < len; j++) put(x + j, y, rd(d));
            d++;
          }
          x += len;
        }
        // the line's packets must fill it: a count byte capped at 255 would end it early
        if (x !== 320) throw new Error(`BRUN line ${y} covers ${x} pixels`);
      }
    } else if (type === 12) {
      // DoLineCompress: SkipNum, ChangeNum (uint); NumPackets = (int)(char), so 128..255 is a
      // huge count; PacketLen is a signed char: >= 0 copies, < 0 repeats.
      const skipNum = rd(d) | (rd(d + 1) << 8);
      const changeNum = rd(d + 2) | (rd(d + 3) << 8);
      d += 4;
      for (let y = skipNum; y < ((skipNum + changeNum) & 0xffff); y++) {
        const packets = s8(rd(d++)) & 0xffff;
        if (packets >= 128) throw new Error(`line ${y} has a packet count of ${packets} (a signed char)`);
        if (y >= 200) throw new Error(`LC line ${y} is below the screen`);
        let x = 0;
        for (let k = 0; k < packets; k++) {
          let len = s8(rd(d + 1));
          x += rd(d);
          d += 2;
          if (len >= 0) {
            for (let j = 0; j < len; j++) put(x + j, y, rd(d + j));
            d += len;
          } else {
            len = -len;
            for (let j = 0; j < len; j++) put(x + j, y, rd(d));
            d++;
          }
          x += len;
          if (x > 320) throw new Error(`LC line ${y} runs to x ${x}`);
        }
      }
    }
  };

  const head = get(128);
  if (u16(head, 4) !== 0xaf11 || u16(head, 12) !== 8) return { failure: 'invalid FLI', frames, blen };
  const numFrames = u16(head, 6);
  try {
    for (let f = 0; f < numFrames && !failure; f++) {
      const fh = get(16);
      if (u16(fh, 4) !== 0xf1fa) throw new Error(`frame ${f}: invalid frame`);
      // FrameHeader::View never reads the frame's Size (a long): only its chunks count
      const chunks = u16(fh, 6);
      for (let c = 0; c < chunks && !failure; c++) {
        const ch = get(6);
        const size = (ch[0] | (ch[1] << 8) | (ch[2] << 16) | (ch[3] << 24)) >>> 0;
        const type = u16(ch, 4);
        const memAmt = (size - 6) & 0xffff; // uint MemAmt = c.Size - sizeof(ChunkHeader)
        if (type === 11 || type === 12 || type === 15) {
          const at = peek(memAmt);
          if (at === undefined) throw new Error(`frame ${f}: a ${memAmt}-byte chunk (type ${type}) does not fit a ${blen}-byte buffer`);
          try {
            decode(type, at, memAmt);
          } catch (e) {
            throw new Error(`frame ${f}: ${(e as Error).message}`);
          }
          skip((size - 6) >>> 0);
        } else if (type === 13) {
          // AllBlack calls Vid->BoxFill, and VGAScrn (code/DRV/VGAOBJ.ASM) leaves BoxFill 0
          throw new Error(`frame ${f}: an AllBlack chunk (VGAScrn's BoxFill is a null pointer)`);
        } else if (type === 16) {
          const at = peek(64000);
          if (at === undefined) throw new Error(`frame ${f}: a COPY chunk does not fit a ${blen}-byte buffer`);
          screen.set(buf.subarray(at, at + 64000));
          skip(64000);
        } else throw new Error(`frame ${f}: chunk type ${type} (PLAYGAME exits)`);
      }
      frames.push({ pixels: screen.slice(), palette: pal.slice() });
    }
  } catch (e) {
    failure = (e as Error).message;
  }
  return { failure, frames, blen };
}

const GAMES = join(__dirname, '../../../games');
const diskFlis = (): { name: string; bytes: Uint8Array }[] =>
  readdirSync(GAMES)
    .filter((g) => existsSync(join(GAMES, g, 'disk')))
    .flatMap((g) =>
      readdirSync(join(GAMES, g, 'disk'))
        .filter((f) => /\.fli$/i.test(f))
        .sort()
        .map((f) => ({ name: `${g}/${f}`, bytes: new Uint8Array(readFileSync(join(GAMES, g, 'disk', f))) })),
    );

/** What fli.ts draws after each of the first frameCount frames. */
function webFrames(bytes: Uint8Array): { pixels: Uint8Array; palette: Uint8Array }[] {
  const anim = parseFli(bytes);
  const c = newFliCanvas(anim);
  const out = [];
  for (let i = 0; i < anim.frameCount; i++) {
    applyFliFrame(anim, i, c);
    out.push({ pixels: c.pixels.slice(), palette: c.palette.slice() });
  }
  return out;
}

/** Every chunk's size (with its header) in an .FLI, and the ring frame's too. */
function chunkSizes(bytes: Uint8Array): number[] {
  const anim = parseFli(bytes);
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const sizes: number[] = [];
  for (const start of anim.frames) {
    let p = start + 16;
    for (let i = 0; i < dv.getUint16(start + 6, true); i++) {
      const size = dv.getUint32(p, true);
      sizes.push(size);
      p += size;
    }
  }
  return sizes;
}

/** A 320x200 picture of noise in bands: hard for BRUN, so one frame is a big chunk. */
function noisy(seed: number, colors = 256): Uint8Array {
  const px = new Uint8Array(64000);
  let s = seed;
  for (let i = 0; i < px.length; i++) {
    s = (s * 1103515245 + 12345) >>> 0;
    const y = Math.floor(i / 320);
    // some rows of runs, some of noise, some left black
    px[i] = y % 7 === 3 ? 0 : y % 5 === 0 ? (y * 3) & 255 : (s >>> 16) % colors;
  }
  return px;
}

/** FileRead's buffer in these tests: no bigger than the largest chunk encodeFli writes. */
const BUFFER = FLI_CHUNK_MAX;

describe('PLAYGAME port', () => {
  it('breaks on a chunk bigger than its buffer (one 64K BRUN frame, as encodeFli once wrote)', () => {
    // A frame of one BRUN chunk of literal packets, written by hand (header, frame, chunk).
    const px = noisy(7);
    const line: number[] = [];
    for (let y = 0; y < 200; y++) {
      line.push(3);
      for (let k = 0; k < 3; k++) {
        const n = k < 2 ? 128 : 64;
        line.push((256 - n) & 255, ...px.subarray(y * 320 + k * 128, y * 320 + k * 128 + n));
      }
    }
    const size = line.length + 6;
    const frame = [...le32(size + 16), 0xfa, 0xf1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...le32(size), 15, 0, ...line];
    const file = new Uint8Array(128 + frame.length);
    const dv = new DataView(file.buffer);
    dv.setUint32(0, file.length, true);
    dv.setUint16(4, 0xaf11, true);
    dv.setUint16(6, 1, true);
    dv.setUint16(8, 320, true);
    dv.setUint16(10, 200, true);
    dv.setUint16(12, 8, true);
    file.set(frame, 128);
    expect(playLikeDos(file, 0xfff0).failure).toBeUndefined();
    expect(playLikeDos(file, 0xfff0).frames[0].pixels).toEqual(px);
    expect(playLikeDos(file, 32000).failure).toMatch(/does not fit a 32000-byte buffer/);
  });

  it('plays every game .FLI with a small buffer, frame for frame as fli.ts draws it', () => {
    const files = diskFlis();
    expect(files.length).toBeGreaterThan(100);
    for (const { name, bytes } of files) {
      const dos = playLikeDos(bytes, BUFFER);
      expect(dos.failure, name).toBeUndefined();
      const web = webFrames(bytes);
      expect(dos.frames.length, name).toBe(web.length);
      for (let i = 0; i < web.length; i++) {
        if (!equal(dos.frames[i].pixels, web[i].pixels)) expect.fail(`${name} frame ${i}: the pixels differ`);
        if (!equal(dos.frames[i].palette, web[i].palette)) expect.fail(`${name} frame ${i}: the palette differs`);
      }
    }
  }, 120_000);

  it("plays the FLIs Lewis saw break in DOSBox: Carl's cover, the goat's Stable card, Blaster's intro", () => {
    // carl/cover.fli had a 63,446-byte BRUN chunk; goat/card4.fli a 24,082-byte LC chunk and,
    // on frame 1, a line of 128 packets (a negative count to PLAYGAME at any buffer size);
    // blaster/intro.fli a 64,806-byte chunk.
    for (const name of ['carl/cover.fli', 'goat/card4.fli', 'blaster/intro.fli']) {
      const bytes = new Uint8Array(readFileSync(join(GAMES, name.replace('/', '/disk/'))));
      expect(playLikeDos(bytes, BUFFER).failure, name).toBeUndefined();
    }
  });

  it('breaks on an LC line of 128 packets (DoLineCompress reads the count as a signed char)', () => {
    const line = [128, ...Array.from({ length: 128 }, () => [1, 1, 5]).flat()];
    const data = [0, 0, 1, 0, ...line];
    const size = data.length + 6 + (data.length & 1);
    const chunk = [...le32(size), 12, 0, ...data, ...(data.length & 1 ? [0] : [])];
    const frame = [...le32(chunk.length + 16), 0xfa, 0xf1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...chunk];
    const file = new Uint8Array(128 + frame.length);
    const dv = new DataView(file.buffer);
    dv.setUint32(0, file.length, true);
    dv.setUint16(4, 0xaf11, true);
    dv.setUint16(6, 1, true);
    dv.setUint16(12, 8, true);
    file.set(frame, 128);
    expect(playLikeDos(file, 0xfff0).failure).toMatch(/frame 0: line 0 has a packet count/);
  });

  it("sets a split frame 0's palette after its bands, so the last picture never shows in new colors", () => {
    for (const { name, bytes } of diskFlis()) {
      const anim = parseFli(bytes);
      const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const start = anim.frames[0];
      const types: number[] = [];
      for (let i = 0, p = start + 16; i < dv.getUint16(start + 6, true); i++, p += dv.getUint32(p, true)) types.push(dv.getUint16(p + 4, true));
      if (types.filter((t) => t !== 11).length > 1 && types.includes(11)) expect(types.at(-1), name).toBe(11);
    }
  });

  it('finds no chunk in the games bigger than FLI_CHUNK_MAX', () => {
    for (const { name, bytes } of diskFlis()) expect(Math.max(...chunkSizes(bytes)), name).toBeLessThanOrEqual(FLI_CHUNK_MAX);
  }, 30_000);
});

describe('encodeFli chunk limit', () => {
  // the last frame is runs of 3 and single pixels (1 1 1 2 ...): 160 packets a line with runs
  const comb = new Uint8Array(64000).map((_, i) => (i % 4 === 3 ? 2 : 1));
  const frames = [new Uint8Array(64000), noisy(1), noisy(2, 4), noisy(2, 4), new Uint8Array(64000).fill(9), noisy(3), new Uint8Array(64000).fill(9), comb];
  const pal = new Uint8Array(768).map((_, i) => i & 63);

  for (const runs of [false, true]) {
    it(`splits big frames into bands that each fit (runs: ${runs}), drawing the same pictures`, () => {
      const fli = encodeFli(frames, pal, { speed: 6, runs });
      expect(Math.max(...chunkSizes(fli))).toBeLessThanOrEqual(FLI_CHUNK_MAX);
      const anim = parseFli(fli);
      expect(anim.frameCount).toBe(frames.length);
      expect(anim.frames.length).toBe(frames.length + 1); // and the ring frame
      expect(anim.speed).toBe(6);
      const web = webFrames(fli);
      web.forEach((f, i) => expect(equal(f.pixels, frames[i]), `frame ${i}`).toBe(true));
      const dos = playLikeDos(fli, BUFFER);
      expect(dos.failure).toBeUndefined();
      dos.frames.forEach((f, i) => expect(equal(f.pixels, frames[i]), `DOS frame ${i}`).toBe(true));
    });
  }

  it('re-encodes game animations to the same frames', () => {
    const sample = diskFlis().filter((_, i) => i % 9 === 0);
    for (const { name, bytes } of sample) {
      const before = decodeFliFrames(bytes);
      const after = decodeFliFrames(encodeFliFrames(before));
      expect(after.frames.length, name).toBe(before.frames.length);
      after.frames.forEach((f, i) => {
        if (!equal(f.pixels, before.frames[i].pixels) || !equal(f.palette, before.frames[i].palette)) expect.fail(`${name} frame ${i} differs`);
      });
    }
  }, 30_000);
});

function le32(v: number): number[] {
  return [v & 255, (v >> 8) & 255, (v >> 16) & 255, v >>> 24];
}

function equal(a: Uint8Array, b: Uint8Array): boolean {
  return Buffer.from(a.buffer, a.byteOffset, a.length).equals(b);
}
