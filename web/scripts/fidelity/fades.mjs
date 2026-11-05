// Fidelity: how many of the web's presented screens (ALL=1 run: <prefix>.all.rgb + .all.txt) appear, pixel for pixel, in a
// DOSBox capture. Reports per scene: stored pictures, exact matches, and for the rest the best identical share among all DOS frames.
//   node scripts/fidelity/fades.mjs <web prefix> <dos.rgb> <w> <h> [scene ...]   (frames are compared on the top left w x h)
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const [prefix, dosFile, dw, dh, ...only] = process.argv.slice(2);
const W = 320,
  w = Number(dw),
  h = Number(dh);
const all = readFileSync(`${prefix}.all.rgb`);
const log = readFileSync(`${prefix}.all.txt`, 'utf8')
  .trim()
  .split('\n')
  .map((l) => l.split(' '));
const dos = readFileSync(dosFile);
const nDos = dos.length / (w * h * 3);
const crop = (buf, stride, base) => {
  const o = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) buf.copy(o, y * w * 3, base + y * stride * 3, base + y * stride * 3 + w * 3);
  return o;
};
const hashes = new Map();
for (let f = 0; f < nDos; f++)
  hashes.set(
    createHash('md5')
      .update(dos.subarray(f * w * h * 3, (f + 1) * w * h * 3))
      .digest('hex'),
    f,
  );
const sceneOf = new Map();
const clockOf = new Map();
for (const [idx, , ck, sc] of log) if (!sceneOf.has(idx)) (sceneOf.set(idx, sc), clockOf.set(idx, ck));
const rows = {};
for (const [idx, sc] of sceneOf) {
  if (only.length && !only.includes(sc)) continue;
  const pic = crop(all, W, Number(idx) * W * 200 * 3);
  const r = (rows[sc] ??= { pics: 0, exact: 0, best: [] });
  r.pics++;
  if (hashes.has(createHash('md5').update(pic).digest('hex'))) {
    r.exact++;
    continue;
  }
  let best = 0;
  for (let f = 0; f < nDos; f += 1) {
    let same = 0;
    const b = f * w * h * 3;
    for (let i = 0; i < w * h * 3; i += 7) if (pic[i] === dos[b + i]) same++;
    best = Math.max(best, same / ((w * h * 3) / 7));
  }
  r.best.push(best);
  (r.miss ??= []).push(`pic ${idx} clock ${clockOf.get(idx)} ${(best * 100).toFixed(1)}%`);
}
for (const [sc, r] of Object.entries(rows))
  console.log(
    r.miss ? `not exact: ${r.miss.join('; ')}` : '',
    `scene ${sc}: web pictures ${r.pics}, exact in DOS ${r.exact}, others best identical (sampled) mean ${(r.best.length ? (100 * r.best.reduce((a, b) => a + b, 0)) / r.best.length : 0).toFixed(1)}% min ${(100 * Math.min(1, ...r.best)).toFixed(1)}%`,
  );
