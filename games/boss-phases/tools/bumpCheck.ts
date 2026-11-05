// What the manual says about touching, checked on the built game (this starts in level 1, at the tunnel mouth):
// walking into Big Bug stops Kit in front of it, stings him a little (1 hit point a moment), costs no life in 2 seconds, does not count
// as a hit, and leaves the bug on its first stage.
//   cd web && npx vite-node ../games/boss-phases/tools/bumpCheck.ts
import { SCAN } from '../../kit/starter/ids';
import { CHAINS, STING } from '../src/monsters';
import { BUG_X } from '../src/levels';
import { play } from './play';
import { stageOf } from './route';

const { sim, bot } = await play(undefined, 0);
const fail = (m: string) => {
  console.error(`bumpCheck: ${m}`);
  process.exit(1);
};
await bot.walk(21, 'the tunnel mouth');
const hp = sim.ci.hitpts;
const lives = sim.ci.meter[1];
const score = sim.ci.score;
sim.press(SCAN.right);
await bot.wait(54 * 2);
sim.release(SCAN.right);
const x = bot.px.x / 20;
console.log(`pushed on for 2 seconds: stopped at block ${x.toFixed(2)} (the bug starts at ${BUG_X[0]}); hit points ${hp} -> ${sim.ci.hitpts}`);
if (x > BUG_X[0] - 0.5) fail('Kit got into the bug');
if (x < BUG_X[0] - 4) fail('Kit did not reach the bug');
if (hp - sim.ci.hitpts < STING) fail('touching the bug should sting');
if (sim.ci.meter[1] !== lives) fail('pushing for three seconds cost a life');
if (sim.ci.score !== score) fail('a touch must not score');
if (stageOf(bot, 0) !== CHAINS[0].first) fail('a touch must not count as a hit');
console.log('bumpCheck ok');
