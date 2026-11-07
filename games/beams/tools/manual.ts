// Draws the pictures the manual's "How this level is made" pages show into manual.json, in the figures marked <figure data-frames="name">:
// the wall block and its lit twins at each density, the hill blocks with solid fog, with dithered fog and with none, the puff and the lanterns
// (their painted pixels in purple so a reader can see which ones they are). Run it again whenever the art changes (it replaces what the
// figures hold), then format the file.
//   cd web && npx vite-node ../games/beams/tools/manual.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { fillFigures, framesFigure } from '../../kit/starter/framesSvg';
import { DENSITIES, wallPicture } from '../src/hall';
import { clearHill, hillBlock } from '../src/hills';
import { haloPicture, lampPicture, puffPicture } from '../src/critters';
import { veil } from '../src/light';
import { buildLevels } from '../src/levels';

const { pal } = buildLevels();
const mark = pal.c('purple', 4);
const wall = wallPicture(pal);
/** A clear-pixel picture shown on the wall, so the reader sees what a monster looks like in place. */
const onWall = (pic: Pixels) => {
  const p = new Pixels(pic.w, pic.h);
  for (let y = 0; y < pic.h; y += 20) for (let x = 0; x < pic.w; x += 20) p.blit(wall, x, y);
  return p.blit(pic, 0, 0, 255);
};
const figures = {
  wall: framesFigure(
    pal,
    [
      { pic: wall, label: 'wall: the plain bricks' },
      ...DENSITIES.map((d) => ({ pic: veil(wall, d, pal.c('gold', 4)), label: `wallLit${d}${d === 100 ? ': solid, bricks gone' : ''}` })),
    ],
    3,
  ),
  dots: framesFigure(
    pal,
    DENSITIES.map((d) => ({ pic: veil(new Pixels(20, 20, pal.c('ink', 0)), d, mark), label: `${d} percent painted` })),
    3,
  ),
  hills: framesFigure(
    pal,
    [
      { pic: clearHill(pal, 0, 'fill', 0), label: 'the hill with no fog' },
      { pic: hillBlock(pal, 'solid', 0, 'fill', 0), label: 'solid fog: flat, trees gone' },
      { pic: hillBlock(pal, 'dither', 0, 'fill', 0), label: 'hill.dither.0.fill0: 75 percent' },
      { pic: hillBlock(pal, 'dither', 1, 'fill', 0), label: 'hill.dither.1.fill0: 50 percent' },
      { pic: hillBlock(pal, 'dither', 2, 'fill', 0), label: 'hill.dither.2.fill0: 25 percent' },
    ],
    3,
  ),
  ridge: framesFigure(
    pal,
    [0, 1, 2].map((v) => ({ pic: hillBlock(pal, 'dither', 1, 'ridge', v), label: `ridge${v}: the edge joins the next` })),
    3,
  ),
  puff: framesFigure(
    pal,
    [
      { pic: puffPicture(pal, mark), label: 'puff: painted pixels marked, the rest clear' },
      { pic: new Pixels(20, 20).blit(wall, 0, 0).blit(puffPicture(pal), 0, 0, 255), label: 'puff over a wall' },
    ],
    4,
  ),
  lamps: framesFigure(
    pal,
    (['solid', 'dither', 'soft'] as const).flatMap((h) => [
      { pic: haloPicture(pal, h, mark), label: `lamp.${h}: halo marked` },
      { pic: onWall(lampPicture(pal, h)), label: `lamp.${h} over a wall` },
    ]),
    2,
  ),
};
const file = new URL('../manual.json', import.meta.url);
const manual = JSON.parse(readFileSync(file, 'utf8'));
for (const p of manual.pages) p.html = fillFigures(p.html, figures);
writeFileSync(file, JSON.stringify(manual, null, 2) + '\n');
console.log('manual figures written');
