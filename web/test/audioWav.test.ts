// Native source WAVs convert without FFmpeg, preserving unsigned samples and chunk boundaries.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { audioFileToVoc, decodeAudioFile } from '@lewismoten/gamemaker-sandbox-tools/audio-files';
vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }));
const decoder = vi.mocked(execFileSync);
let temp: string;
beforeEach(() => {
  temp = mkdtempSync(join(tmpdir(), 'wav-source-'));
});
afterEach(() => {
  rmSync(temp, { recursive: true, force: true });
  vi.resetAllMocks();
});

function wav(samples: Uint8Array, junk = false): Buffer {
  const data = junk ? 46 : 36;
  const out = Buffer.alloc(data + 8 + samples.length);
  out.write('RIFF');
  out.writeUInt32LE(out.length - 8, 4);
  out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(8000, 24);
  out.writeUInt32LE(8000, 28);
  out.writeUInt16LE(1, 32);
  out.writeUInt16LE(8, 34);
  if (junk) {
    out.write('JUNK', 36);
    out.writeUInt32LE(1, 40);
    out[44] = 42;
  }
  out.write('data', data);
  out.writeUInt32LE(samples.length, data + 4);
  out.set(samples, data + 8);
  return out;
}
function file(bytes: Uint8Array): string {
  const p = join(temp, 'source.wav');
  writeFileSync(p, bytes);
  return p;
}

describe('native source WAV', () => {
  it('retains every sample byte without starting an external decoder', () => {
    const pcm = Uint8Array.from({ length: 256 }, (_, i) => i);
    const voc = audioFileToVoc(file(wav(pcm)), { sampleRate: 8000, ffmpegPath: '/not-installed' });
    expect(voc.subarray(32, -1)).toEqual(pcm);
    expect(voc[30]).toBe(131);
    expect(decoder).not.toHaveBeenCalled();
  });
  it('skips padded metadata chunks and applies the VOC output-size bound', () => {
    const source = file(wav(Uint8Array.of(0, 128, 255), true));
    expect(audioFileToVoc(source, { sampleRate: 8000 }).subarray(32, -1)).toEqual(Uint8Array.of(0, 128, 255));
    expect(() => audioFileToVoc(source, { sampleRate: 8000, maxBytes: 34 })).toThrow('exceeds 1 samples');
    expect(decoder).not.toHaveBeenCalled();
  });
  it('rejects truncated native data instead of returning part of a clip', () => {
    const bytes = wav(Uint8Array.of(128));
    bytes.writeUInt32LE(1000, 40);
    expect(() => decodeAudioFile(file(bytes), { sampleRate: 8000 })).toThrow('Truncated WAV');
    expect(decoder).not.toHaveBeenCalled();
  });
  it('uses the optional decoder when resampling is requested', () => {
    decoder.mockReturnValue(Buffer.from([128]));
    const source = file(wav(Uint8Array.of(128)));
    expect(decodeAudioFile(source)).toEqual(Float32Array.of(0));
    expect(decoder).toHaveBeenCalledTimes(1);
  });
});
