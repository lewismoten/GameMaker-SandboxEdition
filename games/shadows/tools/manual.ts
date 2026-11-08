// Draws the pictures the manual's "How this level is made" pages show (a pip with each kind of shadow, the hop's six pictures,
// the bee's four and its shadow's) into manual.json, in the figures marked <figure data-frames="name">, with the shadow's pixels in
// purple so a reader can see which ones they are. Run it again whenever the art changes (it replaces what the figures hold), then format the file.
//   cd web && npx vite-node ../games/shadows/tools/manual.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { fillFigures, framesFigure } from '../../kit/starter/framesSvg';
import { BOB_DOWN, BOB_SHADOW, BOB_TICKS, HOP_LIFT, HOP_SAME, HOP_SHRINK, HOP_TICKS, beeBody, hopPicture, pipBody, shadePicture } from '../src/critters';
import { buildLevels } from '../src/levels';
import { withShadow } from '../src/shadow';

const { pal } = buildLevels();
const mark = pal.c('purple', 4);
const stack = (top: Pixels, bottom: Pixels) => {
  const p = new Pixels(20, 40, 255);
  p.px.set(top.px, 0);
  p.px.set(bottom.px, 400);
  return p;
};
const figures = {
  pip: framesFigure(
    pal,
    [
      { pic: withShadow(pipBody(pal, 0, false), 'solid', pal, 7), label: 'pip.0 in solid.mbl' },
      { pic: withShadow(pipBody(pal, 0, false), 'solid', pal, 7, mark), label: 'marked' },
      { pic: withShadow(pipBody(pal, 0, false), 'dither', pal, 7), label: 'pip.0 in dither.mbl' },
      { pic: withShadow(pipBody(pal, 0, false), 'dither', pal, 7, mark), label: 'marked' },
    ],
    4,
  ),
  hop: framesFigure(
    pal,
    HOP_LIFT.map((lift, k) => ({
      pic: hopPicture(pal, 'shrink', k, mark),
      label: `hopShrink.${k}: ${lift} up, shadow ${HOP_SHRINK[k] * 2} wide, ${HOP_TICKS[k]} ticks`,
    })),
    3,
  ),
  hopOthers: framesFigure(
    pal,
    [
      { pic: hopPicture(pal, 'none', 3), label: 'hopNone.3: no shadow' },
      { pic: hopPicture(pal, 'same', 0, mark), label: `hopSame.0: shadow ${HOP_SAME * 2} wide` },
      { pic: hopPicture(pal, 'same', 3, mark), label: `hopSame.3: still ${HOP_SAME * 2} wide at the top` },
    ],
    3,
  ),
  bee: framesFigure(
    pal,
    BOB_DOWN.flatMap((down, k) => [
      { pic: beeBody(pal, down, k % 2 === 0), label: `bee.${k}: ${down} down, ${BOB_TICKS[k]} ticks` },
      { pic: shadePicture(pal, k, mark), label: `shade.${k}: ${BOB_SHADOW[k] * 2} wide` },
    ]),
    2,
  ),
  stack: framesFigure(
    pal,
    BOB_DOWN.map((down, k) => ({ pic: stack(beeBody(pal, down, k % 2 === 0), shadePicture(pal, k, mark)), label: `bee.${k} over shade.${k}` })),
    3,
  ),
};
const file = new URL('../manual.json', import.meta.url);
const manual = JSON.parse(readFileSync(file, 'utf8'));
for (const p of manual.pages) p.html = fillFigures(p.html, figures);
writeFileSync(file, JSON.stringify(manual, null, 2) + '\n');
console.log('manual figures written');
