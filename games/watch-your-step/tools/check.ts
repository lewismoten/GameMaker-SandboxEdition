// The play-testing bot plays the whole game on the built disk. It must win, and the only life it
// loses is the one the pool takes on purpose in level 2 (tools/play.ts); route.ts asserts what each
// sign teaches: the lone spike costs exactly 10 hit points once, the pool exactly one life.
//   cd web && npx vite-node ../games/watch-your-step/tools/check.ts   (BOT_LOG=1 prints every step)
import { play } from './play';

const { sim } = await play();
console.log(`watch-your-step: the bot played all three levels; ${sim.deaths} life lost on purpose, ${sim.ci.lives} left, score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
