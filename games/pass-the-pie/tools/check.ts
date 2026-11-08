// The play-testing bot plays the whole game on the built disk without losing a life, and the bumps it takes along
// the way fit a small budget (a person is allowed a few).
//   cd web && npx vite-node ../games/pass-the-pie/tools/check.ts   (BOT_LOG=1 prints every step)
import { play } from './play';
import { BUMP_BUDGET } from './route';

const { sim } = await play();
const lost = 100 - sim.ci.hitpts;
console.log(`pass-the-pie: the bot played all ten levels; score ${sim.ci.score}, ${sim.trail.length} scenes entered, ${sim.ci.hitpts} hit points left`);
if (lost > BUMP_BUDGET) throw new Error(`the bot lost ${lost} hit points to bumps, more than the ${BUMP_BUDGET} a walkthrough should`);
