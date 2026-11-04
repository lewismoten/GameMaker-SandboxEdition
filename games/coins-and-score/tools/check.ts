// The play-testing bot plays the whole game on the built disk without losing a life.
//   cd web && npx vite-node ../games/coins-and-score/tools/check.ts   (BOT_LOG=1 prints every step)
import { play } from './play';

const { sim } = await play();
console.log(`coins-and-score: the bot played all three levels, took every pickup and lost no life; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
