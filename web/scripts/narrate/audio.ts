// Sound files in and out for scripts/narrate.ts, through ffmpeg: reading a voice sample (.webm,
// .wav, .m4a, .mp3 or anything ffmpeg reads) as mono samples and keeping its clearest 10
// seconds, and writing a take as small, speech-tuned Ogg Opus.
import { execFileSync } from 'node:child_process';

const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';

/** Reads any file ffmpeg can decode as mono Float32 samples at `rate`. */
export function readMono(file: string, rate: number): Float32Array {
  const raw = execFileSync(FFMPEG, ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(rate), '-f', 'f32le', 'pipe:1'], { maxBuffer: 1 << 30 });
  return new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
}

/**
 * The clearest `seconds` of a sample: the window (in half-second steps) with the most speech,
 * counted as 50 ms frames well above the clip's quiet floor, the louder window winning a tie;
 * leading and trailing quiet are trimmed first. A shorter clip is only trimmed.
 */
export function clearestWindow(pcm: Float32Array, rate: number, seconds = 10): Float32Array {
  const hop = Math.round(rate * 0.05);
  const rms: number[] = [];
  for (let i = 0; i + hop <= pcm.length; i += hop) {
    let sum = 0;
    for (let j = i; j < i + hop; j++) sum += pcm[j] * pcm[j];
    rms.push(Math.sqrt(sum / hop));
  }
  if (!rms.length) return pcm;
  const sorted = [...rms].sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.1)];
  const loud = Math.max(floor * 4, sorted[sorted.length - 1] * 0.05);
  const voiced = rms.map((r) => r > loud);
  let first = voiced.indexOf(true);
  let last = voiced.lastIndexOf(true);
  if (first < 0) return pcm;
  // keep a breath of room around the words
  first = Math.max(0, first - 2);
  last = Math.min(rms.length - 1, last + 2);

  const span = Math.round(seconds / 0.05);
  if (last - first + 1 <= span) return pcm.slice(first * hop, (last + 1) * hop);
  let best = first;
  let bestScore = -1;
  let bestEnergy = -1;
  for (let start = first; start + span <= last + 1; start += 10) {
    let score = 0;
    let energy = 0;
    for (let k = start; k < start + span; k++) ((score += voiced[k] ? 1 : 0), (energy += rms[k]));
    if (score > bestScore || (score === bestScore && energy > bestEnergy)) ((best = start), (bestScore = score), (bestEnergy = energy));
  }
  return pcm.slice(best * hop, (best + span) * hop);
}

/**
 * Evens out a take's loudness: its speech (20 ms frames within 30 dB of the loudest) brought to
 * about -20 dBFS RMS, never peaking above -1 dBFS, so every clip plays at one level over the music.
 */
export function normalize(pcm: Float32Array, rate: number): Float32Array {
  const hop = Math.round(rate * 0.02);
  const frames: number[] = [];
  for (let i = 0; i + hop <= pcm.length; i += hop) {
    let sum = 0;
    for (let j = i; j < i + hop; j++) sum += pcm[j] * pcm[j];
    frames.push(sum / hop);
  }
  const top = Math.max(0, ...frames);
  const speech = frames.filter((f) => f > top / 1000);
  if (!speech.length) return pcm;
  const rms = Math.sqrt(speech.reduce((a, b) => a + b, 0) / speech.length);
  const peak = pcm.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  const gain = Math.min(0.1 / rms, 0.89 / peak);
  return pcm.map((v) => v * gain);
}

/** How clips are encoded: Opus's speech mode, mono, at `kbps`, from samples resampled to `rate`. */
export interface OggOptions {
  kbps: number;
  /** The sample rate handed to Opus (it narrows its band to fit the bitrate either way). */
  rate?: number;
}

/** The bitrate shipped clips use: small, and still clear over the tour's quiet music. */
export const CLIP_OGG: OggOptions = { kbps: 10, rate: 16000 };

/** Writes mono samples at `rate` to an Ogg Opus file. */
export function writeOgg(file: string, pcm: Float32Array, rate: number, o: OggOptions = CLIP_OGG): void {
  const input = Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const resample = o.rate && o.rate !== rate ? ['-ar', String(o.rate)] : [];
  execFileSync(
    FFMPEG,
    [
      '-v',
      'error',
      '-y',
      '-f',
      'f32le',
      '-ar',
      String(rate),
      '-ac',
      '1',
      '-i',
      'pipe:0',
      ...resample,
      '-c:a',
      'libopus',
      '-application',
      'voip',
      '-b:a',
      `${o.kbps}k`,
      '-map_metadata',
      '-1',
      file,
    ],
    { input },
  );
}
