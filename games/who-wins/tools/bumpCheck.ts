// What the manual says about touching, checked on the built game (the bot plays level 1 first, so
// this starts in level 2):
//   1. Walking through the big one costs nothing: no hit points, no life, and it is still there.
//   2. Walking into the pip stops Kit in front of it with hit points and lives unchanged, and the
//      pip is still there (only a star pops it).
//   cd web && npx vite-node ../games/who-wins/tools/bumpCheck.ts
import { SCAN } from '../../kit/starter/ids';
import { BIG_STILL, PIP } from '../src/monsters';
import { PIP_2 } from '../src/levels';
import { play } from './play';
import { alive } from './route';

const { sim, bot } = await play(undefined, 1);
const fail = (m: string) => {
  console.error(`bumpCheck: ${m}`);
  process.exit(1);
};
const hp = sim.ci.hitpts;
const lives = sim.ci.meter[1];
const score = sim.ci.score;
await bot.walk(22, 'past the big one');
if (sim.ci.hitpts !== hp || sim.ci.meter[1] !== lives) fail('walking through the big one cost something');
if (alive(bot, BIG_STILL) !== 1) fail('the big one went away when Kit touched it');
sim.press(SCAN.right);
await bot.wait(54 * 3 + 120);
sim.release(SCAN.right);
const x = bot.px.x / 20;
console.log(`pushed on for 3 seconds: stopped at block ${x.toFixed(2)} (the pip is at ${PIP_2}); hit points ${hp} -> ${sim.ci.hitpts}`);
if (x > PIP_2 - 0.5) fail('Kit got into the pip');
if (x < PIP_2 - 3) fail('Kit did not reach the pip');
if (sim.ci.hitpts !== hp || sim.ci.meter[1] !== lives) fail('touching the pip changed hit points or lives');
if (sim.ci.score !== score + 20) fail(`only the two coins on the way should add to the score; score ${score} -> ${sim.ci.score}`);
if (alive(bot, PIP) !== 1) fail('the pip went away without a star');
console.log('bumpCheck ok');
