// RIFF WAVE files: what a Sound Blaster sample (.VOC) becomes for today's computers.
// 8-bit unsigned PCM, mono, at the sample's own rate: the same bytes the Sound Blaster's
// DAC played, so nothing is lost or resampled.

/** Float samples (-1..1) to 8-bit unsigned PCM, the way the .VOC stored them (silence = 128). */
export function toPcm8(samples: Float32Array): Uint8Array {
  const out = new Uint8Array(samples.length);
  for (let i = 0; i < samples.length; i++) out[i] = Math.max(0, Math.min(255, Math.round(samples[i] * 128 + 128)));
  return out;
}

/** A mono WAV file: 8-bit unsigned PCM (Uint8Array) or 16-bit signed PCM (Int16Array). */
export function encodeWav(pcm: Uint8Array | Int16Array, sampleRate: number): Uint8Array {
  const bytesPer = pcm instanceof Int16Array ? 2 : 1;
  const dataLen = pcm.length * bytesPer;
  const pad = dataLen & 1; // RIFF chunks are word aligned
  const out = new Uint8Array(44 + dataLen + pad);
  const v = new DataView(out.buffer);
  const tag = (o: number, s: string) => [...s].forEach((c, i) => (out[o + i] = c.charCodeAt(0)));
  const rate = Math.round(sampleRate);
  tag(0, 'RIFF');
  v.setUint32(4, 36 + dataLen + pad, true);
  tag(8, 'WAVE');
  tag(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * bytesPer, true);
  v.setUint16(32, bytesPer, true);
  v.setUint16(34, bytesPer * 8, true);
  tag(36, 'data');
  v.setUint32(40, dataLen, true);
  if (pcm instanceof Int16Array) for (let i = 0; i < pcm.length; i++) v.setInt16(44 + i * 2, pcm[i], true);
  else out.set(pcm, 44);
  return out;
}

/** Reads a PCM WAV back (for tests and checks): rate, bits and the raw sample bytes. */
export function parseWav(bytes: Uint8Array): { sampleRate: number; bits: number; channels: number; data: Uint8Array } {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const str = (o: number) => String.fromCharCode(...bytes.subarray(o, o + 4));
  if (str(0) !== 'RIFF' || str(8) !== 'WAVE') throw new Error('Not a WAV file');
  let p = 12;
  let fmt: { sampleRate: number; bits: number; channels: number } | undefined;
  while (p + 8 <= bytes.length) {
    const id = str(p);
    const len = v.getUint32(p + 4, true);
    if (id === 'fmt ') fmt = { channels: v.getUint16(p + 10, true), sampleRate: v.getUint32(p + 12, true), bits: v.getUint16(p + 22, true) };
    if (id === 'data' && fmt) return { ...fmt, data: bytes.subarray(p + 8, p + 8 + len) };
    p += 8 + len + (len & 1);
  }
  throw new Error('WAV without data');
}
