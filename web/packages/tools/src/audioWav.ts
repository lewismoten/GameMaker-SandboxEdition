// RIFF/WAVE PCM header reader; format documented by Microsoft, credited in NOTICE.md.
export function pcm8Wav(bytes: Uint8Array): { samples: Uint8Array; sampleRate: number } | undefined {
  const tag = (at: number) => String.fromCharCode(...bytes.subarray(at, at + 4));
  if (bytes.length < 12 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return undefined;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let sampleRate: number | undefined;
  let samples: Uint8Array | undefined;
  for (let at = 12; at + 8 <= bytes.length;) {
    const name = tag(at);
    const size = view.getUint32(at + 4, true);
    const start = at + 8;
    if (size > bytes.length - start) throw new Error('Truncated WAV chunk');
    if (name === 'fmt ') {
      if (size < 16) throw new Error('Truncated WAV format');
      if (view.getUint16(start, true) !== 1 || view.getUint16(start + 2, true) !== 1 || view.getUint16(start + 14, true) !== 8) return undefined;
      if (view.getUint16(start + 12, true) !== 1) throw new Error('Invalid mono 8-bit WAV alignment');
      sampleRate = view.getUint32(start + 4, true);
      if (!sampleRate) throw new Error('Invalid WAV sample rate');
    } else if (name === 'data') samples = bytes.subarray(start, start + size);
    at = start + size + (size & 1);
  }
  if (!sampleRate || !samples) throw new Error('WAV is missing its format or sample data');
  return { sampleRate, samples };
}
