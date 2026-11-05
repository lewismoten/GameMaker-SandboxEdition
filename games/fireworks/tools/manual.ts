// Draws the frames the manual's "How this level is made" pages show (the rocket's two pictures, the small burst's six,
// the ring's and the willow's frames whole, each with the ticks it shows) into manual.json, in the figures marked
// <figure data-frames="name">. Run it again whenever the art changes (it replaces what the figures hold), then format
// the file.
//   cd web && npx vite-node ../games/fireworks/tools/manual.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { fillFigures, framesFigure } from '../../kit/starter/framesSvg';
import { nightPalette } from '../src/night';
import { burstKind, burstPicture, rocketPicture, sampleTimes } from '../src/sparks';

const pal = nightPalette();
/** A burst's frames whole, on the night sky so the dark sparks show, each labeled with its ticks. */
const frames = (name: 'pop' | 'ring' | 'willow', zoom: number) => {
  const kind = burstKind(name);
  return framesFigure(
    pal,
    sampleTimes(kind.ticks).map((t, k) => ({
      pic: burstPicture(pal, kind, t, k).map((_x, _y, c) => (c === 255 ? pal.c('sky', 3) : c)),
      label: `frame ${k + 1}: ${kind.ticks[k]} ticks`,
    })),
    zoom,
  );
};
const figures = {
  rocket: framesFigure(
    pal,
    [0, 1].map((f) => ({ pic: rocketPicture(pal, f).map((_x, _y, c) => (c === 255 ? pal.c('sky', 3) : c)), label: `rocket${f}: 2 ticks` })),
  ),
  pop: frames('pop', 3),
  ring: frames('ring', 2),
  willow: frames('willow', 2),
};
const file = new URL('../manual.json', import.meta.url);
const manual = JSON.parse(readFileSync(file, 'utf8')) as { pages: { html: string }[] };
for (const page of manual.pages) page.html = fillFigures(page.html, figures);
writeFileSync(file, JSON.stringify(manual, null, 2) + '\n');
console.log('manual.json: frames drawn');
