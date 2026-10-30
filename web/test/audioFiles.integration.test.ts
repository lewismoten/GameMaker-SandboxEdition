// Local FFmpeg integration: lossless source formats must recreate the native VOC samples.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { audioFileToVoc } from '@lewismoten/gamemaker-sandbox-tools/audio-files';

const available = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
const pcm = Uint8Array.from({ length: 1024 }, (_, i) => i & 255);
let temp: string;
describe.skipIf(!available)('external audio decoder', () => {
  beforeAll(() => {
    temp = mkdtempSync(join(tmpdir(), 'source-audio-'));
    for (const format of ['flac', 'ogg']) execFileSync('ffmpeg', [
      '-y', '-v', 'error', '-f', 'u8', '-ar', '11025', '-ac', '1', '-i', 'pipe:0',
      '-c:a', 'flac', '-sample_fmt', 's16', '-metadata_header_padding', '0', '-f', format, join(temp, `audio.${format}`),
    ], { input: pcm, stdio: ['pipe', 'ignore', 'pipe'] });
  });
  afterAll(() => { if (temp) rmSync(temp, { recursive: true, force: true }); });
  for (const format of ['flac', 'ogg']) it(`converts ${format} source audio to the same unsigned VOC bytes`, () => {
    const voc = audioFileToVoc(pathToFileURL(join(temp, `audio.${format}`)));
    expect(voc.subarray(32, -1)).toEqual(pcm);
    expect(voc[30]).toBe(165);
  });
  it('fails rather than shortening an audio clip that exceeds the DOS limit', () => {
    expect(() => audioFileToVoc(join(temp, 'audio.flac'), { maxBytes: 34 })).toThrow('exceeds 1 samples');
  });
});
