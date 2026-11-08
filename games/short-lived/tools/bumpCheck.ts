// What the manual says about touching, checked on the built game (the bot plays level 1 first, so
// this starts in level 2):
//   1. Walking into the sleeper stops Kit in front of it with hit points and lives unchanged, and
//      the sleeper is still there (only time changes it).
//   2. Once it has woken, the awake one is not solid: Kit walks through it at no cost, and it is still there.
//   cd web && npx vite-node ../games/short-lived/tools/bumpCheck.ts
import { SCAN } from '../../kit/starter/ids';
import { AWAKE, SLEEPERS } from '../src/monsters';
import { SLEEPER_X } from '../src/levels';
import { play } from './play';
import { alive } from './route';

const { sim, bot } = await play(undefined, 1);
const fail = (m: string) => {
  console.error(`bumpCheck: ${m}`);
  process.exit(1);
};
const hp = sim.ci.hitpts;
const lives = sim.ci.meter[1];
await bot.walk(SLEEPER_X - 2, 'the sleeper');
sim.press(SCAN.right);
await bot.wait(40);
sim.release(SCAN.right);
let x = bot.px.x / 20;
console.log(`pushed on for two seconds: stopped at block ${x.toFixed(2)} (the sleeper is at ${SLEEPER_X}); hit points ${hp} -> ${sim.ci.hitpts}`);
if (alive(bot, SLEEPERS) !== 1) fail('the sleeper woke before the check (the clock runs from the start of the level)');
if (x > SLEEPER_X - 0.5) fail('Kit got into the sleeper');
if (x < SLEEPER_X - 3) fail('Kit did not reach the sleeper');
if (sim.ci.hitpts !== hp || sim.ci.meter[1] !== lives) fail('touching the sleeper changed hit points or lives');
for (let i = 0; i < 100 && alive(bot, SLEEPERS) > 0; i++) await bot.wait(10);
if (alive(bot, AWAKE) !== 1) fail('the sleeper did not become the awake one');
await bot.wait(20);
await bot.walk(20, 'through the awake one');
x = bot.px.x / 20;
if (x < 19.5) fail(`Kit did not get through the awake one (block ${x.toFixed(2)})`);
if (sim.ci.hitpts !== hp || sim.ci.meter[1] !== lives) fail('walking through the awake one cost something');
if (alive(bot, AWAKE) !== 1) fail('the awake one went away when Kit touched it');
console.log('bumpCheck ok');
