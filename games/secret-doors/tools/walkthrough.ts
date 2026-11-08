// Writes games/secret-doors/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level, and one more for level 2 after the fall), and games/kit/walkthrough.ts
// checks the run on the real engine (title, three levels, the ending).
//   cd web && npx vite-node ../games/secret-doors/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Level 1: Same Look',
  3: 'Level 2: Bump, Then Bump',
  4: 'Level 3: Coins in the Wall',
};
await writeSimWalkthrough('secret-doors', sim, SEED, titles);
