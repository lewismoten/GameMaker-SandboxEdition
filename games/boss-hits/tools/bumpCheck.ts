// What the manual says about touching, checked on the built game (the bot plays level 1 first, so this starts in level 2):
// walking into Big Bug stops Kit in front of it, stings him (never more than the bug's 5 hit points a touch could
// ever add up to a life), does not count as a hit, and the bug is still all five lights.
//   cd web && npx vite-node ../games/boss-hits/tools/bumpCheck.ts
import { SCAN } from '../../kit/starter/ids';
import { LAMPED, STING } from '../src/monsters';
import { BUG_X } from '../src/levels';
import { play } from './play';
import { stageOf } from './route';

const { sim, bot } = await play(undefined, 1);
const fail = (m: string) => {
  console.error(`bumpCheck: ${m}`);
  process.exit(1);
};
await bot.walk(28, 'the tunnel mouth');
const hp = sim.ci.hitpts;
const lives = sim.ci.meter[1];
const score = sim.ci.score;
sim.press(SCAN.right);
await bot.wait(54 * 3);
sim.release(SCAN.right);
const x = bot.px.x / 20;
console.log(`pushed on for 3 seconds: stopped at block ${x.toFixed(2)} (the bug is at ${BUG_X[1]}); hit points ${hp} -> ${sim.ci.hitpts}`);
if (x > BUG_X[1] - 0.5) fail('Kit got into the bug');
if (x < BUG_X[1] - 3) fail('Kit did not reach the bug');
if (hp - sim.ci.hitpts < STING) fail('touching the bug should sting');
if (sim.ci.meter[1] !== lives) fail('pushing for three seconds cost a life');
if (sim.ci.score !== score) fail('a touch must not score');
if (stageOf(bot, LAMPED) !== LAMPED) fail('a touch must not count as a hit');
console.log('bumpCheck ok');
