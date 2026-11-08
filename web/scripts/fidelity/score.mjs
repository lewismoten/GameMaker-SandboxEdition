// Fidelity: aligns a web run (fidelityWeb.ts <prefix>.rgb + .clocks, 320x200 per game tick) with a decoded DOSBox
// level capture (raw rgb24, w x h) and scores it. The DOS picture is compared with the web frame's top left corner.
//   node scripts/fidelity/score.mjs <web prefix> <dos.rgb> <w> <h> <web tick to anchor> [out dir] [frames per tick 3.8496]
// 1. Anchor: the DOS frame that equals (or best matches) web tick <anchor>, searched over the whole capture.
// 2. Each later tick: the DOS frame within +-6 of "previous match + clock gap * 3.85" with the highest identical share.
// Prints "tick clock dosFrame share% diffPixels" lines, then a summary: ticks, mean, ticks 100%, first difference
// (tick, DOS frame, bounding box of the differing pixels). With an out dir it writes score.csv, and for the first
// difference side.png (web | DOS | diff mask) and for every 10th scored tick nothing more (keep it small).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const [prefix, dosFile, dw, dh, anchor, out, per = '3.8496'] = process.argv.slice(2);
const W = 320;
const w = Number(dw);
const h = Number(dh);
const clocks = readFileSync(`${prefix}.clocks`, 'utf8').split('\n').map(Number);
const web = readFileSync(`${prefix}.rgb`);
const dos = readFileSync(dosFile);
const ticks = web.length / (W * 200 * 3);
const nDos = dos.length / (w * h * 3);
const diffCount = (t, f) => {
  let d = 0;
  for (let y = 0; y < h; y++) {
    const a = (t * 200 + y) * W * 3;
    const b = (f * h + y) * w * 3;
    for (let x = 0; x < w; x++) {
      const i = a + x * 3;
      const j = b + x * 3;
      if (web[i] !== dos[j] || web[i + 1] !== dos[j + 1] || web[i + 2] !== dos[j + 2]) d++;
    }
  }
  return d;
};
const T0 = Number(anchor);
let prev = -1;
let bestD = Infinity;
for (let f = 0; f < nDos; f++) {
  const d = diffCount(T0, f);
  if (d < bestD) ((bestD = d), (prev = f));
  if (d === 0) break;
}
console.log(`anchor: web tick ${T0} = DOS frame ${prev} (${bestD} differing pixels)`);
// Monotone alignment (dynamic programming) inside a band of +-BAND DOS frames around the straight-line guess, on every
// second pixel; a DOS frame may be used by several ticks (DOS draws 70 a second, the game 18).
const BAND = Number(process.env.BAND ?? 40);
const sub = (t, f) => {
  let d = 0;
  for (let y = 0; y < h; y += 2) {
    const a = (t * 200 + y) * W * 3;
    const b = (f * h + y) * w * 3;
    for (let x = 0; x < w; x += 2) {
      const i = a + x * 3;
      const j = b + x * 3;
      if (web[i] !== dos[j] || web[i + 1] !== dos[j + 1] || web[i + 2] !== dos[j + 2]) d++;
    }
  }
  return d;
};
const n = Math.min(ticks - T0, Math.floor((nDos - 1 - prev) / Number(per)));
const guess = (k) => prev + (clocks[T0 + k] - clocks[T0]) * Number(per);
const lo = (k) => Math.max(0, Math.round(guess(k)) - BAND);
const cost = [];
const from = [];
for (let k = 0; k < n; k++) {
  const row = new Float64Array(2 * BAND + 1).fill(Infinity);
  const fr = new Int32Array(2 * BAND + 1).fill(-1);
  for (let i = 0; i <= 2 * BAND; i++) {
    const f = lo(k) + i;
    if (f >= nDos) break;
    const c = sub(T0 + k, f);
    if (k === 0) {
      if (f === prev) row[i] = c;
      continue;
    }
    // came from the best previous frame g with f-12 <= g <= f
    let bc = Infinity;
    let bg = -1;
    for (let g = Math.max(f - 12, lo(k - 1)); g <= f; g++) {
      const pi = g - lo(k - 1);
      if (pi < 0 || pi > 2 * BAND) continue;
      if (cost[k - 1][pi] < bc) ((bc = cost[k - 1][pi]), (bg = g));
    }
    if (bg >= 0) ((row[i] = bc + c), (fr[i] = bg));
  }
  cost.push(row);
  from.push(fr);
}
let bi = 0;
for (let i = 0; i <= 2 * BAND; i++) if (cost[n - 1][i] < cost[n - 1][bi]) bi = i;
const path = new Array(n);
let f = lo(n - 1) + bi;
for (let k = n - 1; k >= 0; k--) {
  path[k] = f;
  if (k > 0) f = from[k][f - lo(k)];
}
const rows = [];
let firstBad = null;
for (let k = 0; k < n; k++) {
  const t = T0 + k;
  const best = diffCount(t, path[k]);
  rows.push([t, clocks[t], path[k], ((1 - best / (w * h)) * 100).toFixed(3), best]);
  if (!firstBad && best > 0) firstBad = { t, f: path[k], best };
}
for (const r of rows) console.log(r.join(' '));
const exact = rows.filter((r) => r[4] === 0).length;
const mean = rows.reduce((s, r) => s + Number(r[3]), 0) / rows.length;
console.log(
  `SUMMARY ticks=${rows.length} exact=${exact} mean=${mean.toFixed(3)}% first_diff=${firstBad ? `tick ${firstBad.t} (clock ${clocks[firstBad.t]}) dosframe ${firstBad.f} pixels ${firstBad.best}` : 'none'}`,
);
if (out) {
  mkdirSync(out, { recursive: true });
  writeFileSync(`${out}/score.csv`, 'tick,clock,dosframe,share,diffpixels\n' + rows.map((r) => r.join(',')).join('\n'));
  if (firstBad) {
    const { t, f } = firstBad;
    let x0 = w,
      y0 = h,
      x1 = -1,
      y1 = -1;
    const side = Buffer.alloc(w * 3 * h * 3);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (t * 200 + y) * W * 3 + x * 3;
        const j = (f * h + y) * w * 3 + x * 3;
        const same = web[i] === dos[j] && web[i + 1] === dos[j + 1] && web[i + 2] === dos[j + 2];
        if (!same) ((x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y)));
        for (let k = 0; k < 3; k++) {
          side[y * w * 9 + x * 3 + k] = web[i + k];
          side[y * w * 9 + (w + x) * 3 + k] = dos[j + k];
          side[y * w * 9 + (2 * w + x) * 3 + k] = same ? 0 : 255;
        }
      }
    writeFileSync(`${out}/side.rgb`, side);
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
      `${out}/side.rgb`,
      '-vf',
      'scale=iw*2:ih*2:flags=neighbor',
      `${out}/side.png`,
    ]);
    execFileSync('rm', [`${out}/side.rgb`]);
    console.log(`first diff box x ${x0}-${x1} y ${y0}-${y1}; picture ${out}/side.png (web | DOS | diff)`);
  }
}
