// Pictures of the lessons (never on the disk), for the progress shots and a stranger's look at the art, zoomed:
//   beams-compare.png   the wall block and its four lit twins on a strip of wall, at 5x
//   fog-compare.png     a column of hills at each layer, solid fog beside dithered fog, at 5x
//   lamps.png           the three lanterns (60x60 glows) over the wall, at 3x
//   cd web && npx vite-node ../games/beams/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { DENSITIES, wallPicture } from '../src/hall';
import { hillBlock } from '../src/hills';
import { lampPicture } from '../src/critters';
import { veil } from '../src/light';
import { buildLevels } from '../src/levels';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal } = buildLevels();
const wall = wallPicture(pal);
{
  const p = new Pixels(5 * 20, 20, 0);
  [wall, ...DENSITIES.map((d) => veil(wall, d, pal.c('gold', 4)))].forEach((pic, i) => p.blit(pic, i * 20, 0));
  writePng(join(out, 'beams-compare.png'), p, pal.pal, 5);
}
{
  const p = new Pixels(6 * 20, 3 * 20, 0);
  (['solid', 'dither'] as const).forEach((zone, zi) =>
    [0, 1, 2].forEach((layer) => [0, 1, 2].forEach((v) => p.blit(hillBlock(pal, zone, layer, 'ridge', v), (zi * 3 + v) * 20, layer * 20))),
  );
  writePng(join(out, 'fog-compare.png'), p, pal.pal, 5);
}
{
  const p = new Pixels(3 * 64, 64, 0);
  (['solid', 'dither', 'soft'] as const).forEach((h, i) => {
    const w = new Pixels(60, 60);
    for (let y = 0; y < 60; y += 20) for (let x = 0; x < 60; x += 20) w.blit(wall, x, y);
    p.rect(i * 64, 0, 64, 64, 0).blit(w.blit(lampPicture(pal, h), 0, 0, 255), i * 64 + 2, 2);
  });
  writePng(join(out, 'lamps.png'), p, pal.pal, 3);
}
console.log(`shots in ${out}`);
