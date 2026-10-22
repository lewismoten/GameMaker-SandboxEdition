// Plays the side quests on the built disk: the royal hounds (Teddy in the Whistling Woods, Gwinn
// on the beach, the kennel gate), the Tome of Tomorrow (the Putoff Mines, the library rope),
// Sir Reginald (the Gloomwood, Doc Leo's tent flap) and the Tuit Table's pedestals.
//   cd web && npx vite-node ../games/realm/tools/sidecheck.ts
import { GameSim } from './sim';
import { Bot } from './bot';
import { C, SEQ } from '../src/ids';

const sim = new GameSim(undefined, 3);
const bot = new Bot(sim);
const scene = (desc: string) => sim.game.scenes.findIndex((s) => s.desc === desc);
const world = scene('Procrastia');
/** Starts Pip in a scene as if he'd walked in from the world (a shortcut for the test). */
const into = (desc: string) => {
  const to = scene(desc);
  const from = sim.game.scenes.findIndex((s) => s.links.some((l) => l.toScene === to));
  const link = sim.game.scenes[from].links.findIndex((l) => l.toScene === to);
  (sim as unknown as { enter: (s: number, p: number, l: number) => void }).enter(to, from, link);
};
const set = (...cells: [number, number][]) => new Set(cells.map(([x, y]) => `${x},${y}`));
const say = (s: string) => console.log(`${s}: dogs ${sim.meter(C.dogs)} book ${sim.meter(C.book)} chick ${sim.meter(C.chick)} gold ${sim.money} kazoo ${sim.meter(SEQ.kazoo)}`);
// steel and plenty of tonics for the trip
sim.ci.meter[SEQ.steel] = 30000;
sim.ci.meter[SEQ.tonic] = 20;

into('Procrastia');
await bot.talk(50, 44, 'Teddy');
await bot.talk(15, 61, 'Gwinn');
say('both hounds found');
await bot.enter(31, 45, 'Laterburg');
await bot.talk(83, 10, 'the kennel gate', set([83, 11]));
say('the kennel');
// the Tuit Table: with no pieces, a pedestal stays dark; with its piece it lights
const dark = sim.blockAt(67, 11);
await bot.goto(67, 12, 'the Tuit Table');
await bot.push('up', 4);
if (sim.blockAt(67, 11) !== dark) throw new Error('a pedestal lit with no piece');
sim.ci.meter[C.p1] = 2;
await bot.push('up', 4);
if (sim.blockAt(67, 11) === dark || sim.meter(C.p1) !== 2) throw new Error('the first pedestal did not light (or kept the piece)');
sim.ci.meter[C.p1] = 1;
say('the Tuit Table');
// the Tome: a lamp, the mines, the library
sim.ci.meter[C.lamp] = 2;
into('The Putoff Mines');
await bot.goto(50, 66, 'through the lamp door', set([50, 70]));
await bot.goto(26, 32, 'the Tome of Tomorrow');
say('the tome');
into('Laterburg');
await bot.talk(87, 47, 'the library rope', set([87, 48]));
say('the library');
// Sir Reginald and Doc Leo's tent
into('Procrastia');
sim.w.chr.x[0] = 76;
sim.w.chr.y[0] = 66;
await bot.talk(84, 75, 'Sir Reginald');
into('Eventually Falls');
await bot.talk(85, 47, "Doc Leo's tent flap", set([85, 48]));
say('the tent');
if (sim.meter(SEQ.kazoo) < 25) throw new Error('no kazoo lessons');
if (sim.meter(C.dogs) !== 1 || sim.meter(C.book) !== 1 || sim.meter(C.chick) !== 1) throw new Error('a side quest did not take its due');
void world;
console.log('side quests: all done');
