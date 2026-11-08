// Pictures of the lessons (never on the disk), for the progress shots, taken from the real engine
// as the bot plays: level 1 at the start and 5 ticks later (the fence has moved a lot, the hills
// hardly at all), and level 2 with the suns filling and the door open.
//   cd web && npx vite-node ../games/parallax/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { StarterBot } from '../../kit/starter/bot';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { ORIGIN } from '../../kit/starter/map';
import { buildLevels, finishBlocks } from '../src/levels';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';
import { DOOR_COL } from '../src/view';
import { GameSim } from './sim';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
const set = monsterSet(mb);
const kit = heroPicture(buildHeroBlocks(pal), 'stand.top', 'stand');

const sim = new GameSim(undefined, 1);
const bot = new StarterBot(sim);

/** The screen as the engine has it now: each map block as the block it has turned into, Kit on top. */
function frame(level: number) {
  const w = sim.w;
  const map = { ...levels[level].map.done(), monsters: [] } as GameMap;
  map.blocks = Uint8Array.from(w.map, (b) => w.blkmap[b]) as unknown as GameMap['blocks'];
  const pic = renderRegion(map, finishBlocks(levels[level].st), mbl, set, ORIGIN, ORIGIN, 16, 10);
  pic.blit(kit, bot.px.x, bot.px.y - 20, 255); // bot.px is the hero's lower block
  return pic;
}
const save = (name: string, pic: ReturnType<typeof frame>) => writePng(join(out, name), pic, pal.pal, 3);

await bot.land();
await bot.wait(20);
save('1-three-speeds-a.png', frame(0));
await bot.wait(5);
save('2-three-speeds-5-ticks-later.png', frame(0));

await bot.walk(DOOR_COL, 'the exit');
const t0 = sim.w.clock;
await bot.land();
const waitUntil = (tick: number) => bot.wait(Math.max(0, tick - (sim.w.clock - t0)));
await waitUntil(10);
save('3-clouds-no-suns.png', frame(1));
await waitUntil(210);
save('4-two-suns-door-barred.png', frame(1));
await waitUntil(310);
save('5-door-open.png', frame(1));
