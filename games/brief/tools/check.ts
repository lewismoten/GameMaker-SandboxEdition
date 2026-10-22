// Proves the library can be finished: the bot plays the whole game (tools/play.ts), every
// wing and book, the Reserve Stacks' gates, the thirty-third book and the ending.
//   cd web && npx vite-node ../games/brief/tools/check.ts [wing id]
import { playThrough } from './play';

await playThrough(process.argv[2]).catch((e) => {
  console.error(`FAIL ${e.message}`);
  process.exitCode = 1;
});
