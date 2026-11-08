// Pictures of the lessons (never on the disk), for the progress shots and a stranger's look at the art, from the real engine:
//   frames.png             a firefly's four frames side by side over the sky's bands, at 6x
//   one-1-copies-*.png     level 1's six copies at four moments: all dark, then all lit at once
//   one-2-own-*.png        level 1's six kinds at the same four moments
//   two-meadow-*.png       a view of level 2 at eight moments a second apart
//   title.png              the title picture
//   cd web && npx vite-node ../games/lightning-bugs/tools/shots.ts <outDir>
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { ORIGIN } from '../../kit/starter/map';
import { FRAMES, fireflyFrame } from '../src/bugs';
import { GROUND } from '../src/dusk';
import { STEP_ROOM, buildLevels } from '../src/levels';
import { screenOf } from './screen';
import { GameSim } from './sim';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const book = levels[0].book;

{
  const p = new Pixels(FRAMES.length * 24 + 4, 28);
  for (let x = 0; x < p.w; x += 20) p.blit(book.pics.get('band1')!, x, 0).blit(book.pics.get('band2')!, x, 20);
  FRAMES.forEach((f, i) => p.blit(fireflyFrame(pal, f), 4 + i * 24, 4, 255));
  writePng(join(out, 'frames.png'), p, pal.pal, 6);
}

/** The top row of the screen when the hero stands on the meadow (the engine puts the hero five rows from the top). */
const TOP = ORIGIN + GROUND - 1 - 5;
/** Runs a level from its start and saves views of it at the ticks given, `cols` level columns from its left. */
async function moments(scene: number, cols: [string, number][], ticks: number[], scale = 2): Promise<void> {
  const sim = new GameSim(undefined, 1);
  if (scene !== 2) (sim as unknown as { enter: (s: number, p: number, l: number) => void }).enter(scene, 0, 0);
  let t = 0;
  for (const at of ticks) {
    while (t < at) {
      await sim.tick();
      t++;
    }
    for (const [name, col] of cols) writePng(join(out, `${name}-t${String(at).padStart(3, '0')}.png`), screenOf(sim, ORIGIN + col, TOP), pal.pal, scale);
  }
}
await moments(
  2,
  [
    ['one-1-copies', STEP_ROOM.copies[0][0] - 1],
    ['one-2-own', STEP_ROOM.own[0][0] - 3],
  ],
  [30, 44, 52, 90],
);
await moments(3, [['two-meadow', 18]], [40, 58, 76, 94, 112, 130, 148, 166]);
{
  const g = decodeGif(readFileSync(new URL('../disk/title.gif', import.meta.url)));
  const p = new Pixels(g.width, g.height);
  p.px.set(g.pixels);
  writePng(join(out, 'title.png'), p, g.palette, 2);
}
console.log(`shots in ${out}`);
