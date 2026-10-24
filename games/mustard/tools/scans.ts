// "Scanned" for MUSTARD SEED HUSTLE: seven frames of the song's animated cover (a mustard seed
// pops out of a mound of dirt, bounces and grows into a plant; .for-lewis/songs/mustard/
// cover-frames, not in git) saved as small JPEGs in games/kit/scans, in the order the title
// cartoon plays them. The build dithers them into its FLI (kit/photo.ts) and never needs the
// originals.
//
// Run once (needs ffmpeg and cjpeg): cd web && npx vite-node ../games/mustard/tools/scans.ts
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const FRAMES = resolve(__dirname, '../../../.for-lewis/songs/mustard/cover-frames');
const OUT = resolve(__dirname, '../../kit/scans');
const W = 219;
const H = 217;

// The screenshots in the order they were taken (from loops of the cover), and the order the
// story goes: the mound, the seed popping out of it, the jump, high in the air, landing, rooted,
// grown.
const shots = readdirSync(FRAMES)
  .filter((n) => n.endsWith('.png'))
  .sort();
const STORY = [1, 2, 0, 3, 4, 5, 6];

STORY.forEach((k, i) => {
  const r = spawnSync(
    'ffmpeg',
    [
      '-v',
      'error',
      '-i',
      join(FRAMES, shots[k]),
      '-vf',
      `scale=${W}:${H}:flags=area,format=rgb24`,
      '-frames:v',
      '1',
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgb24',
      '-',
    ],
    {
      maxBuffer: 64 << 20,
    },
  );
  if (r.status !== 0) throw new Error(`ffmpeg: ${r.stderr}`);
  const dir = mkdtempSync(join(tmpdir(), 'scan-'));
  const ppm = join(dir, 'in.ppm');
  writeFileSync(ppm, Buffer.concat([Buffer.from(`P6\n${W} ${H}\n255\n`), Buffer.from(r.stdout)]));
  const j = spawnSync('cjpeg', ['-quality', '85', '-sample', '1x1', '-optimize', ppm], { maxBuffer: 16 << 20 });
  rmSync(dir, { recursive: true });
  if (j.status !== 0) throw new Error(`cjpeg: ${j.stderr}`);
  writeFileSync(join(OUT, `seed${i + 1}.jpg`), j.stdout);
  console.log(`seed${i + 1}  ${shots[k]}  ${W}x${H} ${j.stdout.length} bytes`);
});
