// Pictures of the lessons (never on the disk), for the progress shots, taken from the real engine
// as the bot plays: level 1 at three moments (the scenery has slid), level 2 with the car seen at
// several places round the loop in one picture, the lamps lit one by one, and the door open.
//   cd web && npx vite-node ../games/beltway/tools/shots.ts <outDir>
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
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';
import { orientIndex } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { CAR } from '../src/monsters';
import { DOOR_COL, LAP } from '../src/view';
import { car } from './route';
import { GameSim } from './sim';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
const set = monsterSet(mb);
const hero = buildHeroBlocks(pal);
const kit = heroPicture(hero, 'stand.top', 'stand');

const sim = new GameSim(undefined, 1);
const bot = new StarterBot(sim);

type Ghost = { x: number; y: number; block: number; orient: number };
/** The car now, as the sprite to draw. */
const carSprite = (): Ghost[] => {
  const c = car(bot);
  const i = sim.w.mm.findIndex((m) => m.monnum === CAR);
  return c && i >= 0 ? [{ x: c.x, y: c.y, block: set[CAR].pic[sim.w.mi[i].curPic][0], orient: c.orient }] : [];
};

/** The screen as the engine has it now: each map block as the block it has turned into, the car and Kit on top (`ghosts`: the car seen earlier, drawn too). */
function frame(level: number, ghosts: Ghost[] = []) {
  const w = sim.w;
  const map = { ...levels[level].map.done(), monsters: [] } as GameMap;
  map.blocks = Uint8Array.from(w.map, (b) => w.blkmap[b]) as unknown as GameMap['blocks'];
  const pic = renderRegion(map, finishBlocks(levels[level].st), mbl, set, ORIGIN, ORIGIN, 16, 10);
  for (const g of [...ghosts, ...carSprite()]) {
    const sprite = new Pixels(20, 20, 255);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) sprite.px[y * 20 + x] = mbl[g.block].pixels[orientIndex(g.orient, x, y)];
    pic.blit(sprite, g.x, g.y, 255);
  }
  pic.blit(kit, bot.px.x, bot.px.y - 20, 255); // bot.px is the hero's lower block
  return pic;
}
const save = (name: string, pic: ReturnType<typeof frame>) => writePng(join(out, name), pic, pal.pal, 3);

// level 1: the scenery at the start, a second later and two seconds later
await bot.land();
save('1-road-0s.png', frame(0));
await bot.wait(18);
save('2-road-1s.png', frame(0));
await bot.wait(20);
save('3-road-2s.png', frame(0));

// level 2: walk out of level 1, then the car seen every few ticks round one lap in one picture, the lamps, and the door open
await bot.walk(DOOR_COL, 'the exit');
const t0 = sim.w.clock;
await bot.land();
const waitUntil = (tick: number) => bot.wait(Math.max(0, tick - (sim.w.clock - t0)));
await waitUntil(10);
const seen: Ghost[] = [];
for (let t = 0; t < LAP; t++) {
  await bot.wait(1);
  if (t % 14 === 0) seen.push(...carSprite());
}
save('4-car-round-the-loop.png', frame(1, seen));
await waitUntil(LAP * 2 + 10);
save('5-two-laps.png', frame(1));
await waitUntil(LAP * 3 + 20);
save('6-door-open.png', frame(1));
