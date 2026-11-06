// Fidelity: one picture (web | DOS | diff mask), 2x, of a web tick and a DOS frame.
//   node scripts/fidelity/pair.mjs <web prefix> <dos.rgb> <w> <h> <web tick> <dos frame> <out.png>
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [prefix, dosFile, dw, dh, tt, ff, png] = process.argv.slice(2);
const W = 320,
  w = Number(dw),
  h = Number(dh),
  t = Number(tt),
  f = Number(ff);
const web = readFileSync(`${prefix}.rgb`),
  dos = readFileSync(dosFile);
const side = Buffer.alloc(w * 9 * h);
let d = 0;
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++) {
    const i = (t * 200 + y) * W * 3 + x * 3,
      j = (f * h + y) * w * 3 + x * 3;
    const same = web[i] === dos[j] && web[i + 1] === dos[j + 1] && web[i + 2] === dos[j + 2];
    if (!same) d++;
    for (let k = 0; k < 3; k++) {
      side[y * w * 9 + x * 3 + k] = web[i + k];
      side[y * w * 9 + (w + x) * 3 + k] = dos[j + k];
      side[y * w * 9 + (2 * w + x) * 3 + k] = same ? 0 : 255;
    }
  }
writeFileSync(`${png}.rgb`, side);
execFileSync('ffmpeg', [
  '-v',
  'error',
  '-y',
  '-f',
  'rawvideo',
  '-pix_fmt',
  'rgb24',
  '-s',
  `${w * 3}x${h}`,
  '-i',
  `${png}.rgb`,
  '-vf',
  'scale=iw*2:ih*2:flags=neighbor',
  png,
]);
rmSync(`${png}.rgb`);
console.log(`${png}: ${d} differing pixels`);
