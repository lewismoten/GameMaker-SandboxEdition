// Pictures of the lessons (never on the disk), for the progress shots: a 16x10 block view of each level where its signs
// stand, with Kit in it; the water frames and a shore loop side by side (what the manual's pages show); and the same view
// at two moments, so the moving water can be told from the still.
//   cd web && npx vite-node ../games/shore/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { buildTopHeroBlocks } from '../../kit/starter/topHero';
import { finishBlocks } from '../src/blocks';
import { buildLevels } from '../src/levels';
import { FRAMES, waterFrame } from '../src/water';
import { REACH, S, shoreFrame } from '../src/shoreTiles';
import { mapAt } from './frames';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const top = buildTopHeroBlocks(pal);
const OX = 18;
const OY = 38;

/** A 16x10 block view of level n centered on level block (cx, cy), Kit in the middle, `tick` ticks in. */
const view = (n: 0 | 1, cx: number, cy: number, pose: string, tick: number) => {
  const l = levels[n];
  const bbl = finishBlocks(l);
  const kit = [{ pixels: Uint8Array.from(top.pics.get(pose)!.px), x: OX + cx, y: OY + cy }];
  return renderRegion(mapAt(l, tick), bbl, mbl, set, OX + cx - 8, OY + cy - 5, 16, 10, kit);
};
const shot = (name: string, n: 0 | 1, cx: number, cy: number, pose: string, tick = 0) => writePng(join(out, name), view(n, cx, cy, pose, tick), pal.pal, 3);
shot('one-1-start.png', 0, 4, 7, 'down.stand');
shot('one-2-lockstep-t0.png', 0, 18, 7, 'right.0', 0);
shot('one-2-lockstep-t10.png', 0, 18, 7, 'right.0', 10);
shot('one-3-starts-t0.png', 0, 44, 7, 'right.1', 0);
shot('one-3-starts-t10.png', 0, 44, 7, 'right.1', 10);
shot('two-1-start.png', 1, 6, 9, 'right.stand');
shot('two-2-cove.png', 1, 19, 9, 'right.0');
shot('two-3-point.png', 1, 43, 5, 'up.stand');

/** `frames` side by side, each `zoom` times, with a gap of 4 pixels. */
function strip(frames: Pixels[], zoom: number, name: string): void {
  const p = new Pixels(frames.length * 24 + 4, 28, pal.c('ink', 0));
  frames.forEach((f, i) => p.blit(f, 4 + i * 24, 4));
  writePng(join(out, name), p, pal.pal, zoom);
}
strip(
  Array.from({ length: FRAMES }, (_, f) => waterFrame(pal, f)),
  6,
  'frames-water.png',
);
strip(
  REACH.map((r) => shoreFrame(pal, S, r)),
  6,
  'frames-shore-edge.png',
);
console.log(`shots in ${out}`);
