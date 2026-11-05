// Checks what the game promises about its views: in every one of the five palettes the words on a sign (ink on cream paper)
// keep a WCAG contrast ratio of at least 7 (the AAA level for text), and the five palettes are the same size as the first.
// It also lists which swatches run together in each view (delta E under 12 against a neighbor, as simulated),
// which is the point of the game; that part only reports. The simulation is an approximation of how some people see.
//   cd web && npx vite-node ../games/color-doors/tools/viewCheck.ts
import { deltaEBytes, type Rgb } from '@lewismoten/gamemaker-sandbox-engine/gfx/colorVision';
import { srgbToLinear } from '@lewismoten/gamemaker-sandbox-engine/gfx/colorVision';
import { SWATCHES } from '../src/colorBlocks';
import { buildLevels } from '../src/levels';
import { VIEWS, viewPalette } from '../src/views';

const { pal } = buildLevels();
const rgb = (p: Uint8Array, i: number): Rgb => [0, 1, 2].map((k) => (p[i * 3 + k] << 2) | (p[i * 3 + k] >> 4)) as Rgb;
const lum = ([r, g, b]: Rgb): number => 0.2126 * srgbToLinear(r / 255) + 0.7152 * srgbToLinear(g / 255) + 0.0722 * srgbToLinear(b / 255);
const ratio = (a: Rgb, b: Rgb): number => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

let bad = 0;
for (const v of VIEWS) {
  const p = viewPalette(pal.pal, v.kind);
  if (p.length !== 768) throw new Error(`${v.file} is ${p.length} bytes, not 768`);
  const r = ratio(rgb(p, pal.c('ink', 0)), rgb(p, pal.c('parch', 3)));
  const together: string[] = [];
  for (let i = 0; i < SWATCHES.length; i++)
    for (let j = i + 1; j < SWATCHES.length; j++)
      if (deltaEBytes(rgb(p, pal.c(`sw-${SWATCHES[i].word}`, 0)), rgb(p, pal.c(`sw-${SWATCHES[j].word}`, 0))) < 12)
        together.push(`${SWATCHES[i].word}/${SWATCHES[j].word}`);
  const ok = r >= 7;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${v.name.padEnd(22)} sign text contrast ${r.toFixed(1)}:1; swatches that look alike: ${together.join(' ') || 'none'}`);
}
if (bad) process.exit(1);
