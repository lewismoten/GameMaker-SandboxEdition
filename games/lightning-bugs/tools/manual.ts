// Draws the pictures the manual's "How this level is made" pages show into manual.json, in the figures marked
// <figure data-frames="name">: a firefly's four frames over the sky, one kind's blink frame by frame with its ticks, the frames
// with the glow's painted pixels in purple, and each kind's loop drawn as a line from where it starts. Run it again whenever
// the art changes (it replaces what the figures hold), then format the file.
//   cd web && npx vite-node ../games/lightning-bugs/tools/manual.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { fillFigures, framesFigure } from '../../kit/starter/framesSvg';
import { FRAMES, KINDS, STEP, blinkOf, fireflyFrame, roundOf, type Kind } from '../src/bugs';
import { buildLevels } from '../src/levels';

const { pal, levels } = buildLevels();
const book = levels[0].book;
const sky = book.pics.get('band2')!;
/** A clear-pixel picture over the sky, as the game shows it. */
const onSky = (pic: Pixels) => new Pixels(20, 20).blit(sky, 0, 0).blit(pic, 0, 0, 255);
const mark = pal.c('purple', 4);

/** A kind's loop: a line through its corners, 6 pixels a block, with a dot where it starts. */
function loopPicture(k: Kind): Pixels {
  const pts: [number, number][] = [[0, 0], ...k.path];
  const xs = pts.map(([x]) => x);
  const ys = pts.map(([, y]) => y);
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
  const S = 6;
  const p = new Pixels((Math.max(...xs) - x0 + 2) * S, (Math.max(...ys) - y0 + 2) * S, pal.c('sky', 1));
  const at = ([x, y]: [number, number]): [number, number] => [(x - x0 + 1) * S, (y - y0 + 1) * S];
  pts.forEach((pt, i) => {
    const [ax, ay] = at(pt);
    const [bx, by] = at(pts[(i + 1) % pts.length]);
    p.line(ax, ay, bx, by, pal.c('glow', 2));
  });
  const [sx, sy] = at([0, 0]);
  p.rect(sx - 1, sy - 1, 3, 3, pal.c('glow', 4));
  return p;
}

const words: Record<string, string> = { dark: 'dark', ember: 'an ember', dim: 'dim', bright: 'bright' };
const figures = {
  frames: framesFigure(
    pal,
    FRAMES.map((f) => ({ pic: onSky(fireflyFrame(pal, f)), label: `bug.${f}: ${words[f]}` })),
    3,
  ),
  blink: framesFigure(
    pal,
    blinkOf(KINDS[0]).map(([f, n], i) => ({ pic: onSky(fireflyFrame(pal, f)), label: `${i + 1}. ${f}, ${n} ticks` })),
    2,
  ),
  step: framesFigure(pal, [{ pic: loopPicture(STEP), label: `the copies' loop, blink ${roundOf(STEP)} ticks round` }], 3),
  glow: framesFigure(
    pal,
    FRAMES.filter((f) => f !== 'dark').map((f) => ({ pic: fireflyFrame(pal, f, mark), label: `bug.${f}: painted pixels marked, the rest clear` })),
    3,
  ),
  loops: framesFigure(
    pal,
    KINDS.map((k, i) => ({ pic: loopPicture(k), label: `kind ${i + 1}: ${roundOf(k)} ticks round${k.twice ? ', two flashes' : ''}` })),
    3,
  ),
};
const file = new URL('../manual.json', import.meta.url);
const manual = JSON.parse(readFileSync(file, 'utf8')) as { pages: { html: string }[] };
for (const page of manual.pages) page.html = fillFigures(page.html, figures);
writeFileSync(file, JSON.stringify(manual, null, 2) + '\n');
console.log('manual.json: frames drawn');
