// The play-testing bot plays the whole game on the built disk. It must win without losing a life;
// route.ts asserts what each sign teaches: he cannot climb out of the pit, the post starts the level over (the coin is back, the score stays), and a ladder, planks and solid blocks each lead out of a pit.
//   cd web && npx vite-node ../games/one-more-try/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { SCAN } from '../../kit/starter/ids';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND, L2, buildLevels } from '../src/levels';
import { play } from './play';

assertNoInvisibleWalls(buildLevels());
const { sim } = await play();
console.log(`try again: the bot played both levels; ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, ${sim.trail.length} scenes entered`);

// PLAYGAME.C:3658-3694 checks whole 20px cells and snaps partial edge landings.
// Exercise the reverse jump the walkthrough does not take: from the right cliff,
// tap Space for 2 ticks, then hold Left for 5-11 ticks (about 0.3-0.6 seconds).
// Only setup positions are assigned; every jump and landing runs the real engine.
const { sim: landingSim, bot } = await play(1, 1);
const cliff = (L2.steps.pit + L2.steps.width) * 20;
await bot.walk(cliff / 20 + 2);
const start = landingSim.snapshot();
for (const offset of [0, 8, 16]) {
  const x = cliff + offset;
  for (const ticks of [5, 7, 9, 11]) {
    landingSim.restore(start);
    landingSim.w.chr.x = [ORIGIN + Math.floor(x / 20), x % 20];
    landingSim.press(SCAN.space);
    await bot.wait(2);
    landingSim.release(SCAN.space);
    landingSim.press(SCAN.left);
    await bot.wait(ticks);
    landingSim.release(SCAN.left);
    await bot.wait(65);
    if (bot.px.y !== (GROUND - 1) * 20 || landingSim.deaths !== 0) {
      throw new Error(`cliff-to-plank jump from ${x}, Left ${ticks} ticks fell to ${JSON.stringify(bot.px)}`);
    }
  }
}
console.log('try again: 12 cliff-to-plank jumps landed at ground height');
