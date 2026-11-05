// Pictures of the lessons (never on the disk), for the progress shots: a 16x10 block view of each level with Kit in it at
// two moments, and the frames side by side (a pulse and a flicker, the flag's wave, the fall's pattern, a spark).
//   cd web && npx vite-node ../games/flicker/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { FIRE, SPARKS, fireFrame, sparkFrame } from '../src/camp';
import { bodyFrame } from '../src/falls';
import { FLICKER_A, FLICKER_B, PULSE, torchFrame } from '../src/flames';
import { flagFrames } from '../src/flag';
import { buildLevels } from '../src/levels';
import { finishBlocks } from '../src/loops';
import { mapAt } from './frames';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { levels } = buildLevels();
const mb = buildMonsterBlocks(levels[0].pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const hero = buildHeroBlocks(levels[0].pal);
const GROUND = 11;

/** A 16x10 block view of level n centered on column `col`, `tick` ticks in, Kit standing in the middle. */
function view(n: number, col: number, tick: number): Pixels {
  const l = levels[n];
  const h = heroPicture(hero, 'stand.top', 'stand');
  const kit = [
    { pixels: Uint8Array.from(h.px.subarray(0, 400)), x: ORIGIN + col, y: ORIGIN + GROUND - 2 },
    { pixels: Uint8Array.from(h.px.subarray(400)), x: ORIGIN + col, y: ORIGIN + GROUND - 1 },
  ];
  return renderRegion(mapAt(l, tick), finishBlocks(l), mbl, set, ORIGIN + col - 8, ORIGIN + 2, 16, 10, kit);
}
const shot = (name: string, n: number, col: number, tick: number) => writePng(join(out, name), view(n, col, tick), levels[n].pal.pal, 3);
shot('hall-1-pulse-and-flicker-a.png', 0, 20, 4);
shot('hall-1-pulse-and-flicker-b.png', 0, 20, 11);
shot('hall-2-flags.png', 0, 47, 0);
shot('falls-1-start.png', 1, 22, 0);
shot('falls-2-foot.png', 1, 22, 5);
shot('camp-1-fire.png', 2, 22, 3);
shot('camp-2-sparks.png', 2, 22, 14);

/** A row of frames, each on a card with a gap. */
function strip(name: string, n: number, pics: Pixels[], zoom: number): void {
  const w = pics[0].w;
  const bg = levels[n].pal.c('ink', 0);
  const s = new Pixels(pics.length * (w + 4) + 4, pics[0].h + 8, bg);
  pics.forEach((p, i) => s.blit(p, 4 + i * (w + 4), 4));
  writePng(join(out, name), s, levels[n].pal.pal, zoom);
}
const hp = levels[0].pal;
const hb = hp.c('sky', 3);
strip('frames-torch.png', 0, [...PULSE, ...FLICKER_A, ...FLICKER_B].map((s) => torchFrame(hp, hb, s)), 4);
const fl = flagFrames(hp, hb);
strip('frames-flag.png', 0, [0, 1, 2, 3].flatMap((k) => [fl.a[k], fl.b[k]]), 4);
strip('frames-fall.png', 1, ['L', 'M'].flatMap((c) => [0, 1, 2, 3].map((k) => bodyFrame(levels[1].pal, c as 'L' | 'M', k))), 4);
strip('frames-fire.png', 2, FIRE.map((s) => fireFrame(levels[2].pal, levels[2].pal.c('sky', 3), s)), 3);
strip('frames-spark.png', 2, SPARKS.flatMap((s) => s.path.map((at) => sparkFrame(levels[2].pal, levels[2].pal.c('sky', 3), at))), 4);
console.log(`shots in ${out}`);
