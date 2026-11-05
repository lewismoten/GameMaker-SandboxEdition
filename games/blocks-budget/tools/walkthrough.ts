// Writes games/blocks-budget/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, both levels, the ending).
//   cd web && npx vite-node ../games/blocks-budget/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: One Big Picture',
  3: 'Level 2: Use It Again',
};
await writeSimWalkthrough('blocks-budget', sim, SEED, titles);
