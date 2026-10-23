// "Scanned" for THREAD THE NEEDLE, BROTHER CAMEL: the fourteen screenshots of the song's
// animated cover (a man by an oasis holds a needle up to a camel's nose; the picture closes in
// on the needle until its eye is an actual eye, looking back; .for-lewis/songs/needle/cover,
// not in git) saved as small JPEGs in games/kit/scans (needle1..14.jpg), in the order they
// were taken, which is the order the cover plays. The build dithers them into the title
// cartoon (kit/photo.ts) and never needs the originals.
//
// Run once (needs ffmpeg and cjpeg): cd web && npx vite-node ../games/needle/tools/scans.ts
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const FRAMES = resolve(__dirname, '../../../.for-lewis/songs/needle/cover');
const OUT = resolve(__dirname, '../../kit/scans');
const W = 219;
const H = 217;

const shots = readdirSync(FRAMES)
  .filter((n) => n.endsWith('.png'))
  .sort();
if (shots.length !== 14) throw new Error(`expected 14 cover frames, found ${shots.length}`);

shots.forEach((shot, i) => {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', join(FRAMES, shot), '-vf', `scale=${W}:${H}:flags=area,format=rgb24`, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], {
    maxBuffer: 64 << 20,
  });
  if (r.status !== 0) throw new Error(`ffmpeg: ${r.stderr}`);
  const dir = mkdtempSync(join(tmpdir(), 'scan-'));
  const ppm = join(dir, 'in.ppm');
  writeFileSync(ppm, Buffer.concat([Buffer.from(`P6\n${W} ${H}\n255\n`), Buffer.from(r.stdout)]));
  const j = spawnSync('cjpeg', ['-quality', '85', '-sample', '1x1', '-optimize', ppm], { maxBuffer: 16 << 20 });
  rmSync(dir, { recursive: true });
  if (j.status !== 0) throw new Error(`cjpeg: ${j.stderr}`);
  writeFileSync(join(OUT, `needle${i + 1}.jpg`), j.stdout);
  console.log(`needle${i + 1}  ${shot}  ${W}x${H} ${j.stdout.length} bytes`);
});
