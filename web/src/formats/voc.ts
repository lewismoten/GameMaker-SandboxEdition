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
        if (bytes[d + 1] === 0) parts.push(pcm8(bytes.subarray(d + 2, end)));
        break;
      }
      case 2:
        parts.push(pcm8(bytes.subarray(d, end)));
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

function pcm16(data: Uint8Array): Float32Array {
  const out = new Float32Array(data.length >> 1);
  for (let i = 0; i < out.length; i++) out[i] = (((data[i * 2] | (data[i * 2 + 1] << 8)) << 16) >> 16) / 32768;
  return out;
}
