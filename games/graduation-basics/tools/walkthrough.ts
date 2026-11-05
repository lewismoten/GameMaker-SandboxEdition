// Writes games/graduation-basics/walkthrough.json: the bot plays the whole game on the built disk
// (one key segment a level), and games/kit/walkthrough.ts checks the run on the real engine
// (title, the aisle, the ending).
//   cd web && npx vite-node ../games/graduation-basics/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'The Aisle',
};
await writeSimWalkthrough('graduation-basics', sim, SEED, titles);
