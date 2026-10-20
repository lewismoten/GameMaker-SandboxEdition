// Creative Voice File (.voc) decoder for Sound Blaster digital sound effects.
// Supports 8-bit unsigned PCM (codec 0) and 16-bit PCM (block 9), silence and repeat blocks.

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
        const tc = bytes[d] | (bytes[d + 1] << 8);
        const stereo = bytes[d + 3] === 1;
        sampleRate = Math.round(256_000_000 / ((stereo ? 2 : 1) * (65536 - tc)));
        break;
      }
      case 9: {
        sampleRate = bytes[d] | (bytes[d + 1] << 8) | (bytes[d + 2] << 16) | (bytes[d + 3] << 24);
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
      0, 1, 2, 3, 4, 5, 6, 7, 0, -1, -2, -3, -4, -5, -6, -7, 1, 3, 5, 7, 9, 11, 13, 15, -1, -3, -5, -7, -9, -11, -13, -15, 2, 6, 10, 14, 18, 22, 26,
      30, -2, -6, -10, -14, -18, -22, -26, -30, 4, 12, 20, 28, 36, 44, 52, 60, -4, -12, -20, -28, -36, -44, -52, -60,
    ],
    adjustMap: [
      0, 0, 0, 0, 0, 16, 16, 16, 0, 0, 0, 0, 0, 16, 16, 16, 240, 0, 0, 0, 0, 16, 16, 16, 240, 0, 0, 0, 0, 16, 16, 16, 240, 0, 0, 0, 0, 16, 16, 16, 240,
      0, 0, 0, 0, 16, 16, 16, 240, 0, 0, 0, 0, 0, 0, 0, 240, 0, 0, 0, 0, 0, 0, 0,
    ],
  },
  2: {
    bits: [3, 3, 2],
    scaleMap: [
      0, 1, 2, 3, 0, -1, -2, -3, 1, 3, 5, 7, -1, -3, -5, -7, 2, 6, 10, 14, -2, -6, -10, -14, 4, 12, 20, 28, -4, -12, -20, -28, 5, 15, 25, 35, -5, -15,
      -25, -35,
    ],
    adjustMap: [
      0, 0, 0, 8, 0, 0, 0, 8, 248, 0, 0, 8, 248, 0, 0, 8, 248, 0, 0, 8, 248, 0, 0, 8, 248, 0, 0, 8, 248, 0, 0, 8, 248, 0, 0, 0, 248, 0, 0, 0,
    ],
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
