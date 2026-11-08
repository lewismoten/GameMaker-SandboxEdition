// Writes games/quicksand/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and
// games/kit/walkthrough.ts checks the run on the real engine.
//   cd web && npx vite-node ../games/quicksand/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: "Level 1: Don't Stand Still",
  3: 'Level 2: Stepping Stones',
};
await writeSimWalkthrough('quicksand', sim, SEED, titles);
