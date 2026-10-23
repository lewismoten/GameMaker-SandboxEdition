// The play-testing bot plays the whole game on the built disk without losing a life.
//   cd web && npx vite-node ../games/sweats/tools/check.ts   (BOT_LOG=1 prints every step;
//   SWEATS_UPTO=<scene> stops after that scene)
import { play } from './play';

const { sim } = await play();
console.log(`sweats: the bot took its bow; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
