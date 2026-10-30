// Source audio conversion keeps VOC bytes exact, bounds output and never uses a shell.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { audioFileToVoc, decodeAudioFile } from '@lewismoten/gamemaker-sandbox-tools/audio-files';
vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }));
const run = vi.mocked(execFileSync);
afterEach(() => vi.resetAllMocks());

describe('source audio conversion', () => {
  it('recreates every unsigned sample value and the original VOC rate byte', () => {
    const pcm = Uint8Array.from({ length: 256 }, (_, i) => i);
    run.mockReturnValue(Buffer.from(pcm));
    const voc = audioFileToVoc('voice.flac', { sampleRate: 8000 });
    expect(voc.subarray(32, -1)).toEqual(pcm);
    expect(voc[30]).toBe(131);
    expect(voc.length).toBe(pcm.length + 33);
  });

  it('uses literal file arguments, a chosen executable and bounded noninteractive output', () => {
    run.mockReturnValue(Buffer.from([128, 255]));
    const name = "audio with 'quotes' $(literal).ogg";
    expect(decodeAudioFile(name, { ffmpegPath: '/tools/ffmpeg', maxSamples: 8, timeoutMs: 123 })).toEqual(Float32Array.of(0, 1));
    const [exe, args, options] = run.mock.calls[0];
    expect(exe).toBe('/tools/ffmpeg');
    expect(args).toContain(name);
    expect(args).toContain('-nostdin');
    expect(args).toContain('aresample=dither_method=none');
    expect(options).toMatchObject({ timeout: 123, maxBuffer: 8, stdio: ['ignore', 'pipe', 'pipe'] });
    expect(options).not.toHaveProperty('shell');
  });

  it('accepts file URLs and rejects invalid limits before starting a decoder', () => {
    run.mockReturnValue(Buffer.from([128]));
    decodeAudioFile(new URL('file:///tmp/audio%20sample.flac'));
    expect(run.mock.calls[0][1]).toContain('/tmp/audio sample.flac');
    run.mockClear();
    for (const sampleRate of [0, -1, NaN, 1.5, 3905, 1_000_001]) expect(() => decodeAudioFile('x', { sampleRate })).toThrow(RangeError);
    expect(() => decodeAudioFile('x', { maxSamples: 0 })).toThrow(RangeError);
    expect(() => decodeAudioFile('x', { timeoutMs: 0 })).toThrow(RangeError);
    expect(() => audioFileToVoc('x', { maxBytes: 65536 })).toThrow(RangeError);
    expect(run).not.toHaveBeenCalled();
  });

  it('refuses oversized clips instead of silently truncating them', () => {
    run.mockReturnValue(Buffer.from([1, 2, 3]));
    expect(() => audioFileToVoc('voice.ogg', { maxBytes: 35 })).toThrow('exceeds 2 samples');
    run.mockImplementation(() => {
      throw Object.assign(new Error('too large'), { code: 'ENOBUFS' });
    });
    expect(() => decodeAudioFile('voice.ogg', { maxSamples: 10 })).toThrow('exceeds 10 samples');
  });

  it('explains a missing FFmpeg installation and retains other decoder diagnostics', () => {
    run.mockImplementation(() => {
      throw Object.assign(new Error('missing'), { code: 'ENOENT' });
    });
    expect(() => decodeAudioFile('voice.ogg')).toThrow('FFmpeg is required');
    const cause = new Error('invalid media');
    run.mockImplementation(() => {
      throw cause;
    });
    try {
      decodeAudioFile('voice.ogg');
      throw new Error('Conversion should fail');
    } catch (error) {
      expect((error as Error).cause).toBe(cause);
    }
  });
});
