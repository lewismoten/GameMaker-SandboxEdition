// The play-testing bot plays the whole game on the built disk without losing a life, then again with
// slower hands (about 300 ms between taps, 6 ticks) where the keys are timed.
//   cd web && npx vite-node ../games/tuneup/tools/check.ts   (BOT_LOG=1 prints every step)
import { play } from './play';

const { sim } = await play();
console.log(`tuneup: the bot tuned up THE CHEZ, test-drove it and led the parade; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
const slow = await play(1, undefined, 6);
console.log(`tuneup: with slower hands (6 ticks between taps) it still wins; score ${slow.sim.ci.score}, ${slow.sim.trail.length} scenes entered`);
