// "Scanned at Lewis's desk": the owner's photos (.for-lewis/images, not in git) cropped,
// scaled down to about what a 1995 flatbed scan for a VGA game would keep, and saved here
// as small JPEGs that the game builds read (games/kit/photo.ts). The builds never touch the
// original photos, so they stay deterministic and work without them.
//
// Privacy: crops leave out the restaurant and charging-station signs, the library's charter
// sign and the pins on the clown jacket; the only plate shown is the CitiCar's, THE CHEZ.
//
// Run once (needs ffmpeg and cjpeg): cd web && npx vite-node ../games/kit/scans/scan.ts
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const PHOTOS = resolve(__dirname, '../../../.for-lewis/images');

type Box = [x0: number, y0: number, x1: number, y1: number]; // fractions of the photo

interface Scan {
  name: string;
  photo: string;
  crop: Box;
  /** Longest side of the scan, in square pixels. */
  size: number;
  /** Parts to blur (fractions of the cropped picture). */
  blur?: Box[];
}

const SCANS: Scan[] = [
  // Lewis and Teddy at the town gazebo; the banner on the far building is blurred
  { name: 'gazebo', photo: 'lewie-and-teddy-at-gazebo.jpg', crop: [0, 0, 1, 1], size: 320, blur: [[0.11, 0.06, 0.16, 0.27]] },
  { name: 'gwinn', photo: 'teddy-and-gwinn-in-grass.jpg', crop: [0, 0, 1, 1], size: 320 },
  { name: 'teddy', photo: 'teddy smiling.jpg', crop: [0.08, 0, 0.92, 0.84], size: 256 },
  // Doc Leo's first dress-out: down to the tie, short of the pin on his lapel
  { name: 'leo', photo: 'lewies-first-dressout-as-a-hobo-clown.jpg', crop: [0.1, 0.03, 0.9, 0.82], size: 256 },
  // in colonial dress beside General Washington; the tent's banner at the right is cropped off
  { name: 'colonial', photo: 'lewie colonial with George Washington.jpg', crop: [0, 0.05, 0.93, 1], size: 320 },
  // THE CHEZ, without the signs on the building above it
  { name: 'chez', photo: 'citicar-at-public-charging-station.webp', crop: [0.16, 0.34, 0.82, 0.87], size: 320 },
  // The Dog House; its charter sign is blurred
  { name: 'library', photo: 'lewies-little-free-library-with-wall-of-rock.jpg', crop: [0, 0, 1, 0.96], size: 256, blur: [[0.3, 0.09, 0.73, 0.185]] },
];

function photoSize(file: string): [number, number] {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file], {
    encoding: 'utf8',
  });
  const [w, h] = r.stdout.trim().split(',').map(Number);
  return [w, h];
}

function blurBox(rgb: Uint8Array, w: number, h: number, [x0, y0, x1, y1]: Box): void {
  const bx = [Math.floor(x0 * w), Math.floor(y0 * h), Math.ceil(x1 * w), Math.ceil(y1 * h)];
  const radius = 3;
  for (let pass = 0; pass < 4; pass++) {
    const src = rgb.slice();
    for (let y = bx[1]; y < bx[3]; y++)
      for (let x = bx[0]; x < bx[2]; x++)
        for (let ch = 0; ch < 3; ch++) {
          let sum = 0;
          let n = 0;
          for (let dy = -radius; dy <= radius; dy++)
            for (let dx = -radius; dx <= radius; dx++) {
              const sx = Math.min(bx[2] - 1, Math.max(bx[0], x + dx));
              const sy = Math.min(bx[3] - 1, Math.max(bx[1], y + dy));
              sum += src[(sy * w + sx) * 3 + ch];
              n++;
            }
          rgb[(y * w + x) * 3 + ch] = Math.round(sum / n);
        }
  }
}

for (const s of SCANS) {
  const file = resolve(PHOTOS, s.photo);
  const [pw, ph] = photoSize(file);
  const [x0, y0, x1, y1] = s.crop;
  const cw = Math.round((x1 - x0) * pw);
  const ch = Math.round((y1 - y0) * ph);
  const k = s.size / Math.max(cw, ch);
  const w = Math.round(cw * k);
  const h = Math.round(ch * k);
  const r = spawnSync(
    'ffmpeg',
    [
      '-v',
      'error',
      '-i',
      file,
      '-vf',
      `crop=${cw}:${ch}:${Math.round(x0 * pw)}:${Math.round(y0 * ph)},scale=${w}:${h}:flags=area`,
      '-frames:v',
      '1',
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgb24',
      '-',
    ],
    { maxBuffer: 64 << 20 },
  );
  if (r.status !== 0) throw new Error(`ffmpeg: ${r.stderr}`);
  const rgb = new Uint8Array(r.stdout);
  for (const b of s.blur ?? []) blurBox(rgb, w, h, b);
  const dir = mkdtempSync(join(tmpdir(), 'scan-'));
  const ppm = join(dir, 'in.ppm');
  writeFileSync(ppm, Buffer.concat([Buffer.from(`P6\n${w} ${h}\n255\n`), Buffer.from(rgb)]));
  const j = spawnSync('cjpeg', ['-quality', '88', '-sample', '1x1', '-optimize', ppm], { maxBuffer: 16 << 20 });
  rmSync(dir, { recursive: true });
  if (j.status !== 0) throw new Error(`cjpeg: ${j.stderr}`);
  writeFileSync(resolve(__dirname, `${s.name}.jpg`), j.stdout);
  console.log(`${s.name.padEnd(9)} ${w}x${h} ${j.stdout.length} bytes`);
}
