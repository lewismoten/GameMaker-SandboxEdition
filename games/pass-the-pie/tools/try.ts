// Plays some of the levels on the built disk, for working on one level at a time (never on the disk):
//   cd web && BOT_LOG=1 FROM=2 UPTO=3 npx vite-node ../games/pass-the-pie/tools/try.ts
// FROM is the first level (0 is the first), UPTO one past the last. Prints the score, hit points and time.
import { play, SEED } from './play';
import { LEVELS } from './route';

const from = Number(process.env.FROM ?? 0);
const upTo = Number(process.env.UPTO ?? LEVELS.length);
const { sim } = await play(SEED, upTo, from);
console.log(`played levels ${from + 1} to ${upTo}: score ${sim.ci.score}, hit points ${sim.ci.hitpts}, ${(sim.clock / 18.2).toFixed(0)} s`);
