// Draws the pictures the manual's "How this level is made" pages show into manual.json, in the figures marked
// <figure data-frames="name">: the maple's eight frames, the floating leaf's path, each kind's first frame and its resting
// picture, a crown's top blocks upright and leaning, and two of level 2's paths (a calm leaf and a gust leaf). Run it again
// whenever the art or a path changes (it replaces what the figures hold), then format the file.
//   cd web && npx vite-node ../games/leaves/tools/manual.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { fillFigures, framesFigure } from '../../kit/starter/framesSvg';
import { leafPicture, restingPicture, TUMBLE } from '../src/leafArt';
import { DROP, FLOAT_PATH, flightFor, modelPath } from '../src/leaves';
import { buildLevels } from '../src/levels';
import { KINDS, RAMP } from '../src/palette';
import { cell, crowns } from '../src/trees';
import { pathDiagram } from './diagram';

const { pal } = buildLevels();
const sky = (pic: Pixels) => new Pixels(20, 20, pal.c('sky', 3)).blit(pic, 0, 0, 255);
const maple = crowns(pal, 'maple', 23);
const figures = {
  frames: framesFigure(
    pal,
    TUMBLE.map((pose, k) => ({ pic: sky(leafPicture(pal, 'maple', pose)), label: `maple.${k}` })),
    3,
  ),
  float: framesFigure(
    pal,
    [{ pic: pathDiagram(pal, [{ march: FLOAT_PATH, color: pal.c('maple', 2) }], 5, DROP.tumble), label: 'the floating leaf: 9 corners' }],
    3,
  ),
  kinds: framesFigure(
    pal,
    KINDS.flatMap((kind) => [
      { pic: sky(leafPicture(pal, kind, TUMBLE[0])), label: `${kind}.0` },
      { pic: new Pixels(20, 20, pal.c('sky', 3)).rect(0, 19, 20, 1, pal.c('grass', 4)).blit(restingPicture(pal, kind), 0, 0, 255), label: `${kind}.rest` },
    ]),
    3,
  ),
  lean: framesFigure(
    pal,
    (['rest', 'lean1', 'lean2'] as const).map((pose) => ({
      pic: new Pixels(60, 20)
        .blit(cell(maple[pose], 0, 0), 0, 0)
        .blit(cell(maple[pose], 1, 0), 20, 0)
        .blit(cell(maple[pose], 2, 0), 40, 0),
      label: pose === 'rest' ? 'the top row upright' : pose === 'lean1' ? 'a little lean' : 'leaning hard',
    })),
    3,
  ),
  paths: framesFigure(
    pal,
    [
      {
        pic: pathDiagram(pal, [{ march: modelPath(flightFor('maple', 'calm', 0), DROP.calm), color: pal.c(RAMP.maple, 2), from: 2 }], 8, DROP.calm),
        label: 'a calm maple leaf',
      },
      {
        pic: pathDiagram(pal, [{ march: modelPath(flightFor('oak', 'gust', 0), DROP.gust), color: pal.c(RAMP.oak, 2) }], 22, DROP.gust),
        label: 'an oak leaf in a gust',
      },
    ],
    3,
  ),
};
const file = new URL('../manual.json', import.meta.url);
const manual = JSON.parse(readFileSync(file, 'utf8'));
for (const p of manual.pages) p.html = fillFigures(p.html, figures);
writeFileSync(file, JSON.stringify(manual, null, 2) + '\n');
console.log('manual figures written');
