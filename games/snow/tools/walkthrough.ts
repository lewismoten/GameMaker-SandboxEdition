// Writes games/snow/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, three levels, the ending).
//   cd web && npx vite-node ../games/snow/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: A Snowy Walk',
  3: 'Level 2: Snow Piles Up',
  4: 'Level 3: Open Snow',
};
await writeSimWalkthrough('snow', sim, SEED, titles);
