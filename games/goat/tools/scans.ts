// "Scanned" for THIRD GOAT FROM THE LEFT: the song's cover art, The Bard of Bizarre's logo and
// Doc Leo's profile picture (Lewis's own, in .for-lewis/songs/goat, not in git) cut down to
// small JPEGs in games/kit/scans, which the build dithers into its pictures (kit/photo.ts).
// Transparent corners are laid on the color each picture is pasted over.
//
// Run once (needs ffmpeg and cjpeg): cd web && npx vite-node ../games/goat/tools/scans.ts
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SONG = resolve(__dirname, '../../../.for-lewis/songs/goat');
const OUT = resolve(__dirname, '../../kit/scans');

const SCANS: { name: string; file: string; size: number; matte: string }[] = [
  { name: 'goatcover', file: 'third-goat-from-the-left-cover-art.png', size: 256, matte: 'black' },
  { name: 'bardlogo', file: 'bard-of-bizarre-logo_900x900_buffer.png', size: 200, matte: '0x341446' },
  { name: 'docleo', file: 'the bard of bizarre.png', size: 160, matte: '0x341446' },
];

for (const s of SCANS) {
  const r = spawnSync(
    'ffmpeg',
    [
      '-v', 'error', '-i', join(SONG, s.file),
      '-f', 'lavfi', '-i', `color=c=${s.matte}:s=${s.size}x${s.size}`,
      '-filter_complex', `[0:v]scale=${s.size}:${s.size}:flags=area,format=rgba[f];[1:v][f]overlay=format=auto,format=rgb24`,
      '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-',
    ],
    { maxBuffer: 64 << 20 },
  );
  if (r.status !== 0) throw new Error(`ffmpeg: ${r.stderr}`);
  const dir = mkdtempSync(join(tmpdir(), 'scan-'));
  const ppm = join(dir, 'in.ppm');
  writeFileSync(ppm, Buffer.concat([Buffer.from(`P6\n${s.size} ${s.size}\n255\n`), Buffer.from(r.stdout)]));
  const j = spawnSync('cjpeg', ['-quality', '88', '-sample', '1x1', '-optimize', ppm], { maxBuffer: 16 << 20 });
  rmSync(dir, { recursive: true });
  if (j.status !== 0) throw new Error(`cjpeg: ${j.stderr}`);
  writeFileSync(join(OUT, `${s.name}.jpg`), j.stdout);
  console.log(`${s.name.padEnd(10)} ${s.size}x${s.size} ${j.stdout.length} bytes`);
}
