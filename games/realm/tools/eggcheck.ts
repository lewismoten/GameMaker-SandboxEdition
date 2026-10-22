// Finds the felt egg on the built disk: from Eventually Falls through the falls into the
// hermit's garden, waits for the nest to show the egg, picks it up, reads the stone.
//   cd web && npx vite-node ../games/realm/tools/eggcheck.ts
import { GameSim } from './sim';
import { Bot, SCAN } from './bot';
import { BLK } from '../src/ids';
import { MAXSCENELINKS } from '../../../web/src/formats/game';

const sim = new GameSim(undefined, 1);
const bot = new Bot(sim);
// a shortcut for the test: start play in the world at Eventually Falls' gate
const falls = sim.game.scenes.findIndex((s) => s.desc === 'Eventually Falls');
const world = sim.game.scenes.findIndex((s) => s.desc === 'Procrastia');
const toFalls = sim.game.scenes[world].links.findIndex((l) => l.toScene === falls);
(sim as unknown as { enter: (s: number, p: number, l: number) => void }).enter(falls, world, toFalls);
void MAXSCENELINKS;
await bot.goto(76, 11, 'the foot of the falls');
await bot.goto(77, 7, 'through the spray', new Set(['77,10', '77,9', '77,8']));
await bot.goto(80, 6, 'below the nest');
// wait for the nest to hold the egg, then step on and stoop
const nest = () => sim.w.blkmap[sim.blockAt(80, 5)];
let waited = 0;
while (nest() !== BLK.egg && waited++ < 600) await bot.wait(1);
if (nest() !== BLK.egg) throw new Error('the nest never showed the egg');
sim.press(SCAN.up);
await bot.wait(5);
sim.release(SCAN.up);
sim.press(SCAN.enter);
await bot.wait(3);
sim.release(SCAN.enter);
await bot.wait(4);
const inv = [...sim.ci.inv];
if (!inv.includes(BLK.egg)) throw new Error(`no egg in the satchel: ${inv} (pip at ${sim.pos.x},${sim.pos.y}; nest shows ${nest()})`);
console.log(`egg picked up after waiting ${waited} ticks; satchel ${inv.filter((b) => b < 150)}; egg counter ${sim.meter(29)}`);
await bot.goto(81, 5, 'by the stone');
await bot.talk(83, 5, 'the stone', new Set(['82,5']));
console.log('read the stone; back in', sim.game.scenes[sim.scene].desc);
