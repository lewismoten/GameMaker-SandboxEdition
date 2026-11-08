// Pictures for the progress shots and a stranger's look at the art (never on the disk), zoomed:
//   leaves.png      each kind's eight frames and its resting picture, on the sky, at 6x
//   trees.png       the three crowns upright, a little lean and leaning hard, at 3x
//   paths.png       the floating leaf's path, a calm maple leaf's and an oak leaf's in a gust, at 4x
//   play-*.png      the game itself, played from walkthrough.json on the real engine, at 2x: the three leaves of level 1
//                   (the stiff, the spinning and the floating one) and level 2 before, during and after a gust
//   cd web && npx vite-node ../games/leaves/tools/shots.ts <outDir>
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import type { Walkthrough } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';
import { leafPicture, restingPicture, TUMBLE } from '../src/leafArt';
import { DROP, FLOAT_PATH, flightFor, modelPath } from '../src/leaves';
import { buildLevels } from '../src/levels';
import { KINDS, RAMP } from '../src/palette';
import { LEAN, crowns, trunkPicture } from '../src/trees';
import { pathDiagram } from './diagram';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal } = buildLevels();
const sky = pal.c('sky', 3);
{
  const p = new Pixels(9 * 22, 3 * 22, sky);
  KINDS.forEach((kind, row) => {
    TUMBLE.forEach((pose, k) => p.blit(leafPicture(pal, kind, pose), k * 22 + 1, row * 22 + 1, 255));
    p.rect(8 * 22, row * 22 + 21, 22, 1, pal.c('grass', 4)).blit(restingPicture(pal, kind), 8 * 22 + 1, row * 22 + 1, 255);
  });
  writePng(join(out, 'leaves.png'), p, pal.pal, 6);
}
{
  const p = new Pixels(9 * 64, 104, sky);
  KINDS.forEach((kind, i) =>
    (Object.keys(LEAN) as (keyof typeof LEAN)[]).forEach((pose, j) => {
      const x = (i * 3 + j) * 64;
      p.blit(crowns(pal, kind, 23 + i * 5)[pose], x + 2, 0)
        .blit(trunkPicture(pal, kind, false), x + 22, 60)
        .blit(trunkPicture(pal, kind, true), x + 22, 80);
    }),
  );
  writePng(join(out, 'trees.png'), p, pal.pal, 3);
}
{
  const a = pathDiagram(pal, [{ march: FLOAT_PATH, color: pal.c('maple', 2) }], 5, DROP.tumble);
  const b = pathDiagram(pal, [{ march: modelPath(flightFor('maple', 'calm', 0), DROP.calm), color: pal.c(RAMP.maple, 2), from: 2 }], 8, DROP.calm);
  const c = pathDiagram(pal, [{ march: modelPath(flightFor('oak', 'gust', 0), DROP.gust), color: pal.c(RAMP.oak, 2) }], 22, DROP.gust);
  const p = new Pixels(a.w + b.w + c.w + 16, Math.max(a.h, b.h, c.h), 0)
    .blit(a, 0, 0)
    .blit(b, a.w + 8, 0)
    .blit(c, a.w + b.w + 16, 0);
  writePng(join(out, 'paths.png'), p, pal.pal, 4);
}
// moments of the recorded walkthrough, as [scene, frame since the scene began (60 a second), name]
const MOMENTS: [number, number, string][] = [
  [2, 1100, 'play-tumble-stiff'],
  [2, 2050, 'play-tumble-spin'],
  [2, 2900, 'play-tumble-float'],
  [3, 840, 'play-gust-before'],
  [3, 905, 'play-gust-bend'],
  [3, 1010, 'play-gust-after'],
];
const walk = JSON.parse(readFileSync(new URL('../walkthrough.json', import.meta.url), 'utf8')) as Walkthrough;
const seen: Record<number, number> = {};
await replay('leaves', walk, {
  onFrame: (screen, scene) => {
    seen[scene] = (seen[scene] ?? 0) + 1;
    for (const [s, f, name] of MOMENTS) {
      if (s !== scene || f !== seen[scene]) continue;
      const p = new Pixels(320, 200);
      p.px.set(screen.pixels.subarray(0, 320 * 200));
      let max = 0;
      for (const v of screen.palette) max = Math.max(max, v);
      writePng(join(out, `${name}.png`), p, max > 63 ? screen.palette.map((v) => v >> 2) : screen.palette, 2);
    }
  },
});
console.log(`shots in ${out}`);
