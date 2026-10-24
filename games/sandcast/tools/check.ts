// Checks the built disk: the multi-block objects line up (tools/align.ts), and the bot plays the
// whole game (tools/route.ts) and must win without losing a life. Writes nothing; the
// walkthrough itself is recorded by tools/walkthrough.ts.
//   cd web && npx vite-node ../games/sandcast/tools/check.ts
import { align } from './align';
import { Bot } from './bot';
import { playAll } from './route';
import { GameSim, loadDisk } from './sim';

if (align()) throw new Error('sandcast: a multi-block object is out of line (above)');

// seeded as the walkthrough is (every scene's monsters start from rng(1))
const sim = new GameSim(loadDisk(), 1);
const bot = new Bot(sim);
let scene = -1;
let lowest = Infinity;
const scenes: string[] = [];
const tick = sim.tick.bind(sim);
sim.tick = async () => {
  if (sim.scene !== scene) {
    if (scene >= 0) scenes[scenes.length - 1] += ` low ${lowest}, left ${sim.ci.hitpts}`;
    scene = sim.scene;
    lowest = sim.ci.hitpts;
    scenes.push(`scene ${scene}: in ${sim.ci.hitpts}`);
  }
  const r = await tick();
  lowest = Math.min(lowest, sim.ci.hitpts);
  return r;
};
await playAll(bot);
scenes[scenes.length - 1] += ` low ${lowest}, left ${sim.ci.hitpts}`;
if (sim.ended !== 'won' || sim.deaths) throw new Error(`sandcast: the bot did not win cleanly (${sim.ended}, ${sim.deaths} lives lost)`);
console.log(scenes.join('\n'));
console.log(`sandcast: the bot won without losing a life in ${sim.total} ticks (${(sim.total / 18.2 / 60).toFixed(1)} min of play)`);
