// Checks each level's two blocks (the one that stings and the safe one) the way a player who sees colors
// differently would meet them: with the color-vision matrices of games/kit/colorVision.ts, are the two
// still told apart? A pair is told apart by color (mean delta E of 25 or more) or by shape (a fifth of
// the block's cells differ in where they have ink). Level 1 must be told apart to normal eyes but NOT to
// deuteranopia (the lesson is that it fails); level 2 must be told apart to every kind of vision.
//   cd web && npx vite-node ../games/colors/tools/colorCheck.ts
// A finding here is a suggestion for an author: it measures two flat blocks, not a whole screen, and it
// cannot say how a person feels about a color.
import { deltaE, simulate, type Rgb, type Vision } from '../../kit/colorVision';
import { skyOf } from '../../kit/starter/palette';
import { buildLevels } from '../src/levels';

const { book, pal } = buildLevels();
const sky = skyOf(pal);
const rgb = (i: number): Rgb => [0, 1, 2].map((k) => (pal.pal[i * 3 + k] << 2) | (pal.pal[i * 3 + k] >> 4)) as Rgb;

/** The mean color of a block's own pixels (not the sky around it), as `v` sees it (or untouched). */
function mean(name: string, v?: Vision): Rgb {
  const px = [...book.pics.get(name)!.px].filter((c) => c !== sky && c !== 255);
  const sum = [0, 0, 0];
  for (const c of px) (v ? simulate(rgb(c), v) : rgb(c)).forEach((x, k) => (sum[k] += x));
  return sum.map((x) => x / px.length) as Rgb;
}

/** The share of cells where exactly one of the two blocks has ink. */
function shapeDifference(a: string, b: string): number {
  const pa = book.pics.get(a)!.px;
  const pb = book.pics.get(b)!.px;
  let diff = 0;
  for (let i = 0; i < pa.length; i++) if ((pa[i] === sky) !== (pb[i] === sky)) diff++;
  return diff / pa.length;
}

const KINDS: (Vision | undefined)[] = [undefined, 'deutan', 'protan', 'tritan'];
const LEVELS: { level: number; safe: string; hot: string; mustTell: Partial<Record<Vision | 'normal', boolean>> }[] = [
  { level: 1, safe: 'plateSafe', hot: 'plateHot', mustTell: { normal: true, deutan: false } },
  { level: 2, safe: 'plateStripe', hot: 'spikeRed', mustTell: { normal: true, deutan: true, protan: true, tritan: true } },
];

let bad = 0;
for (const { level, safe, hot, mustTell } of LEVELS) {
  const shape = shapeDifference(safe, hot);
  for (const v of KINDS) {
    const color = deltaE(mean(safe, v), mean(hot, v));
    const tells = color >= 25 || shape >= 0.2;
    const kind = v ?? 'normal';
    const want = mustTell[kind];
    const ok = want === undefined || want === tells;
    if (!ok) bad++;
    console.log(
      `level ${level} ${kind.padEnd(7)} color delta E ${color.toFixed(1).padStart(5)}  shape ${(shape * 100).toFixed(0).padStart(3)}%  ${tells ? 'told apart' : 'look alike'}${want === undefined ? '' : ok ? '  (as intended)' : '  <-- NOT as intended'}`,
    );
  }
}
if (bad) {
  console.error(`colorCheck: ${bad} pairs are not as the lesson needs`);
  process.exit(1);
}
console.log('colorCheck ok: level 1 fails for red-green alike, level 2 works for every kind of vision');
