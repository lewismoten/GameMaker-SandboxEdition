// The play-testing bot plays the whole game on the built disk. It must win without losing a life.
// route.ts asserts what each sign teaches: an ordinary jump falls short of the ledge, a star gives
// exactly 4 high jumps and one is used landing on it; an ordinary jump falls into the canyon, each
// sneaker gives 50 strides and the leap across lands on the far side.
//   cd web && npx vite-node ../games/power-up/tools/check.ts   (BOT_LOG=1 prints every step)
import { play } from './play';

const { sim } = await play();
console.log(`power-up: the bot played both levels; ${sim.deaths} lives lost, ${sim.ci.lives} left, ${sim.trail.length} scenes entered`);
