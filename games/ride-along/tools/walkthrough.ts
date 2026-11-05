// Writes games/ride-along/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, the three levels, the ending).
//   cd web && npx vite-node ../games/ride-along/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Climb In',
  3: 'Level 2: Lift Off',
  4: 'Level 3: Down the River',
};
await writeSimWalkthrough('ride-along', sim, SEED, titles);
