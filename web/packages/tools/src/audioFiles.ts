// Node-only source audio conversion: native PCM WAVs and optional external FFmpeg; see NOTICE.md.
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { pcm8Wav } from './audioWav';
import { fileURLToPath } from 'node:url';
import { encodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';

export interface AudioFileOptions {
  /** Output mono sample rate. Defaults to Game-Maker's usual 11025 Hz. */
  sampleRate?: number;
  /** Executable name or path; FFmpeg is installed separately, never bundled. */
  ffmpegPath?: string;
  /** Maximum decoded mono samples (default 16 MiB). Exceeding it fails, never truncates. */
  maxSamples?: number;
  /** Maximum conversion time, in milliseconds (default 30000). */
  timeoutMs?: number;
}

export interface VocFileOptions extends Omit<AudioFileOptions, 'maxSamples'> {
  /** Maximum total VOC bytes, including headers (default 65535, the DOS size limit). */
  maxBytes?: number;
}

function positiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError(`${name} must be a positive integer`);
}

/**
 * Decode FLAC, Ogg, WAV or another FFmpeg-supported file to mono samples for encodeVoc.
 * The unsigned-byte mapping deliberately inverts encodeVoc, retaining all original PCM
 * values when lossless sources are decoded at their own sample rate. Other rates resample.
 */
export function decodeAudioFile(file: string | URL, options: AudioFileOptions = {}): Float32Array {
  const sampleRate = options.sampleRate ?? 11025;
  const maxSamples = options.maxSamples ?? 16 * 1024 * 1024;
  const timeout = options.timeoutMs ?? 30_000;
  positiveInteger(sampleRate, 'sampleRate');
  positiveInteger(maxSamples, 'maxSamples');
  positiveInteger(timeout, 'timeoutMs');
  if (sampleRate < 3906 || sampleRate > 1_000_000) throw new RangeError('sampleRate is outside the VOC time-constant range (3906–1000000 Hz)');
  const input = file instanceof URL ? fileURLToPath(file) : file;
  if (!input) throw new TypeError('An audio file path is required');
  let pcm: Uint8Array | undefined;
  // Native authoring WAVs decode without external programs. Large/other WAV variants use FFmpeg.
  if (/\.wav$/i.test(input) && statSync(input).size <= maxSamples + 65536) {
    const wav = pcm8Wav(readFileSync(input));
    if (wav?.sampleRate === sampleRate) pcm = wav.samples;
  }
  try {
    pcm ??= execFileSync(
      options.ffmpegPath ?? 'ffmpeg',
      [
        '-nostdin',
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        input,
        '-map',
        '0:a:0',
        '-vn',
        '-ac',
        '1',
        '-ar',
        String(sampleRate),
        '-af',
        'aresample=dither_method=none',
        '-c:a',
        'pcm_u8',
        '-f',
        'u8',
        'pipe:1',
      ],
      { timeout, maxBuffer: maxSamples, stdio: ['ignore', 'pipe', 'pipe'] },
    );
  } catch (cause) {
    const code = (cause as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') throw new Error('FFmpeg is required to convert audio files. Install it or set ffmpegPath.', { cause });
    if (code === 'ENOBUFS' || code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') throw new RangeError(`Decoded audio exceeds ${maxSamples} samples`, { cause });
    throw new Error('FFmpeg could not decode the audio file within the conversion limits.', { cause });
  }
  // Also check injected/custom executables that do not honor the normal output bound.
  if (pcm.length > maxSamples) throw new RangeError(`Decoded audio exceeds ${maxSamples} samples`);
  const samples = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) samples[i] = (pcm[i] - 128) / 127;
  return samples;
}

/** Convert source audio to a native mono, unsigned 8-bit VOC, enforcing DOS's size limit. */
export function audioFileToVoc(file: string | URL, options: VocFileOptions = {}): Uint8Array {
  const maxBytes = options.maxBytes ?? 65535;
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 34 || maxBytes > 65535) throw new RangeError('maxBytes must be between 34 and 65535');
  // A type-1 PCM VOC has 33 bytes of framing; no multi-block file fits the DOS limit.
  const samples = decodeAudioFile(file, { ...options, maxSamples: maxBytes - 33 });
  return encodeVoc(samples, options.sampleRate ?? 11025);
}
