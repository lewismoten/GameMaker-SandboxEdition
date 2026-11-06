// Draws the frames the manual's "How this level is made" pages show (the sea's four frames, one shore loop, the corners)
// into manual.json, in the figures marked <figure data-frames="name">. Run it again whenever the art changes (it replaces
// what the figures hold), then format the file.
//   cd web && npx vite-node ../games/shore/tools/manual.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { fillFigures, framesFigure } from '../../kit/starter/framesSvg';
import { buildLevels } from '../src/levels';
import { FRAMES, waterFrame } from '../src/water';
import { E, NE, REACH, S, N, W, shoreFrame } from '../src/shoreTiles';

const { pal } = buildLevels();
const reachName = ['wave low', 'wave coming in', 'wave at the top', 'wave going out'];
const figures = {
  water: framesFigure(
    pal,
    Array.from({ length: FRAMES }, (_, f) => ({ pic: waterFrame(pal, f), label: `sea.${f}` })),
  ),
  shore: framesFigure(
    pal,
    REACH.map((r, f) => ({ pic: shoreFrame(pal, S, r), label: `shore.${f}: ${reachName[f]}` })),
  ),
  corner: framesFigure(pal, [
    { pic: shoreFrame(pal, N | W, REACH[1]), label: 'water on two sides: sand rounded' },
    { pic: shoreFrame(pal, NE, REACH[1]), label: 'water at a corner: a round bite' },
    { pic: shoreFrame(pal, E | S | NE, REACH[1]), label: "the cove's edge" },
  ]),
};
const file = new URL('../manual.json', import.meta.url);
const manual = JSON.parse(readFileSync(file, 'utf8')) as { pages: { html: string }[] };
for (const page of manual.pages) page.html = fillFigures(page.html, figures);
writeFileSync(file, JSON.stringify(manual, null, 2) + '\n');
console.log('manual.json: frames drawn');
