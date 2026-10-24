// Creative Voice File (.voc) decoder for Sound Blaster digital sound effects.
// Supports 8-bit unsigned PCM (codec 0), Creative ADPCM (codecs 1-3), 16-bit PCM (block 9),
// silence and repeat blocks.
//
// In DOS Game-Maker, PlaySbVocFile() in SOUNDC.C only checks for "Cr", reads the header size
// from byte 20 and hands the rest of the file to the Creative voice driver (sndblast.drv,
// function 6), so the driver did the block parsing that this module reproduces.
//
// Layout: a 26-byte header ("Creative Voice File" + 0x1A, u16 offset of the first block
// (26), u16 version, u16 check = ~version + 0x1234), then blocks of: type u8, size u24
// (little-endian, not counting these 4 bytes), data. Block types used here:
//   0 terminator (no size)       1 sound data: time constant u8, codec u8, samples
//   2 continuation samples       3 silence: length - 1 u16, time constant u8
//   6 repeat start: count u16    7 repeat end
//   8 extended: time constant u16, pack u8, mode u8 (1 = stereo)
//   9 new sound data: rate u32, bits u8, channels u8, codec u16, 4 reserved, samples
// Other types (4 marker, 5 text) are skipped. The sample rate for a time constant tc is
// 1,000,000 / (256 - tc).

export interface DecodedVoc {
  sampleRate: number;
  samples: Float32Array;
}

const SIGNATURE = 'Creative Voice File\x1a';

export function isVoc(bytes: Uint8Array): boolean {
  for (let i = 0; i < SIGNATURE.length; i++) if (bytes[i] !== SIGNATURE.charCodeAt(i)) return false;
  return true;
}

export function decodeVoc(bytes: Uint8Array): DecodedVoc {
  if (!isVoc(bytes)) throw new Error('Not a VOC file');
  // Offset of the first block, from the header.
  let p = bytes[20] | (bytes[21] << 8);
  let sampleRate = 0;
  const parts: Float32Array[] = [];
  let repeatStart = -1;
  let repeatCount = 0;
  let guard = 0;
  let codec = 0;
  let adpcm: AdpcmState | undefined;
  const decodeBlock = (data: Uint8Array): Float32Array => {
    if (codec === 0) return pcm8(data);
    const table = ADPCM[codec];
    if (!table) return new Float32Array(0);
    // A sound data block starts with an uncompressed reference sample; continuations do not.
    if (!adpcm) {
      adpcm = { reference: data[0] ?? 128, scale: 0 };
      data = data.subarray(1);
    }
    return decodeAdpcm(data, table, adpcm);
  };

  // The guard stops a malformed repeat loop from spinning forever.
  while (p < bytes.length && guard++ < 10000) {
    const type = bytes[p];
    if (type === 0) break;
    const size = bytes[p + 1] | (bytes[p + 2] << 8) | (bytes[p + 3] << 16);
    const d = p + 4;
    const end = Math.min(bytes.length, d + size);
    switch (type) {
      case 1: {
        const rate = Math.round(1_000_000 / (256 - bytes[d]));
        sampleRate ||= rate;
        codec = bytes[d + 1];
        adpcm = undefined;
        parts.push(decodeBlock(bytes.subarray(d + 2, end)));
        break;
      }
      case 2:
        parts.push(decodeBlock(bytes.subarray(d, end)));
        break;
      case 3: {
        const len = (bytes[d] | (bytes[d + 1] << 8)) + 1;
        sampleRate ||= Math.round(1_000_000 / (256 - bytes[d + 2]));
        parts.push(new Float32Array(len));
        break;
      }
      case 6:
        // Remember where the repeated blocks start; the section plays count + 1 times.
        repeatStart = p + 4 + size;
        repeatCount = bytes[d] | (bytes[d + 1] << 8);
        break;
      case 7:
        // Endless repeats (0xFFFF) are played once; sound effects should end.
        if (repeatStart >= 0 && repeatCount > 0 && repeatCount < 0xffff) {
          repeatCount--;
          p = repeatStart;
          continue;
        }
        break;
      case 8: {
        // Extended block: a 16-bit time constant, which counts stereo as twice the rate.
        const tc = bytes[d] | (bytes[d + 1] << 8);
        const stereo = bytes[d + 3] === 1;
        sampleRate = Math.round(256_000_000 / ((stereo ? 2 : 1) * (65536 - tc)));
        break;
      }
      case 9: {
        sampleRate = bytes[d] | (bytes[d + 1] << 8) | (bytes[d + 2] << 16) | (bytes[d + 3] << 24);
        // Channels (d + 5) and codec (d + 6) are not checked; samples follow 12 header bytes.
        const bits = bytes[d + 4];
        const data = bytes.subarray(d + 12, end);
        parts.push(bits === 16 ? pcm16(data) : pcm8(data));
        break;
      }
    }
    p = d + size;
  }

  const total = parts.reduce((n, s) => n + s.length, 0);
  const samples = new Float32Array(total);
  let o = 0;
  for (const s of parts) {
    samples.set(s, o);
    o += s.length;
  }
  return { sampleRate: sampleRate || 8000, samples };
}

function pcm8(data: Uint8Array): Float32Array {
  const out = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) out[i] = (data[i] - 128) / 128;
  return out;
}

// Creative ADPCM tables (as implemented by the Sound Blaster DSP; see DOSBox sblaster.cpp).
// Codec 1 packs two 4-bit codes per byte, codec 2 three codes (3, 3, 2 bits; "2.6-bit")
// and codec 3 four 2-bit codes. Each code plus the current scale indexes scaleMap for the
// step added to the 8-bit reference sample and adjustMap for the change to the scale.
interface AdpcmTable {
  bits: number[]; // bit widths of the codes packed in a byte, high bits first
  scaleMap: number[];
  adjustMap: number[];
}

interface AdpcmState {
  reference: number;
  scale: number;
}

const ADPCM: Record<number, AdpcmTable> = {
  1: {
    bits: [4, 4],
    scaleMap: [
      0, 1, 2, 3, 4, 5, 6, 7, 0, -1, -2, -3, -4, -5, -6, -7, 1, 3, 5, 7, 9, 11, 13, 15, -1, -3, -5, -7, -9, -11, -13, -15, 2, 6, 10, 14, 18, 22, 26, 30, -2, -6,
      -10, -14, -18, -22, -26, -30, 4, 12, 20, 28, 36, 44, 52, 60, -4, -12, -20, -28, -36, -44, -52, -60,
    ],
    adjustMap: [
      0, 0, 0, 0, 0, 16, 16, 16, 0, 0, 0, 0, 0, 16, 16, 16, 240, 0, 0, 0, 0, 16, 16, 16, 240, 0, 0, 0, 0, 16, 16, 16, 240, 0, 0, 0, 0, 16, 16, 16, 240, 0, 0, 0,
      0, 16, 16, 16, 240, 0, 0, 0, 0, 0, 0, 0, 240, 0, 0, 0, 0, 0, 0, 0,
    ],
  },
  2: {
    bits: [3, 3, 2],
    scaleMap: [
      0, 1, 2, 3, 0, -1, -2, -3, 1, 3, 5, 7, -1, -3, -5, -7, 2, 6, 10, 14, -2, -6, -10, -14, 4, 12, 20, 28, -4, -12, -20, -28, 5, 15, 25, 35, -5, -15, -25, -35,
    ],
    adjustMap: [0, 0, 0, 8, 0, 0, 0, 8, 248, 0, 0, 8, 248, 0, 0, 8, 248, 0, 0, 8, 248, 0, 0, 8, 248, 0, 0, 8, 248, 0, 0, 8, 248, 0, 0, 0, 248, 0, 0, 0],
  },
  3: {
    bits: [2, 2, 2, 2],
    scaleMap: [0, 1, 0, -1, 1, 3, -1, -3, 2, 6, -2, -6, 4, 12, -4, -12, 8, 24, -8, -24, 6, 48, -16, -48],
    adjustMap: [0, 4, 0, 4, 252, 4, 252, 4, 252, 4, 252, 4, 252, 4, 252, 4, 252, 4, 252, 4, 252, 0, 252, 0],
  },
};

function decodeAdpcm(data: Uint8Array, t: AdpcmTable, s: AdpcmState): Float32Array {
  const out = new Float32Array(data.length * t.bits.length);
  const max = t.scaleMap.length - 1;
  let o = 0;
  for (const byte of data) {
    let shift = 8;
    for (const width of t.bits) {
      shift -= width;
      // The 2.6-bit format's last code has 2 bits stored as the top of a 3-bit value.
      let code = (byte >> shift) & ((1 << width) - 1);
      if (t.bits.length === 3 && width === 2) code <<= 1;
      const idx = Math.max(0, Math.min(max, code + s.scale));
      s.reference = Math.max(0, Math.min(255, s.reference + t.scaleMap[idx]));
      s.scale = (s.scale + t.adjustMap[idx]) & 0xff;
      out[o++] = (s.reference - 128) / 128;
    }
  }
  return out;
}

function pcm16(data: Uint8Array): Float32Array {
  const out = new Float32Array(data.length >> 1);
  for (let i = 0; i < out.length; i++) out[i] = (((data[i * 2] | (data[i * 2 + 1] << 8)) << 16) >> 16) / 32768;
  return out;
}

/**
 * Encodes mono samples (-1..1) as an 8-bit unsigned PCM Creative Voice File, the kind a
 * Sound Blaster plays. The rate is stored as a time constant, so it is rounded the way
 * the card did (11025 Hz is stored as 10,989 Hz: time constant 165, 1,000,000 / 91).
 */
export function encodeVoc(samples: Float32Array, sampleRate = 11025): Uint8Array {
  const timeConstant = Math.max(0, Math.min(255, Math.round(256 - 1_000_000 / sampleRate)));
  const BLOCK = 0xfffff0; // a sound block's size is 24 bits
  // The first block is type 1 (time constant and codec ahead of the samples); any more
  // samples than fit in one block go in type 2 continuation blocks.
  const blocks: Uint8Array[] = [];
  let start = 0;
  do {
    const part = samples.subarray(start, Math.min(samples.length, start + BLOCK));
    const first = start === 0;
    const head = first ? 6 : 4;
    const b = new Uint8Array(head + part.length);
    const size = part.length + (first ? 2 : 0);
    b[0] = first ? 1 : 2;
    b[1] = size & 255;
    b[2] = (size >> 8) & 255;
    b[3] = (size >> 16) & 255;
    if (first) {
      b[4] = timeConstant;
      b[5] = 0; // codec: 8-bit PCM
    }
    for (let i = 0; i < part.length; i++) b[head + i] = Math.max(0, Math.min(255, Math.round(part[i] * 127 + 128)));
    blocks.push(b);
    start += BLOCK;
  } while (start < samples.length);
  const header = new Uint8Array(26);
  for (let i = 0; i < SIGNATURE.length; i++) header[i] = SIGNATURE.charCodeAt(i);
  // Header: signature, first block offset 26, version 1.10 and its check word.
  header[20] = 26;
  const version = 0x010a;
  header[22] = version & 255;
  header[23] = version >> 8;
  const check = (~version + 0x1234) & 0xffff;
  header[24] = check & 255;
  header[25] = check >> 8;
  const out = new Uint8Array(header.length + blocks.reduce((n, b) => n + b.length, 0) + 1);
  out.set(header);
  let p = header.length;
  for (const b of blocks) {
    out.set(b, p);
    p += b.length;
  }
  return out; // the last byte stays 0: the terminator block
}
