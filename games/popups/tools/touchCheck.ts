// What the manual says about numbers, checked on the built game (the bot plays level 1 first, so
// this starts in level 2):
//   1. A number is not solid and pays nothing: Kit walks straight through the stuck 100 with hit
//      points and lives unchanged and the score unchanged (the coin paid, the number does not).
//   2. A number that is made to leave does: the last coin's 100 is gone a few seconds after it appears.
//   cd web && npx vite-node ../games/popups/tools/touchCheck.ts
import { STUCKPOP, POP100 } from '../src/monsters';
import { play } from './play';
import { alive } from './route';

const { sim, bot } = await play(undefined, 1);
const fail = (m: string) => {
  console.error(`touchCheck: ${m}`);
  process.exit(1);
};
const hp = sim.ci.hitpts;
const lives = sim.ci.meter[1];
await bot.walk(25, 'the coin that gets stuck');
if (alive(bot, STUCKPOP) !== 1) fail('the stuck coin did not leave its number');
await bot.wait(60);
const score = sim.ci.score;
await bot.walk(29, 'back past the stuck number');
await bot.walk(22, 'through the stuck number');
await bot.walk(29, 'through it again');
if (sim.ci.score !== score) fail(`walking through the number changed the score (${score} -> ${sim.ci.score})`);
if (sim.ci.hitpts !== hp || sim.ci.meter[1] !== lives) fail('walking through the number cost something');
if (alive(bot, STUCKPOP) !== 1) fail('the number went away when Kit touched it');
const before = bot.px.x;
await bot.walk(34, 'the last coin');
let ticks = 0;
while (alive(bot, POP100) > 0 && ticks < 400) {
  await bot.wait(3);
  ticks += 3;
}
if (alive(bot, POP100) !== 0) fail('the last number did not leave');
console.log(`touchCheck ok: numbers are not solid and pay nothing; one rose and left in ${ticks} ticks after Kit stopped (from x ${(before / 20).toFixed(1)})`);
