// Writes games/coins-and-score/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, the three levels, the ending).
//   cd web && npx vite-node ../games/coins-and-score/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Coins Add Points',
  3: 'Level 2: Some Are Worth More',
  4: 'Level 3: Points Are Not Lives',
};
await writeSimWalkthrough('coins-and-score', sim, SEED, titles);
