// Pictures of the lessons (never on the disk), for the progress shots, taken from the real engine
// as the bot plays: level 1 with balls at several sizes, level 2 with the arch far off, near, and
// the door open.
//   cd web && npx vite-node ../games/horizon/tools/shots.ts <outDir>
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
import { DOOR_COL } from '../src/view';
import { balls } from './route';
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

type Ghost = { x: number; y: number; block: number };
/** The balls on the road now, as the sprites to draw. */
const ballSprites = (): Ghost[] => balls(bot).map((b) => ({ x: b.x, y: b.y, block: set[sim.w.mm[b.id].monnum].pic[b.size][0] }));

/** The screen as the engine has it now: each map block as the block it has turned into, the balls and Kit on top (`ghosts`: balls seen earlier, drawn too). */
function frame(level: number, ghosts: Ghost[] = []) {
  const w = sim.w;
  const map = { ...levels[level].map.done(), monsters: [] } as GameMap;
  map.blocks = Uint8Array.from(w.map, (b) => w.blkmap[b]) as unknown as GameMap['blocks'];
  const pic = renderRegion(map, finishBlocks(levels[level].st), mbl, set, ORIGIN, ORIGIN, 16, 10);
  for (const g of [...ghosts, ...ballSprites()]) {
    const sprite = new Pixels(20, 20, 255);
    sprite.px.set(mbl[g.block].pixels);
    pic.blit(sprite, g.x, g.y, 255);
  }
  pic.blit(kit, bot.px.x, bot.px.y - 20, 255); // bot.px is the hero's lower block
  return pic;
}
const save = (name: string, pic: ReturnType<typeof frame>) => writePng(join(out, name), pic, pal.pal, 3);

// level 1: the balls seen every few ticks over two rolls down, in one picture, so each size shows
await bot.land();
const seen: Ghost[] = [];
for (let t = 0; t < 150; t++) {
  await bot.wait(1);
  if (t % 9 === 0) seen.push(...ballSprites().filter((g) => g.y < 175));
}
save('1-balls-grow.png', frame(0, seen));

// level 2: walk out of level 1, then the arch far off, near, and the door open
await bot.walk(DOOR_COL, 'the exit');
const t0 = sim.w.clock;
await bot.land();
const waitUntil = (tick: number) => bot.wait(Math.max(0, tick - (sim.w.clock - t0)));
await waitUntil(10);
save('2-arch-far.png', frame(1));
await waitUntil(300);
save('3-arch-near-door-barred.png', frame(1));
await waitUntil(380);
save('4-door-open.png', frame(1));
