// Pictures of the lessons (never on the disk), for the progress shots, taken from the real engine as
// the bot plays: level 1 at three moments of the wobble, level 2 with a puddle ahead and just after
// it hid, level 3 in the evening; and a strip of level 1's hills, 1x, one row of pixels per tick.
//   cd web && npx vite-node ../games/heat-waves/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { StarterBot } from '../../kit/starter/bot';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildLevels, finishBlocks } from '../src/levels';
import { MIRAGE, finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';
import { DOOR_COL, LONG, PUDDLES } from '../src/view';
import { GameSim } from './sim';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, cool, levels } = buildLevels();
const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
const set = monsterSet(mb);
const kit = heroPicture(buildHeroBlocks(pal), 'stand.top', 'stand');

const sim = new GameSim(undefined, 1);
const bot = new StarterBot(sim);

/** The screen as the engine has it now: each map block as the block it has turned into, the puddles and Kit on top. */
function frame(level: number): Pixels {
  const w = sim.w;
  const left = w.mx - ORIGIN;
  const map = { ...levels[level].map.done(), monsters: [] } as GameMap;
  map.blocks = Uint8Array.from(w.map, (b) => w.blkmap[b]) as unknown as GameMap['blocks'];
  const pic = renderRegion(map, finishBlocks(levels[level].st), mbl, set, w.mx, ORIGIN, 16, 10);
  for (let mm = 0; mm < w.mm.length; mm++) {
    const n = w.mm[mm].monnum;
    if (n !== MIRAGE && n !== MIRAGE + 1) continue;
    const { curx, cury, curPic } = w.mi[mm];
    const b = mbl[set[n].pic[Math.max(0, curPic)][0]];
    const p = new Pixels(20, 20);
    p.px.set(b.pixels);
    pic.blit(p, (curx[0] - ORIGIN - left) * 20 + curx[1], (cury[0] - ORIGIN) * 20 + cury[1], 255);
  }
  pic.blit(kit, bot.px.x - left * 20, bot.px.y - 20, 255); // bot.px is the hero's lower block
  return pic;
}
const save = (name: string, pic: Pixels, colors = pal.pal) => writePng(join(out, name), pic, colors, 3);

await bot.land();
await bot.wait(20);
for (const [i, dt] of [0, 4, 8].entries()) {
  await bot.wait(dt ? 4 : 0);
  save(`1-wobble-${String.fromCharCode(97 + i)}.png`, frame(0));
}
// the hills of level 1 (rows 4 to 6, the whole width) at six ticks in a row, 1x, stacked
const strip = new Pixels(320, 6 * 64, 0);
for (let t = 0; t < 6; t++) {
  strip.blit(frame(0).crop(0, 80, 320, 60), 0, t * 64, 256);
  await bot.wait(4);
}
writePng(join(out, '1-wobble-six-pictures-1x.png'), strip, pal.pal, 1);

await bot.walk(DOOR_COL, 'the exit');
await bot.land();
await bot.walk(PUDDLES[0] - 8);
await bot.wait(10);
save('2-mirage-ahead.png', frame(1));
await bot.walk(PUDDLES[0] - 6);
await bot.wait(3);
save('3-mirage-gone.png', frame(1));
await bot.walk(LONG.door, 'the exit');
await bot.land();
await bot.wait(30);
save('4-cool-evening.png', frame(2), cool);
