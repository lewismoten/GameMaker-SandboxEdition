// Draws the frames the manual's "How this level is made" pages show (one star's four frames, the six loops with the ticks
// each takes) into manual.json, in the figures marked <figure data-frames="name">. Run it again whenever the art changes
// (it replaces what the figures hold), then format the file.
//   cd web && npx vite-node ../games/flicker/tools/manual.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { fillFigures, framesFigure } from '../../kit/starter/framesSvg';
import { buildLevels } from '../src/levels';
import { OWN, SPOTS, starFrame } from '../src/stars';

const { pal } = buildLevels();
const words = ['dim', 'glint', 'bright', 'glint'];
const figures = {
  star: framesFigure(
    pal,
    ([0, 1, 2, 1] as const).map((size, k) => ({ pic: starFrame(pal, SPOTS[0], size), label: `star0.${k}: ${words[k]}, ${OWN[0][k]} ticks` })),
  ),
  loops: framesFigure(
    pal,
    SPOTS.map((spot, v) => ({ pic: starFrame(pal, spot, 2), label: `star${v}: ${OWN[v].reduce((a, b) => a + b, 0)} ticks round` })),
    2,
  ),
};
const file = new URL('../manual.json', import.meta.url);
const manual = JSON.parse(readFileSync(file, 'utf8')) as { pages: { html: string }[] };
for (const page of manual.pages) page.html = fillFigures(page.html, figures);
writeFileSync(file, JSON.stringify(manual, null, 2) + '\n');
console.log('manual.json: frames drawn');
