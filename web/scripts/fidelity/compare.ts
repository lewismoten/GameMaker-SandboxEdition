// Fidelity spike: compares what the web engine drew (fidelityWeb.ts: <prefix>.rgb, 320x200 RGB,
// one frame per game tick, <prefix>.clocks) with a DOSBox capture (raw RGB frames of one size,
// 70.09 a second). The DOS picture may be smaller than 320x200 (DOSBox crops what the game
// leaves off); it is compared with the web frame's top left corner.
//   npx vite-node scripts/fidelity/compare.ts <web prefix> <dos.rgb> <dos width> <dos height> <dos frame of web tick T> <T> [dos frames per tick (3.85)]
// Web ticks before tick T (the level's first full frame, DOS frame <first>) are skipped.
// For each web tick it looks at the DOS frames within 2 of where the tick should fall, takes the
// best one, and prints the share of identical pixels. Prints the mean, how many ticks matched
// exactly, and the first tick below 99.9 %.
import { readFileSync } from 'node:fs';

const [prefix, dosFile, dw, dh, first, tick0, per = '3.8496'] = process.argv.slice(2);
const clocks = readFileSync(`${prefix}.clocks`, 'utf8').split('\n').map(Number);
const W = 320;
const w = Number(dw);
const h = Number(dh);
const web = readFileSync(`${prefix}.rgb`);
const dos = readFileSync(dosFile);
const ticks = web.length / (W * 200 * 3);
const dosFrames = dos.length / (w * h * 3);
const share = (t: number, f: number): number => {
  let same = 0;
  for (let y = 0; y < h; y++) {
    const a = (t * 200 + y) * W * 3;
    const b = (f * h + y) * w * 3;
    for (let x = 0; x < w * 3; x++) if (web[a + x] === dos[b + x]) same++;
  }
  return same / (w * h * 3);
};
const scores: number[] = [];
let firstBad = -1;
for (let t = 0; t < ticks; t++) {
  const f0 = Math.round(Number(first) + (clocks[t] - Number(tick0)) * Number(per));
  if (clocks[t] < Number(tick0)) continue;
  let best = 0;
  for (let f = Math.max(0, f0 - 2); f <= Math.min(dosFrames - 1, f0 + 2); f++) best = Math.max(best, share(t, f));
  scores.push(best);
  if (firstBad < 0 && best < 0.999) firstBad = clocks[t];
}
const exact = scores.filter((s) => s >= 0.999).length;
const n = scores.length;
console.log(`web ticks compared ${n} of ${ticks}, dos frames ${dosFrames}`);
console.log(
  `mean identical-pixel share ${(scores.reduce((a, b) => a + b, 0) / n).toFixed(4)}; ${exact}/${n} ticks identical; first game tick below 99.9%: ${firstBad}`,
);
console.log(scores.map((s) => s.toFixed(3)).join(' '));
