// Writes games/slippery-and-bouncy/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level, and one more for level 2 after the fall), and games/kit/walkthrough.ts
// checks the run on the real engine (title, three levels, the ending).
//   cd web && npx vite-node ../games/slippery-and-bouncy/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Hit Points',
  3: 'Level 2: Hearts Heal',
  4: 'Level 3: Lives',
};
await writeSimWalkthrough('slippery-and-bouncy', sim, SEED, titles);
