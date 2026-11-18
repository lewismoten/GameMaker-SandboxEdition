// Spectral measurements and filtered rate reduction for plain mono PCM VOCs.
// OpenAI Codex (GPT-6.1 Sol), directed by Lewis Moten; project MIT license.
import { decodeVoc, isVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';

/** Hann-windowed 512-point spectra, mean removed; includes a padded final window. */
export function vocBandShares(bytes: Uint8Array, cutoffs: number[]): number[] {
  const { samples, sampleRate } = decodeVoc(bytes);
  const n = 512;
  const bands = cutoffs.map(() => 0);
  let total = 0;
  for (let start = 0; start < samples.length; start += n) {
    const count = Math.min(n, samples.length - start);
    let mean = 0;
    for (let j = 0; j < count; j++) mean += samples[start + j] / count;
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    for (let j = 0; j < count; j++) re[j] = (samples[start + j] - mean) * (0.5 - 0.5 * Math.cos((2 * Math.PI * j) / (n - 1)));
    // In-place radix-2 discrete Fourier transform.
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) [re[i], re[j]] = [re[j], re[i]];
    }
    for (let size = 2; size <= n; size *= 2) {
      for (let k = 0; k < size / 2; k++) {
        const a = (-2 * Math.PI * k) / size;
        const c = Math.cos(a),
          s = Math.sin(a);
        for (let j = k; j < n; j += size) {
          const other = j + size / 2;
          const r = re[other] * c - im[other] * s;
          const v = re[other] * s + im[other] * c;
          re[other] = re[j] - r;
          im[other] = im[j] - v;
          re[j] += r;
          im[j] += v;
        }
      }
    }
    for (let k = 1; k <= n / 2; k++) {
      const power = (re[k] ** 2 + im[k] ** 2) * (k === n / 2 ? 1 : 2);
      total += power;
      cutoffs.forEach((hz, i) => {
        if ((k * sampleRate) / n > hz) bands[i] += power;
      });
    }
  }
  return bands.map((power) => (total ? power / total : 0));
}

/** Study's centered Hann-windowed sinc: 32-source-sample radius, cutoff 0.45 × output rate. */
export function lowerPcmVoc(bytes: Uint8Array, cap: number): Uint8Array {
  if (!isVoc(bytes) || !Number.isFinite(cap)) return bytes;
  const p = bytes[20] | (bytes[21] << 8);
  const size = bytes[p + 1] | (bytes[p + 2] << 8) | (bytes[p + 3] << 16);
  // Preserve extended, packed, multiblock and malformed files verbatim.
  if (p !== 26 || bytes[p] !== 1 || bytes[p + 5] !== 0 || size < 3 || p + 4 + size + 1 !== bytes.length || bytes[bytes.length - 1] !== 0) return bytes;
  const from = Math.round(1e6 / (256 - bytes[p + 4]));
  if (cap < 1e6 / 256 || cap >= from) return bytes;
  const tc = Math.round(256 - 1e6 / cap);
  const to = Math.round(1e6 / (256 - tc));
  if (to >= from) return bytes;
  const source = bytes.subarray(p + 6, bytes.length - 1);
  const ratio = to / from;
  const count = Math.round(source.length * ratio);
  const out = new Uint8Array(33 + count);
  out.set(bytes.subarray(0, 32));
  out[p + 1] = (count + 2) & 255;
  out[p + 2] = ((count + 2) >> 8) & 255;
  out[p + 3] = (count + 2) >> 16;
  out[p + 4] = tc;
  const radius = 32,
    cutoff = 0.45 * ratio;
  for (let i = 0; i < count; i++) {
    const x = i / ratio;
    let sum = 0,
      weight = 0;
    for (let j = Math.ceil(x - radius); j <= Math.floor(x + radius); j++) {
      const d = x - j;
      const sinc = Math.abs(d) < 1e-12 ? 2 * cutoff : Math.sin(2 * Math.PI * cutoff * d) / (Math.PI * d);
      const w = sinc * (0.5 + 0.5 * Math.cos((Math.PI * d) / radius));
      sum += (source[Math.max(0, Math.min(source.length - 1, j))] - 128) * w;
      weight += w;
    }
    out[p + 6 + i] = Math.max(0, Math.min(255, Math.round(128 + sum / weight)));
  }
  return out;
}
